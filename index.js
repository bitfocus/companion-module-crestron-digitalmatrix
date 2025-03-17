import { InstanceBase, InstanceStatus, runEntrypoint, TCPHelper, combineRgb } from '@companion-module/base'
import { ConfigFields } from './config.js'
import { getActionDefinitions } from './actions.js'
import { initFeedbacks } from './feedbacks.js'
import { initPresets } from './presets.js'
import { upgradeScripts } from './upgrade.js'


class CrestronInstance extends InstanceBase {
	async init(config) {
		this.config = config
		
		this.setActionDefinitions(getActionDefinitions(this))

		await this.configUpdated(config)

		this.sources = []
		this.sources.push({id: 0, label: 'Off'})
		this.destinations = []
		this.routingMatrix = {}
	}

	async configUpdated(config) {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		}

		this.config = config
		
		this.setPresetDefinitions(initPresets(this));
		this.sources = []		// Reset sources
		this.sources.push({id: 0, label: 'Off'})
		this.destinations = []	// Reset destinations
		this.routingMatrix = {}	// Reset routes object
		this.variableValues = {}
		this.variableDefinitions = []

		this.init_tcp()
	}

	async destroy() {
		if (this.socket) {
			sendToCrestron("bye") //logout correctly to avoid open terminals
			this.socket.destroy()
		} else {
			this.updateStatus(InstanceStatus.Disconnected)
		}
	}

	// Return config fields for web config
	getConfigFields() {
		return ConfigFields
	}

	sendToCrestron(msg) {
		let sendBuf = Buffer.from(msg + '\r\n', 'latin1')
        this.log('info', 'sending to ' + this.config.host + ': ' + sendBuf.toString())
    
        if (this.socket !== undefined && this.socket.isConnected) {
            this.socket.send(sendBuf)
        } else {
            this.log('info', 'Socket not connected :(')
        }
	}

	init_tcp() {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
			this.socketBuffer = '' // Buffer for incoming data
		}

		this.updateStatus(InstanceStatus.Connecting)

		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
			})

			this.socket.on('error', (err) => {
				this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				this.log('error', 'Network error: ' + err.message)
			})

			this.socket.on('data', (data) => {
				//this.log('debug', 'received chunk: ' + data)
				
				if (typeof this.socketBuffer === 'undefined') {	// make sure the buffer is initialized
					this.socketBuffer = '';
				}
				
				this.socketBuffer += data.toString();	// Save data as string (if it comes in as buffer)
				let endMarkerRegex = /DM-MD\d+x\d+>/;  // detect complete response
				
				if (endMarkerRegex.test(this.socketBuffer)) {
					this.log('debug', 'response: ' + this.socketBuffer)
					this.parseResponse(this.socketBuffer);
					if (this.config.saveresponse) {
						this.setVariableValues({ tcp_response: this.socketBuffer })
					}
					this.socketBuffer = '';  // empty buffer after processing
				}
			});

			this.socket.on('connect', () => {
				this.updateStatus(InstanceStatus.Connecting)
				this.log('debug', 'Websocket connected')	//Connection to Matrix not given
				
				this.sendToCrestron('timedate ' + this.getFormattedDateTime()); // optional. send current Date and Time
				this.getRouting(); // get routes and update feedbacks
			})
		} else {
			this.updateStatus(InstanceStatus.BadConfig)
		}
	}	
	
	async getRouting() {
		const cmd = 'dumpdmrouteinfo'
		this.sendToCrestron(cmd)
		await new Promise(resolve => setTimeout(resolve, 500));
		this.checkFeedbacks();
	}
	
	getFormattedDateTime() {
		const now = new Date();
		const time = now.toLocaleTimeString('de-DE', { hour12: false });
		const date = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
		return `${time} ${date}`;
}

	parseResponse(response) {
		// **Blocked client**:
		// stop trying to reconnect until config is updated
		if (response.match(/ was blocked\./)) {
			this.log('error', response)
			this.socket.options.reconnect = false
		}
		// **Login if credentials are configured**:
		if (response.match(/Login: /)) {
			if (this.config.authentication == false || this.config.username == '' || this.config.password == '' ) {
				this.log('error', 'Crestron DM requires authentication')
				// stop trying to reconnect until config is updated
				this.socket.options.reconnect = false
			}
			else {
				this.log('info', 'Authentication required')
				this.log('info', 'sending username')
				this.sendToCrestron(this.config.username)
			}
		}
		
		if (response == 'Password: ') {
			this.log('info', 'sending password')
			let sendBuf = Buffer.from(this.config.password + '\r\n', 'latin1')
			this.log('info', 'sending to ' + this.config.host + ': xxxxxxxx')
		
			if (this.socket !== undefined && this.socket.isConnected) {
				this.socket.send(sendBuf)
			} else {
				this.log('info', 'Socket not connected :(')
			}
		}
		
		
		// **Matrix Model & successful connection**:
		// interpret welcome message as successful connection and read Matrix model
		// for sources and destinations lists
		
		const modelMatch = response.match(/DM-MD(\d{1,2})x\d{1,2} Control Console\r\n*/);
		if (modelMatch) {
			this.log('info', 'Connected to: ' + modelMatch[0]);
			this.updateStatus(InstanceStatus.Ok)
		//	// refresh source/destination lists according to router model
		//	this.sources = []
		//	this.destinations = []
		//	this.sources.push({id: 0, label: 'Off'})
		//	for (let i = 1; i <= parseInt(modelMatch[1]); i++) {
		//		this.sources.push({id: i, label: i})
		//		this.destinations.push({id: this.config.offset + i, label: i})
		//	}
		//	this.log('info', 'destinations ' + JSON.stringify(this.destinations))
		}
		
		
		// **Matrix Model**:
		// dumpdmstreaminfo
		// read first output stream number for output offset
		/*
		Switch configured for 16x16 
		First Input Stream Number 1 
		Last Input Stream Number 16 
		Max Input Stream  16 
		First Output Stream Number 17 
		Last Output Stream Number 32 
		Max Output Stream  16 
		Total Outputs  40 
		Total Outputs per Stream 25 
		Total Loop back outputs in system 16 
		Local Loop back outputs per stream  1 
		Num DM Transmitters  16 
		First DM Tx Num  1 
		Last DM tx Num  16 
		Num HDMI Transmitters 8 
		First HDMI Tx Num  17 
		Last HDMI tx Num  32 
		Max Copy Display TX Num 32 
		Number Of Groups 1 
		Local Loop back outputs per stream  1
		*/
		
		// process routes for dumpdmrouteinfo feedback
		//the easy way - just for reference
		/*
		let IOregex = /VideoSwitch - Out(\d+)->In(\d+)/g;
		let match;
		while ((match = IOregex.exec(JSON.stringify(response))) !== null) {
			let output = parseInt(match[1]);
			let input = parseInt(match[2]);
			this.routingMatrix.push({Slot: output, Video: input})
		}
		//this.log('debug', JSON.stringify(this.routes))
		*/
		
		
		// **Routing Matrix**:
		// dumpdmrouteinfo
		// read all routes and create list for sources and destinations
		/*
		DM Routing Information for all Output cards 
		Routing Information for Input Card at Slot 1 
		No USB connection 
		Routing Information for Input Card at Slot 2 
		No USB connection 
		Routing Information for Input Card at Slot 8 
		No USB connection 
		...
		Routing Information for Output Card at Slot 17 
		Video Routed From Input Card at slot 1 
		Audio Routed From Input Card at slot 1 
		USB Host Routed to Card at slot 3 
		Hot plug is Low  
		VideoSwitch - Out1->In1
		Routing Information for Output Card at Slot 18 
		Video Routed From Input Card at slot 1 
		Audio Routed From Input Card at slot 1 
		USB Host Routed to Card at slot 1 
		Hot plug is Low  
		VideoSwitch - Out2->In1
		...
		Routing Information for Output Card at Slot 24 
		No Video connection 
		No Audio connection 
		No USB connection 
		Hot plug is Low  
		VideoSwitch - Out8->In0
		*/
		
		let RoutesRegex = /Routing Information for Output Card at Slot (\d{1,2}).*\r\n.*Video(?:.*?(\d{1,2}))?.*\r\n.*Audio(?:.*?(\d{1,2}))?.*\r\n.*USB(?:.*?(\d{1,2}))?.*/g;
		const routesMatches = [...response.matchAll(RoutesRegex)]; // Umwandlung in Array für einfaches Handling
		let i = 1
		
		if (routesMatches && routesMatches.length > 0) {
			if (!this.variableDefinitions || Object.keys(this.variableDefinitions).length === 0) {
				this.log('info','First run! Variables have to be defined.')
				this.firstRun = true
				this.variableDefinitions.push({ name: 'Last TCP Response', variableId: 'tcp_response' });
				this.variableValues['tcp_response'] = '';
			}
			routesMatches.forEach(match => {
				const slot = parseInt(match[1]);
				const video = parseInt(match[2])
				const audio = parseInt(match[3])
				const usb = parseInt(match[4])
			
				this.log('debug', `Slot: ${slot}, Video: ${video}, Audio: ${audio}, USB: ${usb}`);
				this.routingMatrix[slot] = { Video: video, Audio: audio, USB: usb };
				if (this.firstRun) {
					this.variableDefinitions.push({
						name: `Output ${i} Video routed from Input`,
						variableId: `RouteOut${slot}Video`
					});
					this.variableDefinitions.push({
						name: `Output ${i} Audio routed from Input`,
						variableId: `RouteOut${slot}Audio`
					});
					this.variableDefinitions.push({
						name: `Output ${i} USB routed from Input`,
						variableId: `RouteOut${slot}USB`
					});
				}
				this.variableValues[`RouteOut${slot}Video`] = video;
				this.variableValues[`RouteOut${slot}Audio`] = audio;
				this.variableValues[`RouteOut${slot}USB`] = usb;
				this.sources.push({id: i, label: i})
				this.destinations.push({id: slot, label: i})
				i++
			});
			//this.log('info', 'Routing Matrix: ' + JSON.stringify(this.routingMatrix, null, 2));
			if (this.firstRun) {
				this.log('debug', 'Sources: ' + JSON.stringify(this.sources));
				this.log('debug', 'Destinations: ' + JSON.stringify(this.destinations));
				//this.log('debug', 'Variables: ' + JSON.stringify(this.variableDefinitions))
				this.setVariableDefinitions(this.variableDefinitions);
				this.setFeedbackDefinitions(initFeedbacks(this));
				this.firstRun = false
			}
			this.setVariableValues(this.variableValues);
			this.setActionDefinitions(getActionDefinitions(this))
		}
		
	}
	
}

runEntrypoint(CrestronInstance, upgradeScripts)


/*
other interesting commands:
hidhelp all

setfplockout on / off
getfplockout
message string / no parameter = restore previous display
shortmessage like above but with 2s timeout

fan
saveparam


debug 7 1
response if route is set via frontpanel?

*/

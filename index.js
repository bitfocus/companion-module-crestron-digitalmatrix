import { InstanceBase, InstanceStatus, runEntrypoint, TCPHelper, combineRgb } from '@companion-module/base'
import { ConfigFields } from './config.js'
import { getActionDefinitions } from './actions.js'
import { initFeedbacks } from './feedbacks.js'
import { initPresets } from './presets.js'


class CrestronInstance extends InstanceBase {
	async init(config) {
		this.config = config

		this.setActionDefinitions(getActionDefinitions(this))

		await this.configUpdated(config)

		this.sources = []
		this.destinations = []
	}

	async configUpdated(config) {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		}

		this.config = config
		
		this.setPresetDefinitions(initPresets(this));
		this.routes = {}; // Reset routes object
		this.init_tcp()
		this.init_tcp_variables()
	}

	async destroy() {
		if (this.socket) {
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
		}

		this.updateStatus(InstanceStatus.Connecting)

		if (this.config.host && this.config.offset !== undefined) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
			})

			this.socket.on('error', (err) => {
				this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				this.log('error', 'Network error: ' + err.message)
			})

			this.socket.on('data', (data) => {
				let response = data
				response = data.toString()
				
				this.setVariableValues({ tcp_response: response })
				
				//this.log('debug', 'Response: ' + JSON.stringify(response))
				
				// process routes for dumpdmrouteinfo feedback
				const regex = /VideoSwitch - Out(\d+)->In(\d+)/g;
				let match;
				while ((match = regex.exec(JSON.stringify(response))) !== null) {
					let output = parseInt(match[1]);
					let input = parseInt(match[2]);
					this.routes[output] = input;
				}
				this.log('debug', JSON.stringify(this.routes))
				
				if (response.endsWith(' was blocked.\r\n')) {
					this.log('error', response)
					// stop trying to reconnect until config is updated
					this.socket.options.reconnect = false
				}
				
				// login if credentials are configured
				else if (response.endsWith('Login: ')) {
					if (this.config.authentication == false || this.config.username == '' || this.config.password == '' ) {
						this.log('error', 'Crestron DM requires authentication')
						// stop trying to reconnect until config is updated
						this.socket.options.reconnect = false
					}
					else {
						this.log('info', 'Authentication required')
						this.sendToCrestron(this.config.username)
					}
				}

				else if (response == 'Password: ') {
					let sendBuf = Buffer.from(this.config.password + '\r\n', 'latin1')
					this.log('info', 'sending to ' + this.config.host + ': xxxxxxxx')
				
					if (this.socket !== undefined && this.socket.isConnected) {
						this.socket.send(sendBuf)
					} else {
						this.log('info', 'Socket not connected :(')
					}
				}
			})

			this.socket.on('connect', () => {
				this.updateStatus(InstanceStatus.Ok)
				this.log('debug', 'Connected')
				this.sendToCrestron('timedate ' + this.getFormattedDateTime()) // optional. send current Date and Time
				this.getRouting()
				// refresh source/destination lists according to router model
				this.sources = []
				this.destinations = []
				this.sources.push({id: 0, label: 'Off'})
				for (let i = 1; i <= parseInt(this.config.model); i++) {
					this.sources.push({id: i, label: i})
					this.destinations.push({id: this.config.offset + i, label: i})
				}
				this.setActionDefinitions(getActionDefinitions(this))
				this.setFeedbackDefinitions(initFeedbacks(this));
			})
		} else {
			this.updateStatus(InstanceStatus.BadConfig)
		}
	}

	init_tcp_variables() {
		this.setVariableDefinitions([{ name: 'Last TCP Response', variableId: 'tcp_response' }])

		this.setVariableValues({ tcp_response: '' })
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
	
}

runEntrypoint(CrestronInstance, [])

/*
other interesting commands:
hidhelp all

setfplockout on / off
getfplockout
message string / no parameter = restore previous display
shortmessage like above but with 2s timeout

fan
saveparam
*/
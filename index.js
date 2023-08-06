import { InstanceBase, InstanceStatus, runEntrypoint, TCPHelper } from '@companion-module/base'
import { ConfigFields } from './config.js'
import { getActionDefinitions } from './actions.js'

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
				if (this.config.saveresponse) {
					let dataResponse = data

					if (this.config.convertresponse == 'string') {
						dataResponse = data.toString()
					} else if (this.config.convertresponse == 'hex') {
						dataResponse = data.toString('hex')
					}

					this.setVariableValues({ tcp_response: dataResponse })
				}

				let response = data.toString()
				// this.log('debug', 'Response: ' + JSON.stringify(response))
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

				// refresh source/destination lists according to router model
				this.sources = []
				this.destinations = []
				for (let i = 1; i <= parseInt(this.config.model); i++) {
					this.sources.push({id: i, label: i})
					this.destinations.push({id: 100+i, label: i})
				}
				this.setActionDefinitions(getActionDefinitions(this))
			})
		} else {
			this.updateStatus(InstanceStatus.BadConfig)
		}
	}

	init_tcp_variables() {
		this.setVariableDefinitions([{ name: 'Last TCP Response', variableId: 'tcp_response' }])

		this.setVariableValues({ tcp_response: '' })
	}
}

runEntrypoint(CrestronInstance, [])

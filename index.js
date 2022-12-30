const tcp = require('../../tcp')
const instance_skel = require('../../instance_skel')

class instance extends instance_skel {
	/**
	 * Create an instance of the module
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @param {string} id - the instance ID
	 * @param {Object} config - saved user configuration parameters
	 * @since 1.0.0
	 */
	constructor(system, id, config) {
		super(system, id, config)
		this.actions() // export actions
		this.init_presets() // export presets
		this.sources = []
		this.destinations = []
	}

	updateConfig(config) {
		this.init_presets()

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		this.config = config

		this.init_tcp()
	}

	init() {
		this.init_presets()
		this.init_tcp()
	}

	init_tcp() {
		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		this.status(this.STATE_WARNING, 'Connecting')

		if (this.config.host) {
			this.socket = new tcp(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.status(status, message)
			})

			this.socket.on('error', (err) => {
				this.debug('Network error', err)
				this.status(this.STATE_ERROR, err)
				this.log('error', 'Network error: ' + err.message)
			})

			this.socket.on('connect', () => {
				this.status(this.STATE_OK)
				this.debug('Connected')

				// refresh source/destination lists according to router model
				this.sources = []
				this.destinations = []
				for (let i = 1; i <= parseInt(this.config.model); i++) {
					this.sources.push({id: i, label: i})
					this.destinations.push({id: 100+i, label: i})
				}
				this.actions()
			})

			this.socket.on('data', (data) => {
				let response = data.toString()
				this.debug('Response: ' + JSON.stringify(response))
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
					let sendBuf = Buffer.from(this.config.username + '\r\n', 'latin1')
					if (this.socket !== undefined && this.socket.connected) {
						this.socket.send(sendBuf)
					} else {
						this.debug('Socket not connected :(')
					}
				}

				else if (response == 'Password: ') {
					let sendBuf = Buffer.from(this.config.password + '\r\n', 'latin1')
					if (this.socket !== undefined && this.socket.connected) {
						this.socket.send(sendBuf)
					} else {
						this.debug('Socket not connected :(')
					}
				}
			})
		}
	}

	// Return config fields for web config
	config_fields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: this.REGEX_IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				width: 3,
				default: 23,
				regex: this.REGEX_PORT,
			},
			{
				type: 'dropdown',
				id: 'model',
				label: 'Crestron Model',
				width: 6,
				default: '8',
				choices: [
					{ id: '8', label: 'DM-MD8x8' },
					{ id: '16', label: 'DM-MD16x16' },
					{ id: '32', label: 'DM-MD32x32' }
				],
			},
			{
				type: 'checkbox',
				label: 'Authentication',
				id: 'authentication',
				default: false
			},
			{
				type: 'textinput',
				id: 'username',
				label: 'Username',
				width: 6,
				default: '',
				isVisible: (configValues) => configValues.authentication === true,
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				width: 6,
				default: '',
				isVisible: (configValues) => configValues.authentication === true,
			},
		]
	}

	// When module gets deleted
	destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		this.debug('destroy', this.id)
	}

	init_presets() {
		let presets = []
		this.setPresetDefinitions(presets)
	}

	actions(system) {
		this.setActions({
			routeav: {
				label: 'Route AV source to destination',
				options: [
					{
						type: 'dropdown',
						id: 'id_src',
						label: 'Source number:',
						width: 2,
						choices: this.sources
					},
					{
						type: 'dropdown',
						id: 'id_dst',
						label: 'Destination number:',
						width: 2,
						choices: this.destinations
					},
				],
			},
		})
	}

	action(action) {
		let cmd
		let src
		let dst	
		
		switch (action.action) {
			case 'routeav':
				this.parseVariables(action.options.id_src, (value) => {
					src = decodeURI(value);
				})
				this.parseVariables(action.options.id_dst, (value) => {
					dst = decodeURI(value);
				})
				cmd = 'SETAVROUTE ' + src + ' ' + dst + '\r\n'
				break
		}

		/*
		 * create a binary buffer pre-encoded 'latin1' (8bit no change bytes)
		 * sending a string assumes 'utf8' encoding
		 * which then escapes character values over 0x7F
		 * and destroys the 'binary' content
		 */
		let sendBuf = Buffer.from(cmd, 'latin1')
		this.debug('sending ', JSON.stringify(cmd), 'to', this.config.host)

		if (this.socket !== undefined && this.socket.connected) {
			this.socket.send(sendBuf)
		} else {
			this.debug('Socket not connected :(')
		}
	}
}
exports = module.exports = instance

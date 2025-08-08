export function getActionDefinitions(self) {
	return {
		route: {
			name: 'Route source to destination',
			options: [
				{
					type: 'dropdown',
					id: 'id_type',
					label: 'Route type',
					choices: [
						{ id: 'SETAVROUTE', label: 'Audio & Video' },
						{ id: 'SETAVUROUTE', label: 'Audio, Video & USB' },
						{ id: 'SETVIDEOROUTE', label: 'Video' },
						{ id: 'SETAUDIOROUTE', label: 'Audio' },
						{ id: 'SETUSBROUTE', label: 'USB' },
					],
					default: 'SETAVROUTE',
				},
				{
					type: 'checkbox',
					id: 'id_dst_var_cbx',
					label: 'Custom output or variable',
					default: false,
				},
				{
					type: 'textinput',
					id: 'id_dst_var',
					label: 'Output or variable',
					useVariables: true,
					regex: '/^(\\d+|\\$\\(.+\\))/',
					isVisible: (options) => options.id_dst_var_cbx,
				},
				{
					type: 'dropdown',
					id: 'id_dst',
					label: 'Output',
					width: 2,
					choices: self.destinations,
					isVisible: (options) => !options.id_dst_var_cbx,
					default: self.destinations[0].id, // Default to the first destination
				},
				{
					type: 'checkbox',
					id: 'id_src_var_cbx',
					label: 'Custom input or variable',
					default: false,
				},
				{
					type: 'textinput',
					id: 'id_src_var',
					label: 'Input or variable',
					useVariables: true,
					regex: '/^(\\d+|\\$\\(.+\\))/',
					isVisible: (options) => options.id_src_var_cbx,
				},
				{
					type: 'dropdown',
					id: 'id_src',
					label: 'Input',
					width: 2,
					choices: self.sources,
					useVariables: true,
					isVisible: (options) => !options.id_src_var_cbx,
					default: self.sources[0].id, // Default to the first source
				},
			],
			callback: async (action) => {
				let id_dst, id_src
				const id_type = action.options.id_type
				if (action.options.id_dst_var_cbx) {
					if (this.config.debugLogging) self.log('debug', `Destination dropdown (fallback): ${action.options.id_dst}`)
					if (this.config.debugLogging) self.log('debug', `Destination variable: ${action.options.id_dst_var}`)
					id_dst = await self.parseVariablesInString(action.options.id_dst_var)
					id_dst = await self.getSlotOrOff(id_dst, self.destinations, 'Destination')
					if (this.config.debugLogging) self.log('debug', `After getSlotOrOff: ${id_dst}`)
				} else {
					id_dst = action.options.id_dst
				}

				if (action.options.id_src_var_cbx) {
					if (this.config.debugLogging) self.log('debug', `Source dropdown (fallback): ${action.options.id_src}`)
					if (this.config.debugLogging) self.log('debug', `Source variable: ${action.options.id_src_var}`)
					id_src = await self.parseVariablesInString(action.options.id_src_var)
					id_src = await self.getSlotOrOff(id_src, self.sources, 'Source')
					if (this.config.debugLogging) self.log('debug', `After getSlotOrOff: ${id_src}`)
				} else {
					id_src = action.options.id_src
				}

				const cmd = `${id_type} ${id_src} ${id_dst}`
				self.sendToCrestron(cmd)

				await new Promise((resolve) => setTimeout(resolve, 1000))
				self.getRouting() // update routes variable for feedback. changes other than from Stream Deck (e.g. frontpanel) are not taken into account
			},
		},
	}
}

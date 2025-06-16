export function getActionDefinitions(self) {
	return {
		route: {
			name: 'Route source to destination',
			options: [
				{
					type: 'dropdown',
					id: 'id_dst',
					label: 'Output',
					width: 2,
					choices: self.destinations,
				},
				{
					type: 'dropdown',
					id: 'id_src',
					label: 'Input',
					width: 2,
					choices: self.sources,
				},
				{
					type: 'dropdown',
					id: 'id_type',
					label: 'Audio/Video/USB:',
					choices: [
						{ id: 'SETAVROUTE', label: 'Audio & Video' },
						{ id: 'SETAVUROUTE', label: 'Audio, Video & USB' },
						{ id: 'SETVIDEOROUTE', label: 'Video' },
						{ id: 'SETAUDIOROUTE', label: 'Audio' },
						{ id: 'SETUSBROUTE', label: 'USB' },
					],
				},
			],
			callback: async (action) => {
				const cmd = action.options.id_type + ' ' + action.options.id_src + ' ' + action.options.id_dst
				self.sendToCrestron(cmd)

				await new Promise((resolve) => setTimeout(resolve, 1000))
				self.getRouting() // update routes variable for feedback. changes other than from Stream Deck (e.g. frontpanel) are not taken into account
			},
		},
	}
}

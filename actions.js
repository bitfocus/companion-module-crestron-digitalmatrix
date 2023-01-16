export function getActionDefinitions(self) {
	return {
        routeav: {
            name: 'Route AV source to destination',
            options: [
                {
                    type: 'dropdown',
                    id: 'id_src',
                    label: 'Source number:',
                    width: 2,
                    choices: self.sources
                },
                {
                    type: 'dropdown',
                    id: 'id_dst',
                    label: 'Destination number:',
                    width: 2,
                    choices: self.destinations
                },
            ],
            callback: async (action) => {
                const src = await self.parseVariablesInString(action.options.id_src)
                const dst = await self.parseVariablesInString(action.options.id_dst)
                const cmd = 'SETAVROUTE ' + src + ' ' + dst
                self.sendToCrestron(cmd)
            }
        },
	}
}

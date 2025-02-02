export function getActionDefinitions(self) {
	return {
        routeav: {
            name: 'Route AV source to destination',
            options: [
                {
                    type: 'dropdown',
                    id: 'id_dst',
                    label: 'Output',
                    width: 2,
                    choices: self.destinations
                },
                {
                    type: 'dropdown',
                    id: 'id_src',
                    label: 'Input',
                    width: 2,
                    choices: self.sources
                },
            ],
            callback: async (action) => {
                const src = await self.parseVariablesInString(action.options.id_src)
                const dst = await self.parseVariablesInString(action.options.id_dst)
                const cmd = 'SETAVROUTE ' + src + ' ' + dst
                self.sendToCrestron(cmd)
                
                //self.routes[action.options.id_dst - self.config.offset] = action.options.id_src; // update routes variable for feedback. changes other than from Stream Deck (e.g. frontpanel) are not taken into account
                //self.log('debug', JSON.stringify(self.routes))
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                self.getRouting() // alternatively get the routing from matrix. need to test if timing is correct.
            }
        },
	}
}
import { combineRgb } from '@companion-module/base'
export function initFeedbacks(instance) {
	let self = instance;
	return {
		input_routing: {
			type: 'boolean',
			name: 'Input Routing Status',
			description: 'Returns if a route is active',
			defaultStyle: {
				bgcolor: combineRgb(153,204,0),
				color: combineRgb(0,0,0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output',
					width: 2,
                    choices: self.destinations
				},
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					width: 2,
					choices: self.sources
				},
			],
			callback: (feedback) => {
				const input = feedback.options.input;
				const output = feedback.options.output - self.config.offset;
				self.log('debug', 'input: ' + input)
				self.log('debug', 'output: ' + output)
				self.log('debug', 'input for output ' + output + ': ' + self.routes[output])
				return self.routes[output] === input;
			}
		}
	};
}
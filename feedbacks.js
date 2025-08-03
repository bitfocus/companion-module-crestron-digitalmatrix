import { combineRgb } from '@companion-module/base'
export function initFeedbacks(instance) {
	let self = instance
	return {
		output_routing: {
			type: 'boolean',
			name: 'Output Routing Status',
			description: 'Returns true if a route is active',
			defaultStyle: {
				bgcolor: combineRgb(153, 204, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					id: 'id_type',
					label: 'Audio/Video/USB:',
					default: '0',
					choices: [
						{ id: 'Video', label: 'Video' },
						{ id: 'Audio', label: 'Audio' },
						{ id: 'usb', label: 'USB' },
					],
					default: 'Video',
				},
				{
					type: 'checkbox',
					id: 'output_var_cbx',
					label: 'Custom output or variable',
					default: false,
				},
				{
					type: 'textinput',
					id: 'output_var',
					label: 'Output or variable',
					useVariables: true,
					regex: '/^(\\d+|\\$\\(.+\\))/',
					isVisible: (options) => options.output_var_cbx,
				},
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output',
					width: 2,
					choices: self.destinations,
					isVisible: (options) => !options.output_var_cbx,
					default: self.destinations[0].id, // Default to the first destination
				},
				{
					type: 'checkbox',
					id: 'input_var_cbx',
					label: 'Custom input or variable',
					default: false,
				},
				{
					type: 'textinput',
					id: 'input_var',
					label: 'Input or variable',
					useVariables: true,
					regex: '/^(\\d+|\\$\\(.+\\))/',
					isVisible: (options) => options.input_var_cbx,
				},
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					width: 2,
					choices: self.sources,
					isVisible: (options) => !options.input_var_cbx,
					default: self.sources[0].id, // Default to the first source
				},
			],
			callback: async (feedback) => {
				let input, output
				if (feedback.options.output_var_cbx) {
					if (self.config.debugLogging) self.log('debug', `Output dropdown (fallback): ${feedback.options.output}`)
					if (self.config.debugLogging) self.log('debug', `Output variable: ${feedback.options.output_var}`)
					output = await self.parseVariablesInString(feedback.options.output_var)
					output = await self.getSlotOrFallback(output, feedback.options.output, self.destinations, 'Output')
					if (self.config.debugLogging) self.log('debug', `After getSlotOrFallback: ${output}`)
				} else {
					output = feedback.options.output
				}

				if (feedback.options.input_var_cbx) {
					if (self.config.debugLogging) self.log('debug', `Input dropdown (fallback): ${feedback.options.input}`)
					if (self.config.debugLogging) self.log('debug', `Input variable: ${feedback.options.input_var}`)
					input = await self.parseVariablesInString(feedback.options.input_var)
					input = await self.getSlotOrFallback(input, feedback.options.input, self.sources, 'Input')
					if (self.config.debugLogging) self.log('debug', `After getSlotOrFallback: ${input}`)
				} else {
					input = feedback.options.input
				}

				if (self.config.debugLogging)
					self.log('debug', `Feedback Values:: Input: ${input}, Output: ${output}, Type: ${feedback.options.id_type}`)

				// Find chosen output slot in routingMatrix
				const fSlot = self.routingMatrix[output]

				// Select route value type using the selected type
				const routeValue = fSlot ? fSlot[feedback.options.id_type] : null

				if (self.config.debugLogging)
					self.log(
						'debug',
						`${feedback.options.id_type} Route for Out${self.getDestinationLabel(self.destinations, output)} (slot ${output}): In${routeValue}  result: ` +
							(routeValue === input),
					)

				// compare routeValue for given output slot with selected input
				return routeValue === input
			},
		},
	}
}

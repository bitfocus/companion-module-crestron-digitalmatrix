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
					label: 'Output',
					id: 'output',
					width: 2,
					choices: self.destinations,
				},
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					width: 2,
					choices: self.sources,
				},
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
				},
			],
			callback: (feedback) => {
				if (self.config.debugLogging) self.log(
					'debug',
					`Feedback Values:: Input: ${feedback.options.input}, Output: ${feedback.options.output}, Type: ${feedback.options.id_type}`,
				)

				// Find chosen output slot in routingMatrix
				const fSlot = self.routingMatrix[feedback.options.output]

				// Select route value type using the selected type
				const routeValue = fSlot ? fSlot[feedback.options.id_type] : null

				if (self.config.debugLogging) self.log(
					'debug',
					`${feedback.options.id_type} Route for Output ${feedback.options.output}: Input ${routeValue}  result: ` +
						(routeValue === feedback.options.input),
				)

				// compare routeValue for given output slot with selected input
				return routeValue === feedback.options.input
			},
		},
	}
}

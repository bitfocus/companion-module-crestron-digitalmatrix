import { combineRgb } from '@companion-module/base'
export function initPresets(instance) {
	let self = instance;
	let presets = {}
		presets['crestronDM'] = {
			type: 'button',
			category: 'Routing',
			name: 'Route Input to Output and read current routes for feedback',
			style: {
				text: 'Input\\n->\\nOutput',
				textExpression: false,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			options: {
				relativeDelay: false,
				rotaryActions: false,
				stepAutoProgress: true
			},
			steps: [
				{
					down: [
						{
							actionId: 'routeav',
							delay: 0,
							options: {
								id_dst: 1,
								id_src: 1
							},
						},
					],
				},
			],
			feedbacks: [
				{
					feedbackId: 'input_routing',
					options: {
						input: 1,
						output: 17
					},
					style: {bgcolor: combineRgb(0, 0, 0)},
					isInverted: false,
				}
			],
		}
		return presets
}

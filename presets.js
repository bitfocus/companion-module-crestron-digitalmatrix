import { combineRgb } from '@companion-module/base'
export function initPresets(instance) {
	let self = instance
	let presets = {}
	presets['crestronDM'] = {
		type: 'button',
		category: 'Routing',
		name: 'Route AV Input to Output and read current route for feedback',
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
			stepAutoProgress: true,
		},
		steps: [
			{
				down: [
					{
						actionId: 'route',
						delay: 0,
						options: {
							id_dst: self.destinations?.[0].id,
							id_src: 1,
							id_type: 'SETAVROUTE',
						},
					},
				],
			},
		],
		feedbacks: [
			{
				feedbackId: 'output_routing',
				options: {
					input: 1,
					output: self.destinations?.[0].id,
					id_type: 'Video',
				},
				style: { bgcolor: combineRgb(0, 0, 0) },
				isInverted: false,
			},
		],
	}
	return presets
}

export const upgradeScripts = [
	function v2_0_0(context, props) {
		const result = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}
		console.log('Upgrade script v2.0.0 running...')
		// console.log('Upgrading actions:', props.actions)
		for (const action of props.actions) {
			// upgrade older actions
			//if (['routeav', 'otherId'].includes(action.actionId)) { // if multiple actions have to be changed
			if (action.actionId === 'routeav') {
				action.actionId = 'route' // change to new actionId
				action.options.id_type = 'SETAVROUTE' // old action was AV route
				result.updatedActions.push(action)
			}
		}

		// console.log('Upgrading feedbacks:', props.feedbacks)
		for (const feedback of props.feedbacks) {
			// upgrade older feedbacks
			if (feedback.feedbackId === 'input_routing') {
				feedback.feedbackId = 'output_routing' // set new feedback-ID
				feedback.options.id_type = 'Video' // set new option for route type
				result.updatedFeedbacks.push(feedback)
			}
		}
		// console.log('Upgraded Actions:', JSON.stringify(result.updatedActions, null, 2))
		// console.log('Upgraded Feedbacks:', JSON.stringify(result.updatedFeedbacks, null, 2))

		return result
	},
	function v2_1_0(context, props) {
		const result = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}
		console.log('Upgrade script v2.1.0 running...')
		// console.log('Upgrading config:', props.config)
		if (props.config.pollInterval === undefined) {
			props.config.pollInterval = 0
			result.updatedConfig = props.config
		}
		if (props.config.debugLogging === undefined) {
			props.config.debugLogging = false
			result.updatedConfig = props.config
		}
		// console.log('Upgrading actions:', props.actions)
		for (const action of props.actions) {
			// upgrade older actions
			if (action.actionId === 'route') {
				if (action.options.id_dst_var_cbx === undefined) {
					action.options.id_dst_var_cbx = false
					result.updatedActions.push(action)
				}
				if (action.options.id_src_var_cbx === undefined) {
					action.options.id_src_var_cbx = false
					result.updatedActions.push(action)
				}
				if (action.options.id_dst_var === undefined) {
					action.options.id_dst_var = ''
					result.updatedActions.push(action)
				}
				if (action.options.id_src_var === undefined) {
					action.options.id_src_var = ''
					result.updatedActions.push(action)
				}
			}
		}
		// console.log('Upgrading feedbacks:', props.feedbacks)
		for (const feedback of props.feedbacks) {
			// upgrade older feedbacks
			if (feedback.feedbackId === 'output_routing') {
				if (feedback.options.output_var_cbx === undefined) {
					feedback.options.output_var_cbx = false
					result.updatedFeedbacks.push(feedback)
				}
				if (feedback.options.input_var_cbx === undefined) {
					feedback.options.input_var_cbx = false
					result.updatedFeedbacks.push(feedback)
				}
				if (feedback.options.output_var === undefined) {
					feedback.options.output_var = ''
					result.updatedFeedbacks.push(feedback)
				}
				if (feedback.options.input_var === undefined) {
					feedback.options.input_var = ''
					result.updatedFeedbacks.push(feedback)
				}
			}
		}
		// console.log('Upgraded Config:', JSON.stringify(result.updatedConfig, null, 2))
		// console.log('Upgraded Actions:', JSON.stringify(result.updatedActions, null, 2))
		// console.log('Upgraded Feedbacks:', JSON.stringify(result.updatedFeedbacks, null, 2))
		return result
	},
]

export const upgradeScripts = [
	function v2_0_0(context, props) {
		const result = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}
		console.log('Upgrading actions:', props.actions)
		for (const action of props.actions) {
			// upgrade older actions
			//if (['routeav', 'otherId'].includes(action.actionId)) { // if multiple actions have to be changed
			if (action.actionId === 'routeav') {
				action.actionId = 'route' // change to new actionId
				action.options.id_type = 'SETAVROUTE' // old action was AV route
				result.updatedActions.push(action)
			}
		}

		console.log('Upgrading feedbacks:', props.feedbacks)
		for (const feedback of props.feedbacks) {
			// upgrade older feedbacks
			if (feedback.feedbackId === 'input_routing') {
				feedback.feedbackId = 'output_routing' // set new feedback-ID
				feedback.options.id_type = 'Video' // set new option for route type
				result.updatedFeedbacks.push(feedback)
			}
		}
		console.log('Upgraded Actions:', JSON.stringify(result.updatedActions, null, 2))
		console.log('Upgraded Feedbacks:', JSON.stringify(result.updatedFeedbacks, null, 2))

		return result
	},
]

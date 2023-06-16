package expo.modules.updates.statemachine

import org.json.JSONObject

/**
Structure representing an event that can be sent to the machine.
Convenience getters are provided to get derived properties that will be
used to modify the context when the machine processes an event.
 */
data class UpdatesStateEvent(
  val type: UpdatesStateEventType,
  val body: Map<String, Any> = mapOf()
) {
  val manifest: JSONObject?
    get() {
      return body["manifest"] as? JSONObject
    }
  val error: UpdatesStateError?
    get() {
      val message = body["message"] as? String?
      return if (message != null) {
        val error = UpdatesStateError(message)
        error
      } else {
        null
      }
    }
  val isRollback: Boolean
    get() {
      return body["isRollBackToEmbedded"] as? Boolean ?: false
    }
}

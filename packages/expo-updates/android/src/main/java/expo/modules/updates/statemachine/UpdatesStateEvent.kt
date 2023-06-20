package expo.modules.updates.statemachine

import org.json.JSONObject

/**
Structure representing an event that can be sent to the machine.
 */
data class UpdatesStateEvent(
  val type: UpdatesStateEventType,
  val manifest: JSONObject? = null,
  private val errorMessage: String? = null,
  val isRollback: Boolean = false
) {
  val error: UpdatesStateError?
    get() {
      return errorMessage?.let { UpdatesStateError(it) }
    }
}

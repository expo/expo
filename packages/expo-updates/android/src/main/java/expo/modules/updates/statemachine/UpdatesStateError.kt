package expo.modules.updates.statemachine

/**
 * For the state machine, errors are stored as data objects.
 * For now, we just have the "message" property.
 */
data class UpdatesStateError(
  var message: String
) {
  val json: MutableMap<String, String>
    get() {
      return mutableMapOf(
        "message" to message
      )
    }
}

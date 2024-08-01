package expo.modules.updates.statemachine

/**
 * For the state machine, errors are stored as data objects.
 * For now, we just have the "message" property.
 */
data class UpdatesStateError(
  val message: String
) {
  val json: Map<String, String>
    get() {
      return mapOf(
        "message" to message
      )
    }
}

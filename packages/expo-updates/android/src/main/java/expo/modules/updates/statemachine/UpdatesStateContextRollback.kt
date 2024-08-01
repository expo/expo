package expo.modules.updates.statemachine

import java.util.Date

data class UpdatesStateContextRollback(
  val commitTime: Date
) {

  val commitTimeString: String
    get() = UpdatesStateContext.DATE_FORMATTER.format(commitTime)

  val json: Map<String, Any>
    get() = mapOf("commitTime" to commitTimeString)
}

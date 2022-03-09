package expo.modules.kotlin.views

class GroupViewDefinition(
  private val actions: Map<GroupViewAction.Action, GroupViewAction>
) {
  internal fun hasAction(action: GroupViewAction.Action) = actions.containsKey(action)

  internal inline fun <reified T> callAction(action: GroupViewAction.Action, payload: GroupViewAction.Payload): T {
    val result = actions[action]?.body?.invoke(payload)
    require(T::class == Unit::class || result is T) { "Invalid groupView callback return type for '$action'" }
    return result as T
  }
}

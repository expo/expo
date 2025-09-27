package expo.modules.devmenu.compose

sealed class DevMenuAction(val shouldCloseMenu: Boolean = false) {
  object Open : DevMenuAction()
  object Close : DevMenuAction()
  object Reload : DevMenuAction(shouldCloseMenu = true)
  object GoHome : DevMenuAction(shouldCloseMenu = true)
  object TogglePerformanceMonitor : DevMenuAction(shouldCloseMenu = true)
  object ToggleElementInspector : DevMenuAction(shouldCloseMenu = true)
  object ToggleFab : DevMenuAction(shouldCloseMenu = false)
  object OpenJSDebugger : DevMenuAction(shouldCloseMenu = true)
  data class ToggleFastRefresh(val newValue: Boolean) : DevMenuAction(shouldCloseMenu = false)
  object OpenReactNativeDevMenu : DevMenuAction(shouldCloseMenu = true)
  object FinishOnboarding : DevMenuAction(shouldCloseMenu = false)
  data class TriggerCustomCallback(
    val name: String,
    val shouldCollapse: Boolean
  ) : DevMenuAction(shouldCloseMenu = shouldCollapse)
}

typealias DevMenuActionHandler = (DevMenuAction) -> Unit

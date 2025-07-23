package expo.modules.devmenu.compose

sealed class DevMenuAction(val shouldCloseMenu: Boolean = false) {
  object Open : DevMenuAction()
  object Close : DevMenuAction()
  object Reload : DevMenuAction(shouldCloseMenu = true)
  object GoHome : DevMenuAction(shouldCloseMenu = true)
  object TogglePerformanceMonitor : DevMenuAction(shouldCloseMenu = true)
  object ToggleElementInspector : DevMenuAction(shouldCloseMenu = true)
  object OpenJSDebugger : DevMenuAction(shouldCloseMenu = true)
  data class ToggleFastRefresh(val newValue: Boolean) : DevMenuAction(shouldCloseMenu = true)
  object OpenReactNativeDevMenu : DevMenuAction(shouldCloseMenu = true)
  object FinishOnboarding : DevMenuAction(shouldCloseMenu = false)
}

typealias DevMenuActionHandler = (DevMenuAction) -> Unit

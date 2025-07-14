package expo.modules.devmenu.compose

sealed interface DevMenuAction {
  object Open : DevMenuAction
  object Close : DevMenuAction
  object Reload : DevMenuAction
  object GoHome : DevMenuAction
  object TogglePerformanceMonitor : DevMenuAction
  object ToggleElementInspector : DevMenuAction
  object OpenJSDebugger : DevMenuAction
  data class ToggleFastRefresh(val newValue: Boolean) : DevMenuAction
  object OpenReactNativeDevMenu : DevMenuAction
}

typealias DevMenuActionHandler = (DevMenuAction) -> Unit

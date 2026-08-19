package expo.modules.devmenu.api

/**
 * Implemented by a host's DevSupportManager when it replaces React Native's FPS overlay with its
 * own performance monitor. The dev menu reads the monitor state from here, so the host can keep
 * `DevSettings.isFpsDebugEnabled` false and the built-in overlay never shows.
 */
interface CustomPerformanceMonitor {
  val isPerformanceMonitorShown: Boolean
}

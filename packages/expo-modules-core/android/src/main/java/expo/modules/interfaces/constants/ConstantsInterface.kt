package expo.modules.interfaces.constants

import expo.modules.kotlin.services.Service

interface ConstantsInterface : Service {
  val constants: Map<String, Any?>
  val appScopeKey: String?
  val deviceName: String
  val statusBarHeight: Int
  val systemVersion: String
  val systemFonts: List<String>
}

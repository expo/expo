/**
 A struct containing some app launch information that can be used to detect whether:
 1) it was a cold or warm launch, 2) the device was rebooted, 3) the app was updated.
 State of the previous app launch is stored in `AppMetricsUserDefaults.lastAppLaunchState`,
 but is overridden with the current state once the app is fully launched.
 */
internal struct AppLaunchState: Codable {
  var bootTime: TimeInterval = Sysctl.getSystemBootTime()
  var systemVersion: String = DeviceInfo.current.systemVersion
  var buildNumber: String? = AppInfo.current.buildNumber
}

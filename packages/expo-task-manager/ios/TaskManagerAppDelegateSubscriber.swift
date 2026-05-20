import ExpoModulesCore

public class TaskManagerAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    EXTaskService.shared.applicationDidFinishLaunching(options: launchOptions)
    return false
  }

  public func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    EXTaskService.shared.runTasks(with: EXTaskLaunchReasonBackgroundFetch, userInfo: nil, completionHandler: completionHandler)
  }

  public func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    EXTaskService.shared.runTasks(with: EXTaskLaunchReasonRemoteNotification, userInfo: userInfo, completionHandler: completionHandler)
  }
}

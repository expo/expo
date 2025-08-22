import ExpoModulesCore

public class InsightsAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    var kinfo = kinfo_proc()
    var size = MemoryLayout<kinfo_proc>.stride
    var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
    sysctl(&mib, u_int(mib.count), &kinfo, &size, nil, 0)
    let startTime = kinfo.kp_proc.p_starttime
    let startTimeSeconds = (TimeInterval(startTime.tv_sec) + TimeInterval(startTime.tv_usec) / 1_000_000)

    Insights.shared.send(event: "PROCESS_START", at: Date(timeIntervalSince1970: startTimeSeconds))
    return true
  }
}

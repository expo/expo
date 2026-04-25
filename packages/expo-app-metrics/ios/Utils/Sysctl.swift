import Darwin.sys.sysctl

/**
 Contains utils that call into kernel's `sysctl` function.
 */
internal struct Sysctl {
  /**
   Returns seconds since Unix epoch (January 1, 1970) when the device booted.
   */
  static func getSystemBootTime() -> TimeInterval {
    var mib: [Int32] = [CTL_KERN, KERN_BOOTTIME]
    var bootTime = timeval()
    var size = MemoryLayout<timeval>.stride
    let result = sysctl(&mib, UInt32(mib.count), &bootTime, &size, nil, 0)

    guard result == 0 else {
      // sysctl failed, return 0
      return 0
    }
    // Convert timeval to TimeInterval (seconds since epoch)
    return TimeInterval(bootTime.tv_sec) + TimeInterval(bootTime.tv_usec) / 1_000_000.0
  }
}

import Darwin

struct MemoryUsageSnapshot: Metrics, CustomStringConvertible, Sendable {
  enum MetricKeys: String, MetricKey {
    case residentSize = "allocated"
    case memoryFootprint = "physical"
    case freeMemory = "available"
  }

  static let category: Metric.Category? = .memory

  let residentSize: UInt
  let memoryFootprint: UInt
  let freeMemory: UInt

  // MARK: - Encodable

  enum CodingKeys: String, CodingKey {
    case memoryFootprint = "allocated"
    case residentSize = "physical"
    case freeMemory = "available"
  }

  // MARK: - CustomStringConvertible

  var description: String {
    return """
MemoryUsageSnapshot {
  \(memoryFootprint.formatted(.byteCount(style: .memory))) allocated,
  \(residentSize.formatted(.byteCount(style: .memory))) physical,
  \(freeMemory.formatted(.byteCount(style: .memory))) available
}
"""
  }

  // MARK: - Statics

  static func getCurrent() -> MemoryUsageSnapshot {
    return MemoryUsageSnapshot(
      residentSize: getResidentSize(),
      memoryFootprint: getMemoryFootprint(),
      freeMemory: getFreeMemory()
    )
  }

  private static func getResidentSize() -> UInt {
    var info = task_basic_info()
    var size = mach_msg_type_number_t(MemoryLayout<task_basic_info>.size / MemoryLayout<integer_t>.size)
    let kerr: kern_return_t = withUnsafeMutablePointer(to: &info) {
      $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
        task_info(mach_task_self_, task_flavor_t(TASK_BASIC_INFO), $0, &size)
      }
    }
    return (kerr == KERN_SUCCESS) ? info.resident_size : 0
  }

  private static func getMemoryFootprint() -> UInt {
    let TASK_VM_INFO_COUNT = mach_msg_type_number_t(MemoryLayout<task_vm_info_data_t>.size / MemoryLayout<integer_t>.size)
    let TASK_VM_INFO_REV1_COUNT = mach_msg_type_number_t(MemoryLayout.offset(of: \task_vm_info_data_t.min_address)! / MemoryLayout<integer_t>.size)
    var info = task_vm_info_data_t()
    var count = TASK_VM_INFO_COUNT
    let kerr = withUnsafeMutablePointer(to: &info) { infoPtr in
      infoPtr.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { intPtr in
        task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), intPtr, &count)
      }
    }
    guard kerr == KERN_SUCCESS, count >= TASK_VM_INFO_REV1_COUNT else {
      return 0
    }
    return UInt(info.phys_footprint)
  }

  private static func getFreeMemory() -> UInt {
    return UInt(os_proc_available_memory())
  }
}

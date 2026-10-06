import Testing

@testable import ExpoAppMetrics

@Suite("MemoryMonitoring")
struct MemoryMonitoringTests {
  @Test
  func `builds an expo.memory.warning event from the snapshot`() throws {
    let snapshot = MemoryUsageSnapshot(
      residentSize: 200,
      memoryFootprint: 100,
      freeMemory: 300
    )
    let record = makeMemoryWarningLogRecord(snapshot: snapshot, warningsCount: 2)

    #expect(record.name == "expo.memory.warning")
    #expect(record.severity == .warn)

    let attributes = try #require(record.attributes?.value as? [String: Any])
    #expect(attributes["expo.memory.allocated"] as? UInt == 100)
    #expect(attributes["expo.memory.physical"] as? UInt == 200)
    #expect(attributes["expo.memory.available"] as? UInt == 300)
    #expect(attributes["expo.memory.warningsCount"] as? Int == 2)
  }

  @Test
  func `omits available memory when it is 0`() throws {
    // `os_proc_available_memory()` returns 0 on the simulator (no jetsam limit), so the attribute is
    // dropped rather than recorded as a meaningless 0.
    let snapshot = MemoryUsageSnapshot(
      residentSize: 200,
      memoryFootprint: 100,
      freeMemory: 0
    )
    let record = makeMemoryWarningLogRecord(snapshot: snapshot, warningsCount: 1)

    let attributes = try #require(record.attributes?.value as? [String: Any])
    #expect(attributes["expo.memory.available"] == nil)
    #expect(attributes["expo.memory.allocated"] as? UInt == 100)
  }
}

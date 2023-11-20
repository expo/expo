import ExpoModulesTestCore

@testable import ExpoModulesCore

class PersistentFileLogSpec: ExpoSpec {
  override class func spec() {
    let log = PersistentFileLog(category: "dev.expo.modules.test.persistentlog")

    beforeEach {
      self.clearEntriesSync(log: log)
    }

    it("cleared file has 0 entries") {
      let entries = log.readEntries()
      expect(entries.count).to(equal(0))
    }

    it("append one entry works") {
      appendEntrySync(log: log, entry: "Test string 1")
      let entries = log.readEntries()
      expect(entries).notTo(beNil())
      expect(entries.count).to(equal(1))
      expect(entries[0]).to(equal("Test string 1"))
    }

    it("append three entries works") {
      appendEntrySync(log: log, entry: "Test string 1")
      appendEntrySync(log: log, entry: "Test string 2")
      appendEntrySync(log: log, entry: "Test string 3")
      let entries = log.readEntries()
      expect(entries.count).to(equal(3))
      expect(entries[0]).to(equal("Test string 1"))
      expect(entries[1]).to(equal("Test string 2"))
    }

    it("filter entries works") {
      appendEntrySync(log: log, entry: "Test string 1")
      appendEntrySync(log: log, entry: "Test string 2")
      appendEntrySync(log: log, entry: "Test string 3")
      filterEntriesSync(log: log) { entry in
        entry.contains("2")
      }
      let entries = log.readEntries()
      expect(entries).notTo(beNil())
      expect(entries.count).to(equal(1))
      expect(entries[0]).to(equal("Test string 2"))
    }
  }

  static func clearEntriesSync(log: PersistentFileLog) {
    var didClear = false
    log.clearEntries { _ in
      didClear = true
    }
    expect(didClear).toEventually(beTrue(), timeout: .milliseconds(500))
  }

  static func filterEntriesSync(log: PersistentFileLog, filter: @escaping PersistentFileLogFilter) {
    var didPurge = false
    log.purgeEntriesNotMatchingFilter(filter: filter) { _ in
      didPurge = true
    }
    expect(didPurge).toEventually(beTrue(), timeout: .milliseconds(500))
  }

  static func appendEntrySync(log: PersistentFileLog, entry: String) {
    var didAppend = false
    log.appendEntry(entry: entry) { _ in
      didAppend = true
    }
    expect(didAppend).toEventually(beTrue(), timeout: .milliseconds(500))
  }
}

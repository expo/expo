import ExpoModulesTestCore

@testable import ExpoModulesCore

class PersistentFileLogSpec: ExpoSpec {
  let serialQueue = DispatchQueue(label: "dev.expo.modules.test.persistentlog")

  let log = PersistentFileLog(category: "dev.expo.modules.test.persistentlog")

  func clearEntriesSync() {
    serialQueue.sync {
      let sem = DispatchSemaphore(value: 0)
      log.clearEntries { _ in
        sem.signal()
      }
      sem.wait()
    }
  }

  func filterEntriesSync(filter: @escaping PersistentFileLogFilter) {
    serialQueue.sync {
      let sem = DispatchSemaphore(value: 0)
      log.filterEntries(filter: filter) { _ in
        sem.signal()
      }
      sem.wait()
    }
  }

  func appendEntrySync(entry: String) {
    serialQueue.sync {
      let sem = DispatchSemaphore(value: 0)
      log.appendEntry(entry: entry) { _ in
        sem.signal()
      }
      sem.wait()
    }
  }

  override func spec() {
    beforeEach {
      self.clearEntriesSync()
    }

    it("cleared file has 0 entries") {
      let entries = self.log.readEntries()
      expect(entries.count).to(be(0))
    }

    it("append one entry works") {
      self.appendEntrySync(entry: "Test string 1")
      let entries = self.log.readEntries()
      expect(entries).notTo(beNil())
      expect(entries.count).to(be(1))
      expect(entries[0]).to(equal("Test string 1"))
    }

    it("append three entries works") {
      self.appendEntrySync(entry: "Test string 1")
      self.appendEntrySync(entry: "Test string 2")
      self.appendEntrySync(entry: "Test string 3")
      let entries = self.log.readEntries()
      expect(entries.count).to(be(3))
      expect(entries[0]).to(equal("Test string 1"))
      expect(entries[1]).to(equal("Test string 2"))
    }

    it("filter entries works") {
      self.appendEntrySync(entry: "Test string 1")
      self.appendEntrySync(entry: "Test string 2")
      self.appendEntrySync(entry: "Test string 3")
      self.filterEntriesSync { entry in
        entry.contains("2")
      }
      let entries = self.log.readEntries()
      expect(entries).notTo(beNil())
      expect(entries.count).to(be(1))
      expect(entries[0]).to(equal("Test string 2"))
    }
  }
}

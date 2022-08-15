import ExpoModulesTestCore

@testable import ExpoModulesCore

class PersistentFileLogSpec: ExpoSpec {
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

  // Private fields and methods

  let log = PersistentFileLog(category: "dev.expo.modules.test.persistentlog")

  func clearEntriesSync() {
    let expectation = self.expectation(description: "entries cleared")
    log.clearEntries { _ in
      expectation.fulfill()
    }
    wait(for: [expectation], timeout: 0.5)
  }

  func filterEntriesSync(filter: @escaping PersistentFileLogFilter) {
    let expectation = self.expectation(description: "entries filtered")
    log.purgeEntriesNotMatchingFilter(filter: filter) { _ in
      expectation.fulfill()
    }
    wait(for: [expectation], timeout: 0.5)
  }

  func appendEntrySync(entry: String) {
    let expectation = self.expectation(description: "entry appended")
    log.appendEntry(entry: entry) { _ in
      expectation.fulfill()
    }
    wait(for: [expectation], timeout: 0.5)
  }
}

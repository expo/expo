// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

@MainActor
final class EditOverlayTests: XCTestCase {
  func testRecordAndReadBack() {
    let overlay = EditOverlay()
    overlay.recordEdit(path: "App.js", original: "a", newContents: "b")
    XCTAssertEqual(overlay.currentContents(forPath: "App.js"), "b")
    XCTAssertTrue(overlay.hasEdits)
  }

  func testSecondEditKeepsFirstOriginal() {
    let overlay = EditOverlay()
    overlay.recordEdit(path: "App.js", original: "a", newContents: "b")
    overlay.recordEdit(path: "App.js", original: "b", newContents: "c")
    XCTAssertEqual(overlay.edits["App.js"]?.original, "a")
    XCTAssertEqual(overlay.currentContents(forPath: "App.js"), "c")
  }

  func testEditBackToOriginalClearsTheEntry() {
    let overlay = EditOverlay()
    overlay.recordEdit(path: "App.js", original: "a", newContents: "b")
    overlay.recordEdit(path: "App.js", original: "b", newContents: "a")
    XCTAssertFalse(overlay.hasEdits)
    XCTAssertNil(overlay.currentContents(forPath: "App.js"))
  }

  func testRevertAll() {
    let overlay = EditOverlay()
    overlay.recordEdit(path: "a.js", original: "1", newContents: "2")
    overlay.recordEdit(path: "b.js", original: "3", newContents: "4")
    overlay.revertAll()
    XCTAssertFalse(overlay.hasEdits)
  }

  func testUntouchedPathReturnsNil() {
    XCTAssertNil(EditOverlay().currentContents(forPath: "x.js"))
  }
}

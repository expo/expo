// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class SnackDiffTests: XCTestCase {

  func testGenerateWithEmptyNewContentsReturnsEmptyString() {
    XCTAssertEqual(SnackDiff.generateUnifiedDiff(oldContents: "anything", newContents: ""), "")
  }

  func testGenerateMatchesNpmCreatePatchFormat() {
    let diff = SnackDiff.generateUnifiedDiff(oldContents: "", newContents: "a\nb\n")
    let expected =
      "Index: code\n" +
      "===================================================================\n" +
      "--- code\t\n" +
      "+++ code\t\n" +
      "@@ -1,0 +1,2 @@\n" +
      "+a\n" +
      "+b\n"
    XCTAssertEqual(diff, expected)
  }

  func testGenerateAddsNoNewlineMarkerWhenContentLacksTrailingNewline() {
    let diff = SnackDiff.generateUnifiedDiff(oldContents: "", newContents: "a\nb")
    XCTAssertTrue(diff.hasSuffix("+b\n\\ No newline at end of file\n"))
    XCTAssertTrue(diff.contains("@@ -1,0 +1,2 @@\n"))
  }

  func testGenerateIgnoresOldContents() {
    let a = SnackDiff.generateUnifiedDiff(oldContents: "", newContents: "x\n")
    let b = SnackDiff.generateUnifiedDiff(oldContents: "totally different", newContents: "x\n")
    XCTAssertEqual(a, b)
  }

  func testApplyEmptyPatchReturnsBase() {
    XCTAssertEqual(SnackDiff.apply("", to: "base\n"), "base\n")
    XCTAssertEqual(SnackDiff.apply("  \n", to: "base\n"), "base\n")
  }

  func testApplyRoundtripOntoEmptyBaseDropsTrailingNewline() {
    let diff = SnackDiff.generateUnifiedDiff(oldContents: "", newContents: "line1\nline2\nline3\n")
    XCTAssertEqual(SnackDiff.apply(diff, to: ""), "line1\nline2\nline3")
  }

  func testApplyRoundtripOntoEmptyBaseWithoutTrailingNewline() {
    let content = "line1\nline2"
    let diff = SnackDiff.generateUnifiedDiff(oldContents: "", newContents: content)
    XCTAssertEqual(SnackDiff.apply(diff, to: ""), content)
  }

  func testApplyRealDiffOntoExistingBase() {
    let base = "line1\nline2\nline3\n"
    let patch =
      "Index: code\n" +
      "===================================================================\n" +
      "--- code\t\n" +
      "+++ code\t\n" +
      "@@ -1,3 +1,3 @@\n" +
      " line1\n" +
      "-line2\n" +
      "+changed\n" +
      " line3\n"
    XCTAssertEqual(SnackDiff.apply(patch, to: base), "line1\nchanged\nline3\n")
  }

  func testApplyMalformedHunkHeaderDoesNotCrash() {
    let patch =
      "Index: code\n" +
      "===================================================================\n" +
      "--- code\t\n" +
      "+++ code\t\n" +
      "@@ -99999999999999999999,5 +1,5 @@\n" +
      "+still here\n"
    let result = SnackDiff.apply(patch, to: "base\n")
    XCTAssertTrue(result.contains("still here"))
  }
}

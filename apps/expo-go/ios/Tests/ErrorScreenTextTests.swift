// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class ErrorScreenTextTests: XCTestCase {
  func testBoldMarkersBecomeBoldText() {
    let text = ErrorScreenText.attributed("Sign in as **alan** to continue.")

    XCTAssertEqual(String(text.characters), "Sign in as alan to continue.")
    let boldRuns = text.runs.filter { $0.inlinePresentationIntent == .stronglyEmphasized }
    XCTAssertEqual(boldRuns.map { String(text[$0.range].characters) }, ["alan"])
  }

  func testMarkdownLinksBecomeLinks() {
    let text = ErrorScreenText.attributed("Read [the docs](https://docs.expo.dev) first.")

    XCTAssertEqual(String(text.characters), "Read the docs first.")
    let linkRuns = text.runs.filter { $0.link != nil }
    XCTAssertEqual(linkRuns.map { String(text[$0.range].characters) }, ["the docs"])
    XCTAssertEqual(linkRuns.first?.link, URL(string: "https://docs.expo.dev"))
  }

  func testBareURLsBecomeLinks() {
    let text = ErrorScreenText.attributed("Could not load\n\nhttps://u.expo.dev/abc")

    XCTAssertEqual(String(text.characters), "Could not load\n\nhttps://u.expo.dev/abc")
    XCTAssertEqual(text.runs.compactMap(\.link), [URL(string: "https://u.expo.dev/abc")!])
  }

  func testUnderscoresAndSingleAsterisksStayLiteral() {
    let text = ErrorScreenText.attributed("Signed in as partner_user_1 * 2")

    XCTAssertEqual(String(text.characters), "Signed in as partner_user_1 * 2")
    XCTAssertTrue(text.runs.allSatisfy { $0.inlinePresentationIntent == nil })
  }

  func testPlainTextIsUnchanged() {
    XCTAssertEqual(String(ErrorScreenText.attributed("Nothing special.").characters), "Nothing special.")
  }
}

import XCTest
@testable import Expo_Go

final class ScopedNotificationsIdTests: XCTestCase {
  func testUnicodeIdentifiersKeepTheirScopeAndValue() {
    for scope in ["project", "@expo/proj🚀"] {
      for identifier in ["a🚀z", "🚀/", "cafe\u{301}", "/\u{301}abc", "\\\u{301}abc"] {
        let scoped = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scope)

        XCTAssertTrue(EXScopedNotificationsUtils.isId(scoped, scopedByExperience: scope))
        XCTAssertEqual(EXScopedNotificationsUtils.getUnscopedIdentifier(fromScopedIdentifier: scoped), identifier)
      }
    }
  }

  func testLegacyStoredIdentifiersKeepTheirScopeAndValue() {
    let scope = "@expo/project"
    let cases = [
      (identifier: "/\u{301}abc", stored: "@expo\\/project//\u{301}abc"),
      (identifier: "\\\u{301}abc", stored: "@expo\\/project/\\\u{301}abc"),
      (identifier: "\u{301}abc", stored: "@expo\\/project/\u{301}abc")
    ]

    for (identifier, stored) in cases {
      let scoped = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scope)
      XCTAssertEqual(Array(scoped.utf16), Array(stored.utf16))
      XCTAssertTrue(EXScopedNotificationsUtils.isId(stored, scopedByExperience: scope))
      let unscoped = EXScopedNotificationsUtils.getUnscopedIdentifier(fromScopedIdentifier: stored)
      XCTAssertEqual(Array(unscoped.utf16), Array(identifier.utf16))
    }
  }

  func testAmbiguousLegacyIdentifierHasNoOwner() {
    let stored = "s/\u{301}x/\u{301}y"

    for scope in ["s", "s/\u{301}x", ""] {
      XCTAssertFalse(EXScopedNotificationsUtils.isId(stored, scopedByExperience: scope))
    }
    XCTAssertEqual(EXScopedNotificationsUtils.getUnscopedIdentifier(fromScopedIdentifier: stored), stored)
  }

  func testOwnershipUsesExactScope() {
    let stored = "caf\u{e9}/id"

    XCTAssertTrue(EXScopedNotificationsUtils.isId(stored, scopedByExperience: "caf\u{e9}"))
    XCTAssertFalse(EXScopedNotificationsUtils.isId(stored, scopedByExperience: "cafe\u{301}"))
  }
}

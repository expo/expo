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
}

import UIKit
import XCTest

@testable import ExpoBackgroundTask

final class BackgroundTaskStatusTests: XCTestCase {
  func testMapsAvailableRefreshStatus() {
    XCTAssertEqual(BackgroundTaskStatus(refreshStatus: .available), .available)
  }

  func testMapsDeniedRefreshStatus() {
    XCTAssertEqual(BackgroundTaskStatus(refreshStatus: .denied), .denied)
  }

  func testMapsRestrictedRefreshStatus() {
    XCTAssertEqual(BackgroundTaskStatus(refreshStatus: .restricted), .restricted)
  }

  func testMapsUnknownRefreshStatusToAvailable() {
    guard let unknown = UIBackgroundRefreshStatus(rawValue: 99) else {
      return
    }
    XCTAssertEqual(BackgroundTaskStatus(refreshStatus: unknown), .available)
  }
}

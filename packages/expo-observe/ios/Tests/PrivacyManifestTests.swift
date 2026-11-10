import Foundation
import Testing

@testable import ExpoObserve

@Suite("hasUserContentEntry")
struct PrivacyManifestTests {
  private func manifest(_ dataTypes: [String]) -> Data {
    let entries = dataTypes.map { ["NSPrivacyCollectedDataType": $0] }
    return try! PropertyListSerialization.data(
      fromPropertyList: ["NSPrivacyCollectedDataTypes": entries], format: .xml, options: 0)
  }

  @Test(arguments: ["NSPrivacyCollectedDataTypeOtherUserContent", "NSPrivacyCollectedDataTypeCustomerSupport"])
  func `finds a user content entry`(dataType: String) {
    #expect(hasUserContentEntry(privacyManifest: manifest(["NSPrivacyCollectedDataTypeCrashData", dataType])))
  }

  @Test
  func `reports no entry when only other data types are declared`() {
    #expect(!hasUserContentEntry(privacyManifest: manifest(["NSPrivacyCollectedDataTypeCrashData"])))
  }

  @Test
  func `reports no entry without a manifest`() {
    #expect(!hasUserContentEntry(privacyManifest: nil))
  }

  @Test
  func `reports no entry for data that is not a property list`() {
    #expect(!hasUserContentEntry(privacyManifest: Data("not a plist".utf8)))
  }
}

import Testing
import Foundation

@testable import ExpoNotifications

// BackgroundEventTransformerTests aligns the event payload with what Android does
// run this test from bare-expo, not notification-tester
@Suite("BackgroundEventTransformer")
struct BackgroundEventTransformerTests {
  @Suite("given a remote notification payload with a primitive body")
  struct PrimitiveBodyTests {
    @Test
    func `which has a string body, uses the string directly as dataString without crashing`() {
      // Given
      let inputPayload: [AnyHashable: Any] = [
        "aps": [
          "content-available": 1
        ],
        "body": "plain string body",
        "experienceId": "@brents/microfoam",
        "projectId": "f19296df-44bd-482a-90bb-2af254c6ac42",
        "scopeKey": "@brents/microfoam"
      ]

      // When
      let result = BackgroundEventTransformer.transform(inputPayload)

      // Then
      let data = result["data"] as? [String: Any]
      #expect(data?["dataString"] as? String == "plain string body")
    }

    @Test
    func `which has a numeric body, sets dataString to nil without crashing`() {
      // Given
      let inputPayload: [AnyHashable: Any] = [
        "aps": [
          "content-available": 1
        ],
        "body": 42,
        "experienceId": "@brents/microfoam",
        "projectId": "f19296df-44bd-482a-90bb-2af254c6ac42",
        "scopeKey": "@brents/microfoam"
      ]

      // When
      let result = BackgroundEventTransformer.transform(inputPayload)

      // Then
      let data = result["data"] as? [String: Any]
      #expect((data?["dataString"] ?? nil) == nil)
    }
  }

  @Suite("given a remote notification payload")
  struct RemoteNotificationPayloadTests {
    @Test
    func `which is a headless background notification, transforms the payload into the expected format`() {
      // Given
      let inputPayload: [AnyHashable: Any] = [
        "aps": [
          "category": "submit_reply_placeholder",
          "content-available": 1,
          "sound": "bells_sound.wav",
        ],
        "body": [
          "title": "Hello"
        ],
        "experienceId": "@brents/microfoam",
        "projectId": "f19296df-44bd-482a-90bb-2af254c6ac42",
        "scopeKey": "@brents/microfoam"
      ]

      // When
      let result = BackgroundEventTransformer.transform(inputPayload)

      // Then
      let expectedResult: [String: Any?] = [
        "notification": NSNull(),
        "aps": [
          "category": "submit_reply_placeholder",
          "content-available": 1,
          "sound": "bells_sound.wav",
        ],
        "data": [
          "body": ["title": "Hello"],
          "dataString": "{\"title\":\"Hello\"}",
          "categoryId": "submit_reply_placeholder",
          "scopeKey": "@brents/microfoam",
          "experienceId": "@brents/microfoam",
          "projectId": "f19296df-44bd-482a-90bb-2af254c6ac42"
        ]
      ]

      #expect(NSDictionary(dictionary: result) == NSDictionary(dictionary: expectedResult as [String: Any]))
    }

    @Test
    func `which contains a thread-id in aps, extracts threadIdentifier into data`() {
      // Given
      let inputPayload: [AnyHashable: Any] = [
        "aps": [
          "category": "chat",
          "thread-id": "thread-123",
          "content-available": 1,
        ],
        "body": [
          "title": "New message"
        ],
        "experienceId": "@brents/microfoam",
        "projectId": "f19296df-44bd-482a-90bb-2af254c6ac42",
        "scopeKey": "@brents/microfoam"
      ]

      // When
      let result = BackgroundEventTransformer.transform(inputPayload)

      // Then
      let data = result["data"] as? [String: Any]
      #expect(data?["threadIdentifier"] as? String == "thread-123")
      #expect(data?["categoryId"] as? String == "chat")
    }

    @Test
    func `which contains an alert field in aps, populates the notification entry`() {
      // Given
      let inputPayload: [AnyHashable: Any] = [
        "aps": [
          "alert": [
            "title": "Hello",
            "subtitle": "subtitle",
          ],
          "badge": 23,
          "content-available": 1
        ],
        "body": [
          "someKey": "someValue"
        ],
        "experienceId": "@brents/microfoam",
        "projectId": "f19296df-44bd-482a-90bb-2af254c6ac42",
        "scopeKey": "@brents/microfoam"
      ]

      // When
      let result = BackgroundEventTransformer.transform(inputPayload)

      // Then
      let expectedResult: [String: Any?] = [
        "notification": [
          "title": "Hello",
          "subtitle": "subtitle",
        ],
        "aps": [
          "alert": [
            "title": "Hello",
            "subtitle": "subtitle",
          ],
          "content-available": 1,
          "badge": 23,
        ],
        "data": [
          "body": ["someKey": "someValue"],
          "dataString": "{\"someKey\":\"someValue\"}",
          "scopeKey": "@brents/microfoam",
          "experienceId": "@brents/microfoam",
          "projectId": "f19296df-44bd-482a-90bb-2af254c6ac42"
        ]
      ]

      #expect(NSDictionary(dictionary: result) == NSDictionary(dictionary: expectedResult as [String: Any]))
    }
  }
}

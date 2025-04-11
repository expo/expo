import ExpoModulesTestCore
import Foundation
@testable import EXNotifications

// BackgroundEventTransformerSpec aligns the event payload with what Android does
class BackgroundEventTransformerSpec: ExpoSpec {

  override class func spec() {

    describe("BackgroundEventTransformerSpec") {

      context("given a remote notification payload") {
        it("which is a headless background notification, transforms the payload into the expected format") {
          // Given
          let inputPayload: NSDictionary = [
            "aps": [
              "category": "submit_reply_placeholder",
              "content-available": 1
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
              "content-available": 1
            ],
            "data": [
              "body": ["title": "Hello"],
              "categoryId": "submit_reply_placeholder",
              "scopeKey": "@brents/microfoam",
              "experienceId": "@brents/microfoam",
              "projectId": "f19296df-44bd-482a-90bb-2af254c6ac42"
            ]
          ]
          
          // Compare the entire structure in one expect statement
          expect(NSDictionary(dictionary: result)).to(equal(NSDictionary(dictionary: expectedResult as [String: Any])))
        }
        
        it("which contains an alert field in aps, populates the notification entry") {
          // Given
          let inputPayload: NSDictionary = [
            "aps": [
              "alert": [
                "title": "Hello"
              ],
              "category": "submit_reply_placeholder",
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
              "title": "Hello"
            ],
            "aps": [
              "alert": [
                "title": "Hello"
              ],
              "category": "submit_reply_placeholder",
              "content-available": 1
            ],
            "data": [
              "body": ["someKey": "someValue"],
              "categoryId": "submit_reply_placeholder",
              "scopeKey": "@brents/microfoam",
              "experienceId": "@brents/microfoam",
              "projectId": "f19296df-44bd-482a-90bb-2af254c6ac42"
            ]
          ]
          
          // Compare the entire structure in one expect statement
          expect(NSDictionary(dictionary: result)).to(equal(NSDictionary(dictionary: expectedResult as [String: Any])))
        }
      }
    }
  }
}

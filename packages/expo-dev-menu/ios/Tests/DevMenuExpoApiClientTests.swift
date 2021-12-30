import XCTest

@testable import EXDevMenu

private class MockedDataTask: URLSessionDataTask {
  private let completionHandler: () -> Void
  init(_ completionHandler: @escaping () -> Void) {
    self.completionHandler = completionHandler
    super.init()
  }

  override func resume() {
    completionHandler()
  }
}

private class MockedSession: URLSession {
  var requestInspector: (URLRequest) -> Void = { _ in }
  var completionHandlerSeeder: ((Data?, URLResponse?, Error?) -> Void) -> Void = {
    $0(nil, nil, nil)
  }

  override func dataTask(with request: URLRequest, completionHandler: @escaping (Data?, URLResponse?, Error?) -> Void) -> URLSessionDataTask {
    requestInspector(request)
    return MockedDataTask {
      self.completionHandlerSeeder(completionHandler)
    }
  }
}

class DevMenuExpoApiClientTests: XCTestCase {
  func test_queryDevSessionsAsync() {
    let expectedData = Data()
    let expect = expectation(description: "request callback should be called")
    let apiClient = DevMenuExpoApiClient()
    let mockedSession = MockedSession()
    mockedSession.requestInspector = {
      XCTAssertEqual($0.url?.absoluteString, "https://exp.host/--/api/v2/development-sessions")
      XCTAssertEqual($0.httpMethod, "GET")
    }
    mockedSession.completionHandlerSeeder = {
      $0(expectedData, nil, nil)
    }
    apiClient.session = mockedSession

    apiClient.queryDevSessionsAsync(nil, completionHandler: { data, _, _ in
      XCTAssertIdentical(data as AnyObject, expectedData as AnyObject)
      expect.fulfill()
    })

    waitForExpectations(timeout: 0)
  }

  func test_queryDevSessionsAsync_installationID() {
    let expectedData = Data()
    let expect = expectation(description: "request callback should be called")
    let apiClient = DevMenuExpoApiClient()
    let mockedSession = MockedSession()
    mockedSession.requestInspector = {
      XCTAssertEqual($0.url?.absoluteString, "https://exp.host/--/api/v2/development-sessions?deviceId=test-installation-id")
      XCTAssertEqual($0.httpMethod, "GET")
    }
    mockedSession.completionHandlerSeeder = {
      $0(expectedData, nil, nil)
    }
    apiClient.session = mockedSession

    apiClient.queryDevSessionsAsync("test-installation-id", completionHandler: { data, _, _ in
      XCTAssertIdentical(data as AnyObject, expectedData as AnyObject)
      expect.fulfill()
    })

    waitForExpectations(timeout: 0)
  }

  func test_if_isLoggedIn_returns_correct_values() {
    let apiClient = DevMenuExpoApiClient()

    XCTAssertFalse(apiClient.isLoggedIn())
    apiClient.sessionSecret = "secret"
    XCTAssertTrue(apiClient.isLoggedIn())
  }

  func test_if_session_token_is_attached_to_the_request() {
    let expect = expectation(description: "request callback should be called")
    let apiClient = DevMenuExpoApiClient()
    apiClient.sessionSecret = "secret"
    let mockedSession = MockedSession()
    mockedSession.requestInspector = {
      XCTAssertEqual($0.value(forHTTPHeaderField: "expo-session"), "secret")
    }
    apiClient.session = mockedSession

    apiClient.queryDevSessionsAsync(nil, completionHandler: { _, _, _ in
      expect.fulfill()
    })

    waitForExpectations(timeout: 0)
  }

  func test_if_queryUpdateBranches_converts_response_to_object() {
    let serverResponse = """
      {
        "data": {
          "app": {
            "byId": {
              "updateBranches": [
                {
                  "id": "0455d584-9130-4b7a-a9c0-f20bffe4ffb4",
                  "updates": [
                    {
                      "id": "04264159-e4d4-4085-8633-24400e1188dd",
                      "runtimeVersion": "1",
                      "platform": "android",
                      "message": "Update 2",
                      "updatedAt": "2021-04-07T09:46:37.803Z",
                      "createdAt": "2021-04-07T09:46:37.803Z"
                    },
                    {
                      "id": "14fccc96-9d7f-4689-a69f-8de9ad207c53",
                      "runtimeVersion": "1",
                      "platform": "ios",
                      "message": "Update 2",
                      "updatedAt": "2021-04-07T09:46:37.803Z",
                      "createdAt": "2021-04-07T09:46:37.803Z"
                    },
                    {
                      "id": "07b89cef-fdf8-40f6-9ba1-0827f46bbd75",
                      "runtimeVersion": "1",
                      "platform": "android",
                      "message": "Update 1",
                      "updatedAt": "2021-04-07T09:43:06.917Z",
                      "createdAt": "2021-04-07T09:43:06.917Z"
                    },
                    {
                      "id": "f45db62a-221e-45c1-b340-7ab5cfa097a1",
                      "runtimeVersion": "1",
                      "platform": "ios",
                      "message": "Update 1",
                      "updatedAt": "2021-04-07T09:43:06.917Z",
                      "createdAt": "2021-04-07T09:43:06.917Z"
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    """.data(using: .utf8)

    let expect = expectation(description: "request callback should be called")
    let apiClient = DevMenuExpoApiClient()
    let mockedSession = MockedSession()
    mockedSession.completionHandlerSeeder = {
      $0(serverResponse, nil, nil)
    }
    mockedSession.requestInspector = {
      XCTAssertEqual($0.httpMethod, "POST")
    }

    apiClient.session = mockedSession
    apiClient.queryUpdateBranches(appId: "app_id", completionHandler: { branches, _, error in
      XCTAssertNil(error)

      let branches = branches!
      XCTAssertEqual(branches.count, 1)
      let branch = branches[0]
      XCTAssertEqual(branch.id, "0455d584-9130-4b7a-a9c0-f20bffe4ffb4")
      XCTAssertEqual(branch.updates.count, 4)

      XCTAssertEqual(branch.updates[0].id, "04264159-e4d4-4085-8633-24400e1188dd")
      XCTAssertEqual(branch.updates[0].createdAt, "2021-04-07T09:46:37.803Z")
      XCTAssertEqual(branch.updates[0].updatedAt, "2021-04-07T09:46:37.803Z")
      XCTAssertEqual(branch.updates[0].platform, "android")
      XCTAssertEqual(branch.updates[0].runtimeVersion, "1")

      expect.fulfill()
    })

    waitForExpectations(timeout: 0)
  }

  func test_if_queryUpdateChannels_converts_response_to_object() {
    let serverResponse = """
     {
       "data": {
         "app": {
           "byId": {
             "updateChannels": [
               {
                 "name": "main",
                 "id": "a7c1bad5-1d21-4930-8660-f56b9cfc10bc",
                 "createdAt": "2021-04-01T08:37:05.013Z",
                 "updatedAt": "2021-04-01T08:37:05.013Z"
               }
             ]
           }
         }
       }
     }
    """.data(using: .utf8)

    let expect = expectation(description: "request callback should be called")
    let apiClient = DevMenuExpoApiClient()
    let mockedSession = MockedSession()
    mockedSession.completionHandlerSeeder = {
      $0(serverResponse, nil, nil)
    }
    mockedSession.requestInspector = {
      XCTAssertEqual($0.httpMethod, "POST")
    }

    apiClient.session = mockedSession
    apiClient.queryUpdateChannels(appId: "app_id", completionHandler: { updates, _, error in
      XCTAssertNil(error)

      let updates = updates!
      XCTAssertEqual(updates.count, 1)
      let update = updates[0]

      XCTAssertEqual(update.id, "a7c1bad5-1d21-4930-8660-f56b9cfc10bc")
      XCTAssertEqual(update.name, "main")
      XCTAssertEqual(update.createdAt, "2021-04-01T08:37:05.013Z")
      XCTAssertEqual(update.updatedAt, "2021-04-01T08:37:05.013Z")

      expect.fulfill()
    })

    waitForExpectations(timeout: 0)
  }

  func test_if_client_do_not_parse_response_if_error_is_present() {
    let serverResponse = """
     {
       "data": {
         "app": {
           "byId": {
             "updateChannels": [
               {
                 "name": "main",
                 "id": "a7c1bad5-1d21-4930-8660-f56b9cfc10bc",
                 "createdAt": "2021-04-01T08:37:05.013Z",
                 "updatedAt": "2021-04-01T08:37:05.013Z"
               }
             ]
           }
         }
       }
     }
    """.data(using: .utf8)

    let expect = expectation(description: "request callback should be called")
    let apiClient = DevMenuExpoApiClient()
    let mockedSession = MockedSession()
    mockedSession.completionHandlerSeeder = {
      $0(serverResponse, nil, NSError(domain: "Error", code: 123, userInfo: nil))
    }
    mockedSession.requestInspector = {
      XCTAssertEqual($0.httpMethod, "POST")
    }

    apiClient.session = mockedSession
    apiClient.queryUpdateChannels(appId: "app_id", completionHandler: { updates, _, error in
      XCTAssertNil(updates)
      XCTAssertNotNil(error)

      expect.fulfill()
    })

    waitForExpectations(timeout: 0)
  }
}

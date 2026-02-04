// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

final class MockCdpInterceptorDelegate: ExpoRequestCdpInterceptorDelegate {
  nonisolated(unsafe) var events: [String] = []

  // ExpoRequestCdpInterceptorDelegate implementations

  func dispatch(_ event: String) {
    self.events.append(event)
  }
}

@Suite("ExpoRequestCdpInterceptor", .serialized)
@MainActor
struct ExpoRequestCdpInterceptorTests {
  private let mockDelegate = MockCdpInterceptorDelegate()
  private let session: URLSession

  init() {
    let configuration = URLSessionConfiguration.default
    let protocolClasses = configuration.protocolClasses
    if var protocolClasses = protocolClasses {
      protocolClasses.insert(ExpoRequestInterceptorProtocol.self, at: 0)
      configuration.protocolClasses = protocolClasses
    } else {
      configuration.protocolClasses = [ExpoRequestInterceptorProtocol.self]
    }
    session = URLSession(configuration: configuration)

    ExpoRequestCdpInterceptor.shared.dispatchQueue = DispatchQueue.main
    ExpoRequestCdpInterceptor.shared.setDelegate(mockDelegate)
  }

  private static func parseJSON(data: String) -> [String: Any] {
    var result: [String: Any]?
    if let data = data.data(using: .utf8) {
      result = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
    }
    return result ?? [:]
  }

  @Test
  func `simple json data`() async throws {
    mockDelegate.events.removeAll()

    let result = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<(Data?, URLResponse?, Error?), Error>) in
      session.dataTask(with: URL(string: "https://raw.githubusercontent.com/expo/expo/main/package.json")!) { (data, response, error) in
        continuation.resume(returning: (data, response, error))
      }.resume()
    }

    // Give time for events to be dispatched
    try await Task.sleep(nanoseconds: 100_000_000) // 100ms

    #expect(mockDelegate.events.count == 5)

    // Network.requestWillBeSent
    var json = Self.parseJSON(data: mockDelegate.events[0])
    var method = json["method"] as! String
    var params = json["params"] as! [String: Any]
    let request = params["request"] as! [String: Any]
    let requestId = params["requestId"] as! String
    #expect(method == "Network.requestWillBeSent")
    #expect(request["url"] as? String == "https://raw.githubusercontent.com/expo/expo/main/package.json")

    // Network.requestWillBeSentExtraInfo
    json = Self.parseJSON(data: mockDelegate.events[1])
    method = json["method"] as! String
    params = json["params"] as! [String: Any]
    #expect(method == "Network.requestWillBeSentExtraInfo")
    #expect(params["requestId"] as? String == requestId)

    // Network.responseReceived
    json = Self.parseJSON(data: mockDelegate.events[2])
    method = json["method"] as! String
    params = json["params"] as! [String: Any]
    let response = params["response"] as! [String: Any]
    #expect(method == "Network.responseReceived")
    #expect(params["requestId"] as? String == requestId)
    #expect(response["status"] as? Int == 200)
    #expect((response["headers"] as! [String: Any]).count > 0)
    #expect((response["encodedDataLength"] as? Int64 ?? 0) > 0)

    // Expo(Network.receivedResponseBody)
    json = Self.parseJSON(data: mockDelegate.events[3])
    method = json["method"] as! String
    params = json["params"] as! [String: Any]
    #expect(method == "Expo(Network.receivedResponseBody)")
    #expect(params["requestId"] as? String == requestId)
    #expect((params["body"] as? String)?.isEmpty == false)
    #expect(params["base64Encoded"] as? Bool == false)

    // Network.loadingFinished
    json = Self.parseJSON(data: mockDelegate.events[4])
    method = json["method"] as! String
    params = json["params"] as! [String: Any]
    #expect(method == "Network.loadingFinished")
    #expect(params["requestId"] as? String == requestId)
    #expect((params["encodedDataLength"] as? Int64 ?? 0) > 0)
  }

  @Test
  func `http 302 redirection`() async throws {
    mockDelegate.events.removeAll()

    _ = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<(Data?, URLResponse?, Error?), Error>) in
      session.dataTask(with: URL(string: "https://github.com/expo.png")!) { (data, response, error) in
        continuation.resume(returning: (data, response, error))
      }.resume()
    }

    // Give time for events to be dispatched
    try await Task.sleep(nanoseconds: 100_000_000) // 100ms

    #expect(mockDelegate.events.count == 7)

    // Network.requestWillBeSent
    var json = Self.parseJSON(data: mockDelegate.events[0])
    var method = json["method"] as! String
    var params = json["params"] as! [String: Any]
    var request = params["request"] as! [String: Any]
    let requestId = params["requestId"] as! String
    #expect(method == "Network.requestWillBeSent")
    #expect(request["url"] as? String == "https://github.com/expo.png")

    // Network.requestWillBeSentExtraInfo

    // Network.requestWillBeSent
    json = Self.parseJSON(data: mockDelegate.events[2])
    method = json["method"] as! String
    params = json["params"] as! [String: Any]
    request = params["request"] as! [String: Any]
    let redirectResponse = params["redirectResponse"] as? [String: Any]
    #expect(method == "Network.requestWillBeSent")
    #expect(params["requestId"] as? String == requestId)
    #expect((request["url"] as? String)?.hasPrefix("https://avatars.githubusercontent.com") == true)
    #expect(redirectResponse != nil)
    if let redirectResponse = redirectResponse {
      #expect(redirectResponse["status"] as? Int == 302)
      #expect((redirectResponse["headers"] as! [String: Any]).count > 0)
    }

    // Network.requestWillBeSentExtraInfo

    // Network.responseReceived
    json = Self.parseJSON(data: mockDelegate.events[4])
    method = json["method"] as! String
    params = json["params"] as! [String: Any]
    let response = params["response"] as! [String: Any]
    #expect(method == "Network.responseReceived")
    #expect(params["requestId"] as? String == requestId)
    #expect(response["status"] as? Int == 200)
    #expect(response["mimeType"] as? String == "image/png")
    #expect((response["headers"] as! [String: Any]).count > 0)

    // Expo(Network.receivedResponseBody)
    json = Self.parseJSON(data: mockDelegate.events[5])
    method = json["method"] as! String
    params = json["params"] as! [String: Any]
    #expect(method == "Expo(Network.receivedResponseBody)")
    #expect(params["requestId"] as? String == requestId)
    #expect((params["body"] as? String)?.isEmpty == false)
    #expect(params["base64Encoded"] as? Bool == true)

    // Network.loadingFinished
  }

  @Test
  func `respect image mimeType to CDP event`() async throws {
    mockDelegate.events.removeAll()

    _ = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<(Data?, URLResponse?, Error?), Error>) in
      session.dataTask(with: URL(string: "https://avatars.githubusercontent.com/u/12504344")!) { (data, response, error) in
        continuation.resume(returning: (data, response, error))
      }.resume()
    }

    // Give time for events to be dispatched
    try await Task.sleep(nanoseconds: 100_000_000) // 100ms

    #expect(mockDelegate.events.count == 5)

    // Network.requestWillBeSent
    // Network.requestWillBeSentExtraInfo

    // Network.responseReceived
    let json = Self.parseJSON(data: mockDelegate.events[2])
    let method = json["method"] as! String
    let params = json["params"] as! [String: Any]
    let response = params["response"] as! [String: Any]
    #expect(method == "Network.responseReceived")
    #expect(response["status"] as? Int == 200)
    #expect(response["mimeType"] as? String == "image/png")
    #expect(params["type"] as? String == "Image")
  }

  @Test
  func `skip receivedResponseBody when response size exceeding 1MB limit`() async throws {
    mockDelegate.events.removeAll()

    _ = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<(Data?, URLResponse?, Error?), Error>) in
      session.dataTask(with: URL(string: "https://raw.githubusercontent.com/expo/expo/main/apps/native-component-list/assets/videos/ace.mp4")!) { (data, response, error) in
        continuation.resume(returning: (data, response, error))
      }.resume()
    }

    // Give time for events to be dispatched
    try await Task.sleep(nanoseconds: 500_000_000) // 500ms for larger file

    #expect(mockDelegate.events.count == 4)

    var json = Self.parseJSON(data: mockDelegate.events[0])
    #expect(json["method"] as! String == "Network.requestWillBeSent")

    json = Self.parseJSON(data: mockDelegate.events[1])
    #expect(json["method"] as! String == "Network.requestWillBeSentExtraInfo")

    json = Self.parseJSON(data: mockDelegate.events[2])
    #expect(json["method"] as! String == "Network.responseReceived")

    json = Self.parseJSON(data: mockDelegate.events[3])
    #expect(json["method"] as! String == "Network.loadingFinished")
  }
}

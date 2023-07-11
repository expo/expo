// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class MockCdpInterceptorDelegate: ExpoRequestCdpInterceptorDelegate {
  var events: [String] = []

  // ExpoRequestCdpInterceptorDelegate implementations

  func dispatch(_ event: String) {
    self.events.append(event)
  }
}

final class ExpoRequestCdpInterceptorSpec: ExpoSpec {
  private let mockDelegate = MockCdpInterceptorDelegate()
  private lazy var session: URLSession = {
    let configuration = URLSessionConfiguration.default
    let protocolClasses = configuration.protocolClasses
    if var protocolClasses = protocolClasses {
      protocolClasses.insert(ExpoRequestInterceptorProtocol.self, at: 0)
      configuration.protocolClasses = protocolClasses
    } else {
      configuration.protocolClasses = [ExpoRequestInterceptorProtocol.self]
    }
    return URLSession(configuration: configuration)
  }()

  private func parseJSON(data: String) -> [String: Any] {
    var result: [String: Any]?
    if let data = data.data(using: .utf8) {
        result = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
    }
    return result ?? [:]
  }

  override func spec() {
    beforeSuite {
      ExpoRequestCdpInterceptor.shared.dispatchQueue = DispatchQueue.main
      ExpoRequestCdpInterceptor.shared.setDelegate(self.mockDelegate)
    }

    beforeEach {
      self.mockDelegate.events.removeAll()
    }

    it("simple json data") {
      waitUntil(timeout: .seconds(2)) { done in
        self.session.dataTask(with: URL(string: "https://raw.githubusercontent.com/expo/expo/main/package.json")!) { (data, response, error) in
          DispatchQueue.main.async {
            expect(self.mockDelegate.events.count).to(equal(5))

            // Network.requestWillBeSent
            var json = self.parseJSON(data: self.mockDelegate.events[0])
            var method = json["method"] as! String
            var params = json["params"] as! [String: Any]
            let request = params["request"] as! [String: Any]
            let requestId = params["requestId"] as! String
            expect(method).to(equal("Network.requestWillBeSent"))
            expect(request["url"] as? String).to(equal("https://raw.githubusercontent.com/expo/expo/main/package.json"))

            // Network.requestWillBeSentExtraInfo
            json = self.parseJSON(data: self.mockDelegate.events[1])
            method = json["method"] as! String
            params = json["params"] as! [String: Any]
            expect(method).to(equal("Network.requestWillBeSentExtraInfo"))
            expect(params["requestId"] as? String).to(equal(requestId))

            // Network.responseReceived
            json = self.parseJSON(data: self.mockDelegate.events[2])
            method = json["method"] as! String
            params = json["params"] as! [String: Any]
            let response = params["response"] as! [String: Any]
            expect(method).to(equal("Network.responseReceived"))
            expect(params["requestId"] as? String).to(equal(requestId))
            expect(response["status"] as? Int).to(equal(200))
            expect((response["headers"] as! [String: Any]).count).to(beGreaterThan(0))

            // Network.loadingFinished
            json = self.parseJSON(data: self.mockDelegate.events[3])
            method = json["method"] as! String
            params = json["params"] as! [String: Any]
            expect(method).to(equal("Network.loadingFinished"))
            expect(params["requestId"] as? String).to(equal(requestId))

            // Expo(Network.receivedResponseBody)
            json = self.parseJSON(data: self.mockDelegate.events[4])
            method = json["method"] as! String
            params = json["params"] as! [String: Any]
            expect(method).to(equal("Expo(Network.receivedResponseBody)"))
            expect(params["requestId"] as? String).to(equal(requestId))
            expect(params["body"] as? String).notTo(beEmpty())
            expect(params["base64Encoded"] as? Bool).to(beFalse())

            done()
          }
        }.resume()
      }
    }

    it("http 302 redirection") {
      waitUntil(timeout: .seconds(2)) { done in
        self.session.dataTask(with: URL(string: "https://github.com/expo.png")!) { (data, response, error) in
          DispatchQueue.main.async {
            expect(self.mockDelegate.events.count).to(equal(7))

            // Network.requestWillBeSent
            var json = self.parseJSON(data: self.mockDelegate.events[0])
            var method = json["method"] as! String
            var params = json["params"] as! [String: Any]
            var request = params["request"] as! [String: Any]
            let requestId = params["requestId"] as! String
            expect(method).to(equal("Network.requestWillBeSent"))
            expect(request["url"] as? String).to(equal("https://github.com/expo.png"))

            // Network.requestWillBeSentExtraInfo

            // Network.requestWillBeSent
            json = self.parseJSON(data: self.mockDelegate.events[2])
            method = json["method"] as! String
            params = json["params"] as! [String: Any]
            request = params["request"] as! [String: Any]
            let redirectResponse = params["redirectResponse"] as? [String: Any]
            expect(method).to(equal("Network.requestWillBeSent"))
            expect(params["requestId"] as? String).to(equal(requestId))
            expect(request["url"] as? String).to(beginWith("https://avatars.githubusercontent.com"))
            expect(redirectResponse).notTo(beNil())
            if let redirectResponse = redirectResponse {
              expect(redirectResponse["status"] as? Int).to(equal(302))
              expect((redirectResponse["headers"] as! [String: Any]).count).to(beGreaterThan(0))
            }

            // Network.requestWillBeSentExtraInfo

            // Network.responseReceived
            json = self.parseJSON(data: self.mockDelegate.events[4])
            method = json["method"] as! String
            params = json["params"] as! [String: Any]
            let response = params["response"] as! [String: Any]
            expect(method).to(equal("Network.responseReceived"))
            expect(params["requestId"] as? String).to(equal(requestId))
            expect(response["status"] as? Int).to(equal(200))
            expect(response["mimeType"] as? String).to(equal("image/png"))
            expect((response["headers"] as! [String: Any]).count).to(beGreaterThan(0))

            // Network.loadingFinished

            // Expo(Network.receivedResponseBody)
            json = self.parseJSON(data: self.mockDelegate.events[6])
            method = json["method"] as! String
            params = json["params"] as! [String: Any]
            expect(method).to(equal("Expo(Network.receivedResponseBody)"))
            expect(params["requestId"] as? String).to(equal(requestId))
            expect(params["body"] as? String).notTo(beEmpty())
            expect(params["base64Encoded"] as? Bool).to(beTrue())

            done()
          }
        }.resume()
      }
    }


    it("respect image mimeType to CDP event") {
      waitUntil(timeout: .seconds(2)) { done in
        self.session.dataTask(with: URL(string: "https://avatars.githubusercontent.com/u/12504344")!) { (data, response, error) in
          DispatchQueue.main.async {
            expect(self.mockDelegate.events.count).to(equal(5))

            // Network.requestWillBeSent
            // Network.requestWillBeSentExtraInfo

            // Network.responseReceived
            let json = self.parseJSON(data: self.mockDelegate.events[2])
            let method = json["method"] as! String
            let params = json["params"] as! [String: Any]
            let response = params["response"] as! [String: Any]
            expect(method).to(equal("Network.responseReceived"))
            expect(response["status"] as? Int).to(equal(200))
            expect(response["mimeType"] as? String).to(equal("image/png"))
            expect(params["type"] as? String).to(equal("Image"))

            done()
          }
        }.resume()
      }
    }
  }
}

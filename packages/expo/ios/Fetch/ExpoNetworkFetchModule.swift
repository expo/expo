// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class ExpoNetworkFetchModule: Module {
  private static let queue = DispatchQueue(label: "expo.modules.networkfetch.RequestQueue")

  private var urlSession: URLSession?
  private let urlSessionDelegate: URLSessionSessionDelegateProxy

  public required init(appContext: AppContext) {
    urlSessionDelegate = URLSessionSessionDelegateProxy(dispatchQueue: Self.queue)
    super.init(appContext: appContext)
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoNetworkFetchModule")

    Events(
      "didReceiveResponseData",
      "didComplete",
      "didFailWithError"
    )

    OnCreate {
      urlSession = createDefaultURLSession()
    }

    OnDestroy {
      urlSession?.invalidateAndCancel()
    }

    // swiftlint:disable:next closure_body_length
    Class(NativeResponse.self) {
      Constructor {
        return NativeResponse(dispatchQueue: Self.queue)
      }

      AsyncFunction("startStreaming") { (response: NativeResponse) in
        response.startStreaming()
      }.runOnQueue(Self.queue)

      AsyncFunction("cancelStreaming") { (response: NativeResponse, _ reason: String) in
        response.cancelStreaming()
      }.runOnQueue(Self.queue)

      Property("bodyUsed") { (response: NativeResponse) in
        return response.bodyUsed
      }

      Property("headers") { (response: NativeResponse) in
        return response.responseInit?.headers ?? []
      }

      Property("status") { (response: NativeResponse) in
        return response.responseInit?.status ?? -1
      }

      Property("statusText") { (response: NativeResponse) in
        return response.responseInit?.statusText ?? ""
      }

      Property("url") { (response: NativeResponse) in
        return response.responseInit?.url ?? ""
      }

      Property("redirected") { (response: NativeResponse) in
        return response.redirected
      }

      AsyncFunction("arrayBuffer") { (response: NativeResponse, promise: Promise) in
        response.waitFor(states: [.bodyCompleted]) { _ in
          let data = response.ref.finalize()
          promise.resolve(data)
        }
      }.runOnQueue(Self.queue)

      AsyncFunction("text") { (response: NativeResponse, promise: Promise) in
        response.waitFor(states: [.bodyCompleted]) { _ in
          let data = response.ref.finalize()
          let text = String(decoding: data, as: UTF8.self)
          promise.resolve(text)
        }
      }.runOnQueue(Self.queue)
    }

    Class(NativeRequest.self) {
      Constructor { (nativeResponse: NativeResponse) in
        return NativeRequest(response: nativeResponse)
      }

      AsyncFunction("start") { (request: NativeRequest, url: URL, requestInit: NativeRequestInit, requestBody: Data?, promise: Promise) in
        guard let urlSession else {
          throw NetworkFetchURLSessionLostException()
        }
        request.start(
          urlSession: urlSession,
          urlSessionDelegate: urlSessionDelegate,
          url: url,
          requestInit: requestInit,
          requestBody: requestBody
        )
        request.response.waitFor(states: [.responseReceived, .errorReceived]) { state in
          if state == .responseReceived {
            promise.resolve()
          } else if state == .errorReceived {
            promise.reject(request.response.error ?? NetworkFetchUnknownException())
          }
        }
      }.runOnQueue(Self.queue)

      AsyncFunction("cancel") { (request: NativeRequest) in
        request.cancel(urlSessionDelegate: self.urlSessionDelegate)
      }.runOnQueue(Self.queue)
    }
  }

  public func setCustomURLSessionConfigurationProvider(provider: NSURLSessionConfigurationProvider?) {
    Self.queue.async {
      if let provider, let config = provider() {
        self.urlSession = URLSession(configuration: config, delegate: nil, delegateQueue: nil)
      } else {
        self.urlSession = self.createDefaultURLSession()
      }
    }
  }

  private func createDefaultURLSession() -> URLSession {
    let config = URLSessionConfiguration.default
    config.httpShouldSetCookies = true
    config.httpCookieAcceptPolicy = .always
    config.httpCookieStorage = HTTPCookieStorage.shared

    let useWifiOnly = Bundle.main.infoDictionary?["ReactNetworkForceWifiOnly"] as? Bool ?? false
    if useWifiOnly {
      config.allowsCellularAccess = !useWifiOnly
    }
    return URLSession(configuration: config, delegate: urlSessionDelegate, delegateQueue: nil)
  }
}

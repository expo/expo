// Copyright 2024-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesCore

internal class ContentKeyDelegate: NSObject, AVContentKeySessionDelegate {
  // Video source that is currently being loaded. Used for retrieving information like license and certificate urls
  var videoSource: VideoSource?

  // MARK: - AVContentKeySessionDelegate

  func contentKeySession(_ session: AVContentKeySession, didProvide keyRequest: AVContentKeyRequest) {
    handleStreamingContentKeyRequest(keyRequest: keyRequest)
  }

  func contentKeySession(_ session: AVContentKeySession, didProvideRenewingContentKeyRequest keyRequest: AVContentKeyRequest) {
    handleStreamingContentKeyRequest(keyRequest: keyRequest)
  }

  func contentKeySession(
    _ session: AVContentKeySession,
    shouldRetry keyRequest: AVContentKeyRequest,
    reason retryReason: AVContentKeyRequest.RetryReason
  ) -> Bool {
    var shouldRetry = false

    switch retryReason {
    case AVContentKeyRequest.RetryReason.timedOut:
      shouldRetry = true
    case AVContentKeyRequest.RetryReason.receivedResponseWithExpiredLease:
      shouldRetry = true
    case AVContentKeyRequest.RetryReason.receivedObsoleteContentKey:
      shouldRetry = true
    default:
      break
    }

    return shouldRetry
  }

  func contentKeySession(_ session: AVContentKeySession, contentKeyRequest keyRequest: AVContentKeyRequest, didFailWithError err: Error) {
    log.error(err)
  }

  // MARK: - Private

  func handleStreamingContentKeyRequest(keyRequest: AVContentKeyRequest) {
    do {
      try provideOnlineKey(keyRequest: keyRequest)
    } catch {
      keyRequest.processContentKeyResponseError(error)
    }
  }

  private func provideOnlineKey(keyRequest: AVContentKeyRequest) throws {
    guard
      let assetIdString = findAssetIdString(keyRequest: keyRequest, videoSource: videoSource),
      let assetIdData = assetIdString.data(using: .utf8)
    else {
      throw DRMLoadException("Failed to find the asset id for request: \(String(describing: keyRequest.identifier))")
    }

    let applicationCertificate = try self.requestApplicationCertificate(keyRequest: keyRequest)

    let completionHandler = { [weak self] (spcData: Data?, error: Error?) in
      guard let self else {
        keyRequest.processContentKeyResponseError(DRMLoadException("Couldn't find a reference to the key delegate in the online key completion handler."))
        return
      }

      if let error {
        keyRequest.processContentKeyResponseError(error)
        return
      }

      guard let spcData else {
        return
      }

      do {
        let ckcData = try self.requestContentKeyFromKeySecurityModule(spcData: spcData, assetID: assetIdString, keyRequest: keyRequest)
        let keyResponse = AVContentKeyResponse(fairPlayStreamingKeyResponseData: ckcData)
        keyRequest.processContentKeyResponse(keyResponse)
      } catch {
        keyRequest.processContentKeyResponseError(error)
      }
    }

    keyRequest.makeStreamingContentKeyRequestData(
      forApp: applicationCertificate,
      contentIdentifier: assetIdData,
      options: [AVContentKeyRequestProtocolVersionsKey: [1]],
      completionHandler: completionHandler
    )
  }

  private func requestApplicationCertificate(keyRequest: AVContentKeyRequest) throws -> Data {
    if let certificateData = videoSource?.drm?.base64CertificateData {
      return try requestCertificateFrom(base64String: certificateData)
    }

    guard let url = videoSource?.drm?.certificateUrl else {
      throw DRMLoadException("The certificate uri and data are null")
    }
    return try requestCertificateFrom(url: url)
  }

  private func requestCertificateFrom(url: URL) throws -> Data {
    let urlRequest = URLRequest(url: url)
    let (data, response, error) = URLSession.shared.synchronousDataTask(with: urlRequest)

    guard error == nil else {
      let errorDescription = error?.localizedDescription ?? "unknown error"
      throw DRMLoadException("Failed to load the application certificate from \(url.absoluteString): \(errorDescription)")
    }

    if let httpResponse = response as? HTTPURLResponse {
      guard httpResponse.statusCode == 200 else {
        throw DRMLoadException("Fetching the application certificate failed with status: \(httpResponse.statusCode)")
      }
    }
    guard let data else {
      throw DRMLoadException("Application certificate data received from \(url.absoluteString) is empty")
    }

    guard SecCertificateCreateWithData(nil, data as CFData) != nil else {
      throw DRMLoadException("The application certificate received from the server is invalid")
    }

    return data
  }

  private func requestCertificateFrom(base64String: String) throws -> Data {
    guard let certificateData = Data(base64Encoded: base64String, options: .ignoreUnknownCharacters) else {
      throw DRMLoadException("Failed to load the application certificate from the provided base64 string")
    }
    return certificateData
  }

  private func requestContentKeyFromKeySecurityModule(spcData: Data, assetID: String, keyRequest: AVContentKeyRequest) throws -> Data {
    let ckcData: Data? = nil

    guard let licenseServerUri = videoSource?.drm?.licenseServer else {
      throw DRMLoadException("LicenseServer uri hasn't been provided")
    }
    guard let licenseServerUrl = URL(string: licenseServerUri) else {
      throw DRMLoadException("LicenseServer uri is invalid")
    }

    var ckcRequest = URLRequest(url: licenseServerUrl)
    ckcRequest.httpMethod = "POST"
    ckcRequest.httpBody = spcData

    if let headers = videoSource?.drm?.headers {
      for item in headers {
        guard let value = item.value as? String else {
          continue
        }
        ckcRequest.setValue(value, forHTTPHeaderField: item.key)
      }
    }

    let (data, response, error) = URLSession.shared.synchronousDataTask(with: ckcRequest)

    guard error == nil else {
      throw DRMLoadException("Fetching the content key has failed with error: \(String(describing: error?.localizedDescription))")
    }

    if let httpResponse = response as? HTTPURLResponse {
      guard httpResponse.statusCode == 200 else {
        throw DRMLoadException("Fetching the content key has failed with status: \(httpResponse.statusCode)")
      }
    }
    guard let data else {
      throw DRMLoadException("Fetched content key data is empty")
    }
    return data
  }

  private func findAssetIdString(keyRequest: AVContentKeyRequest) -> String? {
    let url = keyRequest.identifier as? String
    return url?.replacingOccurrences(of: "skd://", with: "")
  }

  private func findAssetIdString(keyRequest: AVContentKeyRequest, videoSource: VideoSource?) -> String? {
    return videoSource?.drm?.contentId ?? findAssetIdString(keyRequest: keyRequest)
  }
}

// MARK: - Utils

// https://stackoverflow.com/questions/26784315/can-i-somehow-do-a-synchronous-http-request-via-nsurlsession-in-swift
private extension URLSession {
  func synchronousDataTask(with urlRequest: URLRequest) -> (data: Data?, response: URLResponse?, error: Error?) {
    var data: Data?
    var response: URLResponse?
    var error: Error?

    let semaphore = DispatchSemaphore(value: 0)

    let dataTask = self.dataTask(with: urlRequest) {
      data = $0
      response = $1
      error = $2

      semaphore.signal()
    }
    dataTask.resume()

    _ = semaphore.wait(timeout: .distantFuture)

    return (data, response, error)
  }
}

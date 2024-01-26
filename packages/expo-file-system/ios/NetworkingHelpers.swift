// Copyright 2023-present 650 Industries. All rights reserved.

import CoreServices
import ExpoModulesCore

func findMimeType(forAttachment attachment: URL) -> String {
  if let identifier = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, attachment.pathExtension as CFString, nil)?.takeRetainedValue() {
    if let type = UTTypeCopyPreferredTagWithClass(identifier, kUTTagClassMIMEType)?.takeRetainedValue() {
      return type as String
    }
  }
  return "application/octet-stream"
}

func createUrlSession(type: SessionType, delegate: URLSessionDelegate) -> URLSession {
  let configuration = type == .foreground ? URLSessionConfiguration.default : URLSessionConfiguration.background(withIdentifier: UUID().uuidString)
  configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
  configuration.urlCache = nil
  return URLSession(configuration: configuration, delegate: delegate, delegateQueue: .main)
}

func createUrlRequest(url: URL, headers: [String: String]?) -> URLRequest {
  var request = URLRequest(url: url)

  if let headers {
    for (key, value) in headers {
      request.setValue(value, forHTTPHeaderField: key)
    }
  }
  return request
}

func createUploadTask(session: URLSession, targetUrl: URL, sourceUrl: URL, options: UploadOptions) -> URLSessionUploadTask {
  var request = createUrlRequest(url: targetUrl, headers: options.headers)
  request.httpMethod = options.httpMethod.rawValue

  switch options.uploadType {
  case .binaryContent:
    return session.uploadTask(with: request, fromFile: sourceUrl)
  case .multipart:
    let boundaryString = UUID().uuidString
    let data = try? createMultipartBody(boundary: boundaryString, sourceUrl: sourceUrl, options: options)

    request.setValue("multipart/form-data; boundary=\(boundaryString)", forHTTPHeaderField: "Content-Type")
    request.httpBody = data

    return session.uploadTask(withStreamedRequest: request)
  }
}

func createMultipartBody(boundary: String, sourceUrl: URL, options: UploadOptions) throws -> Data {
  let fileName = options.fieldName ?? sourceUrl.lastPathComponent
  let fileContents = try String(contentsOf: sourceUrl)
  let mimeType = options.mimeType ?? findMimeType(forAttachment: sourceUrl)

  let body = """
\(headersForMultipartParams(options.parameters, boundary: boundary))
--\(boundary)
Content-Disposition: form-data; name="\(fileName)"; filename="\(sourceUrl.lastPathComponent)"
Content-Type: \(mimeType)

\(fileContents)
--\(boundary)--
"""

  guard let bodyData = body.data(using: .utf8) else {
    throw HeaderEncodingFailedException(sourceUrl.absoluteString)
  }
  return bodyData
}

func headersForMultipartParams(_ params: [String: String]?, boundary: String) -> String {
  guard let params else {
    return ""
  }
  return params.map { (key: String, value: String) in
"""
--\(boundary)
Content-Disposition: form-data; name="\(key)"

\(value)
"""
  }
  .joined()
}

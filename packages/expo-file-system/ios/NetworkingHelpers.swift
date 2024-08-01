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

func createUploadTask(session: URLSession, targetUrl: URL, sourceUrl: URL, options: UploadOptions) throws -> URLSessionUploadTask {
  var request = createUrlRequest(url: targetUrl, headers: options.headers)
  request.httpMethod = options.httpMethod.rawValue

  switch options.uploadType {
  case .binaryContent:
    return session.uploadTask(with: request, fromFile: sourceUrl)
  case .multipart:
    let boundaryString = UUID().uuidString
    guard let data = createMultipartBody(boundary: boundaryString, sourceUrl: sourceUrl, options: options) else {
      throw FailedToCreateBodyException()
    }

    request.setValue("multipart/form-data; boundary=\(boundaryString)", forHTTPHeaderField: "Content-Type")

    let localURL = try createLocalUrl(from: sourceUrl)
    try? data.write(to: localURL)

    return session.uploadTask(with: request, fromFile: localURL)
  }
}

func createLocalUrl(from sourceUrl: URL) throws -> URL {
  guard let cachesDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first else {
    throw FailedToAccessDirectoryException()
  }
  let tempDir = cachesDir.appendingPathComponent("uploads")
  FileSystemUtilities.ensureDirExists(at: tempDir)
  return tempDir.appendingPathComponent(sourceUrl.lastPathComponent)
}

func createMultipartBody(boundary: String, sourceUrl: URL, options: UploadOptions) -> Data? {
  let fieldName = options.fieldName ?? sourceUrl.lastPathComponent
  let mimeType = options.mimeType ?? findMimeType(forAttachment: sourceUrl)
  guard let data = try? Data(contentsOf: sourceUrl) else {
    return nil
  }

  var body = Data()
  headersForMultipartParams(options.parameters, boundary: boundary, body: &body)

  body.append("--\(boundary)\r\n".data)
  body.append("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(sourceUrl.lastPathComponent)\"\r\n".data)
  body.append("Content-Type: \(mimeType)\r\n\r\n".data)
  body.append(data)
  body.append("\r\n".data)
  body.append("--\(boundary)--\r\n".data)

  return body
}

func headersForMultipartParams(_ params: [String: String]?, boundary: String, body: inout Data) {
  if let params {
    for (key, value) in params {
      body.append("--\(boundary)\r\n".data)
      body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data)
      body.append("\(value)\r\n".data)
    }
  }
}

// All swift strings are unicode correct.
// This avoids the optional created by string.data(using: .utf8)
private extension String {
  var data: Data { Data(self.utf8) }
}

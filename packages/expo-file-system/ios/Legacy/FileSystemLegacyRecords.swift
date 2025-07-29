// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

struct InfoOptions: Record {
  @Field var md5: Bool = false
}

struct ReadingOptions: Record {
  @Field var encoding: Encoding = .utf8
  @Field var position: Int?
  @Field var length: Int?
}

struct WritingOptions: Record {
  @Field var encoding: Encoding = .utf8
}

struct DeletingOptions: Record {
  @Field var idempotent: Bool = false
}

struct RelocatingOptions: Record {
  @Field var from: URL?
  @Field var to: URL?

  func asTuple() throws -> (URL, URL) {
    guard let from, let to else {
      let missingOptionName = from == nil ? "from" : "to"
      throw Exception(name: "MissingParameterException", description: "Missing option '\(missingOptionName)'")
    }
    return (from, to)
  }
}

struct MakeDirectoryOptions: Record {
  @Field var intermediates: Bool = false
}

struct DownloadOptionsLegacy: Record {
  @Field var md5: Bool = false
  @Field var cache: Bool = false
  @Field var headers: [String: String]?
  @Field var sessionType: SessionType = .background
}

struct UploadOptions: Record {
  @Field var headers: [String: String]?
  @Field var httpMethod: HttpMethod = .post
  @Field var sessionType: SessionType = .background
  @Field var uploadType: UploadType = .binaryContent

  // Multipart
  @Field var fieldName: String?
  @Field var mimeType: String?
  @Field var parameters: [String: String]?
}

enum SessionType: Int, Enumerable {
  case background = 0
  case foreground = 1
}

enum HttpMethod: String, Enumerable {
  case post = "POST"
  case put = "PUT"
  case patch = "PATCH"
}

enum UploadType: Int, Enumerable {
  case binaryContent = 0
  case multipart = 1
}

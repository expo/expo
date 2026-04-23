// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

struct CreateOptions: Record {
  @Field var intermediates: Bool = false
  @Field var overwrite: Bool = false
  @Field var idempotent: Bool = false
}

struct DownloadOptions: Record {
  @Field var headers: [String: String]?
  @Field var idempotent: Bool = false
}

struct RelocationOptions: Record {
  @Field var overwrite: Bool = false
}

struct FilePickingOptions: Record {
  @Field var initialUri: URL?
  @Field var mimeTypes: [String]?
  @Field var multipleFiles: Bool?
}

struct FileInfo: Record {
  @Field var exists: Bool
  @Field var uri: String?
  @Field var md5: String?
  @Field var size: Int64?
  @Field var modificationTime: Int64?
  @Field var creationTime: Int64?
}

struct PathInfo: Record {
  @Field var exists: Bool
  @Field var isDirectory: Bool?
}

struct DirectoryInfo: Record {
  @Field var exists: Bool
  @Field var uri: String?
  @Field var files: [String]?
  @Field var size: Int64?
  @Field var modificationTime: Int64?
  @Field var creationTime: Int64?
}

enum WriteEncoding: String, Enumerable {
  case utf8
  case base64
}

struct WriteOptions: Record {
  @Field var encoding: WriteEncoding?
  @Field var append: Bool = false
}

enum CompressionLevelEnum: Int, Enumerable {
  case none = 0
  case bestSpeed = 1
  case `default` = -1
  case bestCompression = 9
}

struct ZipOptions: Record {
  @Field var includeRootDirectory: Bool = true
  @Field var compressionLevel: CompressionLevelEnum = .default
  @Field var overwrite: Bool = true
}

struct UnzipOptions: Record {
  @Field var createContainingDirectory: Bool = false
  @Field var overwrite: Bool = true
}

struct ZipEntryRecord: Record {
  @Field var name: String = ""
  @Field var isDirectory: Bool = false
  @Field var size: Int64 = 0
  @Field var compressedSize: Int64 = 0
  @Field var crc32: Int64?
  @Field var lastModified: Double?
  @Field var compressionMethod: String?
}

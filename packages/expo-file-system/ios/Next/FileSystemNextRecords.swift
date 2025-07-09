// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

struct CreateOptions: Record {
  @Field var intermediates: Bool = false
  @Field var overwrite: Bool = false
}

struct DownloadOptionsNext: Record {
  @Field var headers: [String: String]?
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

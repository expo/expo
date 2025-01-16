// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

struct CreateOptions: Record {
  @Field var intermediates: Bool = false
  @Field var overwrite: Bool = false
}

struct DownloadOptionsNext: Record {
  @Field var headers: [String: String]?
}

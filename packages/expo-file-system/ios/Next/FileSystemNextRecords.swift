// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

struct CreateOptions: Record {
  @Field var intermediates: Bool = false
  @Field var overwrite: Bool = false
}


struct UploadOptionsNext: Record {
  @Field var headers: [String: String]?
  @Field var method: HttpMethod = .post
  @Field var uploadType: UploadType = .binaryContent

  // Multipart
  @Field var fieldName: String = "file"
  @Field var mimeType: String?
  @Field var parameters: [String: String]?
}

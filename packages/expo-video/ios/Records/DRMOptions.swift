// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

internal struct DRMOptions: Record {
  @Field
  var type: DRMType = .fairplay

  @Field
  var licenseServer: String?

  @Field
  var headers: [String: Any]?

  @Field
  var contentId: String?

  @Field
  var certificateUrl: URL?

  @Field
  var base64CertificateData: String?
}

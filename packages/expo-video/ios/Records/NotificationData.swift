import Foundation
// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct NotificationData: Record {
  @Field
  var title: String? = nil

  @Field
  var secondaryText: String? = nil
}
// swiftlint:enable redundant_optional_initialization

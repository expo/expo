// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct SubtitleTrack: Record {
  @Field
  var language: String? = nil

  @Field
  var label: String? = nil

  static func from(mediaSelectionOption option: AVMediaSelectionOption) -> SubtitleTrack? {
    guard let identifier = option.locale?.identifier else {
      return nil
    }

    return SubtitleTrack(language: identifier, label: option.displayName)
  }
}
// swiftlint:enable redundant_optional_initialization

// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum AlignmentOptions: String, Enumerable {
  case center
  case leading
  case trailing
  case top
  case bottom
  case topLeading
  case topTrailing
  case bottomLeading
  case bottomTrailing

  func toAlignment() -> Alignment {
    switch self {
    case .center:
      return .center
    case .leading:
      return .leading
    case .trailing:
      return .trailing
    case .top:
      return .top
    case .bottom:
      return .bottom
    case .topLeading:
      return .topLeading
    case .topTrailing:
      return .topTrailing
    case .bottomLeading:
      return .bottomLeading
    case .bottomTrailing:
      return .bottomTrailing
    }
  }
}

internal struct FrameOptions: Record {
  @Field var width: Double?
  @Field var height: Double?

  @Field var minWidth: Double?
  @Field var idealWidth: Double?
  @Field var maxWidth: Double?
  @Field var minHeight: Double?
  @Field var idealHeight: Double?
  @Field var maxHeight: Double?

  @Field var alignment: AlignmentOptions?
}

internal extension View {
  @ViewBuilder
  func applyFrame(_ frame: FrameOptions?, defaultAlignment: Alignment = .center) -> some View {
    if let frame {
      if frame.width != nil || frame.height != nil {
        self.frame(
          width: frame.width.map { CGFloat($0) },
          height: frame.height.map { CGFloat($0) },
          alignment: frame.alignment?.toAlignment() ?? defaultAlignment
        )
      } else {
        self.frame(
          minWidth: frame.minWidth.map { CGFloat($0) },
          idealWidth: frame.idealWidth.map { CGFloat($0) },
          maxWidth: frame.maxWidth.map { CGFloat($0) },
          minHeight: frame.minHeight.map { CGFloat($0) },
          idealHeight: frame.idealHeight.map { CGFloat($0) },
          maxHeight: frame.maxHeight.map { CGFloat($0) },
          alignment: frame.alignment?.toAlignment() ?? defaultAlignment
        )
      }
    } else {
      self
    }
  }
}

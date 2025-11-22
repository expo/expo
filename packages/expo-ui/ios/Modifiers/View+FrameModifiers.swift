// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

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

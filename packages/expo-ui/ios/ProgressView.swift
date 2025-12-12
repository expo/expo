// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ProgressVariant: String, Enumerable {
  case circular
  case linear
}

final class ProgressProps: UIBaseViewProps {
  @Field var variant: ProgressVariant = .circular
  @Field var timerInterval: [Date]?
  @Field var progress: Double?
  @Field var color: Color?
}

struct ProgressView: ExpoSwiftUI.View {
  @ObservedObject public var props: ProgressProps
  
  var body: some View {
    progressView
      .tint(props.color)
      .if(props.variant == .circular) {
        $0.progressViewStyle(.circular)
      }
      .if(props.variant == .linear) {
        $0.progressViewStyle(.linear)
      }
  }
  
  @ViewBuilder
  private var progressView: some View {
    if let timerInterval = props.timerInterval, timerInterval.count >= 2, let lower = timerInterval.first, let upper = timerInterval.last, lower <= upper, #available(iOS 16.0, *) {
      SwiftUI.ProgressView(timerInterval: ClosedRange(uncheckedBounds: (lower: lower, upper: upper)))
    } else {
      SwiftUI.ProgressView(value: props.progress)
    }
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ProgressVariant: String, Enumerable {
  case circular
  case linear
}

final class ClosedRangeDate: Record {
  @Field var lower: Date?
  @Field var upper: Date?
}

public final class ProgressProps: UIBaseViewProps {
  @Field var variant: ProgressVariant = .circular
  @Field var timerInterval: ClosedRangeDate?
  @Field var countsDown: Bool?
  @Field var progress: Double?
  @Field var color: Color?
}

public struct ProgressView: ExpoSwiftUI.View {
  @ObservedObject public var props: ProgressProps

  public init(props: ProgressProps) {
    self.props = props
  }

  public var body: some View {
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
    if let timerInterval = props.timerInterval,
      let lower = timerInterval.lower,
      let upper = timerInterval.upper,
      lower <= upper,
      #available(iOS 16.0, tvOS 16.0, *) {
      SwiftUI.ProgressView(timerInterval: ClosedRange(uncheckedBounds: (lower: lower, upper: upper)), countsDown: props.countsDown ?? true)
    } else {
      SwiftUI.ProgressView(value: props.progress)
    }
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class ClosedRangeDate: Record {
  @Field var lower: Date?
  @Field var upper: Date?
}

public final class ProgressViewProps: UIBaseViewProps {
  @Field var timerInterval: ClosedRangeDate?
  @Field var countsDown: Bool?
  @Field var value: Double?
}

public struct ProgressView: ExpoSwiftUI.View {
  @ObservedObject public var props: ProgressViewProps

  public init(props: ProgressViewProps) {
    self.props = props
  }

  public var body: some View {
    progressView
  }

  @ViewBuilder
  private var progressView: some View {
    if let timerInterval = props.timerInterval,
      let lower = timerInterval.lower,
      let upper = timerInterval.upper,
      lower <= upper,
      #available(iOS 16.0, tvOS 16.0, *) {
      SwiftUI.ProgressView(timerInterval: ClosedRange(uncheckedBounds: (lower: lower, upper: upper)), countsDown: props.countsDown ?? true) {
        Children()
      }
    } else if let value = props.value {
      SwiftUI.ProgressView(value: value) {
        Children()
      }
    } else {
      SwiftUI.ProgressView {
        Children()
      }
    }
  }
}

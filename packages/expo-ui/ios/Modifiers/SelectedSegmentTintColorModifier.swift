// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

// SwiftUI has no API for this, so set it on the `UISegmentedControl` behind the segmented `Picker`.
internal struct SelectedSegmentTintColorModifier: ViewModifier, Record {
  @Field var color: Color?

  func body(content: Content) -> some View {
#if os(iOS)
    content.background(SegmentedControlTintSetter(color: color.map { UIColor($0) }))
#else
    content
#endif
  }
}

#if os(iOS)
private struct SegmentedControlTintSetter: UIViewRepresentable {
  let color: UIColor?

  func makeUIView(context: Context) -> SegmentedControlTintSetterView {
    return SegmentedControlTintSetterView()
  }

  func updateUIView(_ view: SegmentedControlTintSetterView, context: Context) {
    view.color = color
    view.applyColor()
  }
}

private final class SegmentedControlTintSetterView: UIView {
  var color: UIColor?

  override init(frame: CGRect) {
    super.init(frame: frame)
    isUserInteractionEnabled = false
    isAccessibilityElement = false
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    applyColor()
  }

  func applyColor() {
    // The segmented control may not be in the hierarchy until the next layout pass.
    DispatchQueue.main.async { [weak self] in
      guard let self, let segmentedControl = self.findSegmentedControl() else {
        return
      }
      if segmentedControl.selectedSegmentTintColor != self.color {
        segmentedControl.selectedSegmentTintColor = self.color
      }
    }
  }

  private func findSegmentedControl() -> UISegmentedControl? {
    var ancestor = superview
    while let current = ancestor {
      if let match = Self.firstSegmentedControl(in: current) {
        return match
      }
      ancestor = current.superview
    }
    return nil
  }

  private static func firstSegmentedControl(in view: UIView) -> UISegmentedControl? {
    if let segmentedControl = view as? UISegmentedControl {
      return segmentedControl
    }
    for subview in view.subviews {
      if let match = firstSegmentedControl(in: subview) {
        return match
      }
    }
    return nil
  }
}
#endif

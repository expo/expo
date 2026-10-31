// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal enum HorizontalAlignmentOptions: String, Enumerable {
  case leading
  case center
  case trailing

  func toHorizontalAlignment() -> HorizontalAlignment {
    switch self {
    case .leading:
      return .leading
    case .center:
      return .center
    case .trailing:
      return .trailing
    }
  }
}

public final class VStackViewProps: UIBaseViewProps {
  @Field var spacing: Double?
  @Field var alignment: HorizontalAlignmentOptions?
  // Universal `Column` sets this so a child percentage is a fraction of this stack.
  // A SwiftUI `VStack` leaves it off and keeps the platform layout.
  @Field var resolvesChildPercentages: Bool = false
  // Universal `Column` sets this only when it or a child has a percentage size.
  // Otherwise it keeps the platform layout.
  @Field var usesPercentageLayout: Bool = false
}

public struct VStackView: ExpoSwiftUI.View {
  @ObservedObject public var props: VStackViewProps
  // A fraction on this stack is a real size only when the parent opted in.
  @Environment(\.resolvesOwnPercentage) private var resolvesOwnPercentage

  public init(props: VStackViewProps) {
    self.props = props
  }

  public var body: some View {
    if props.resolvesChildPercentages {
      universalStack
    } else {
      platformStack
    }
  }

  private var universalStack: some View {
    // `AnyLayout` keeps the children when a percentage is added or removed.
    let layout = props.usesPercentageLayout
      ? AnyLayout(ParentAwareVStackLayout(
        alignment: props.alignment ?? .center,
        spacing: props.spacing.map { CGFloat($0) },
        ownDimensions: universalLayoutDimensions(from: props.modifiers),
        resolvesOwnPercentage: resolvesOwnPercentage
      ))
      : AnyLayout(VStackLayout(
        alignment: props.alignment?.toHorizontalAlignment() ?? .center,
        spacing: props.spacing.map { CGFloat($0) }
      ))
    return layout {
      Children()
    }
    .environment(\.universalPercentageParent, true)
  }

  private var platformStack: some View {
    VStack(
      alignment: props.alignment?.toHorizontalAlignment() ?? .center,
      spacing: props.spacing.map { CGFloat($0) }
    ) {
      Children()
    }
    // Overrides a Host, so a percentage inside a SwiftUI stack keeps the child's own size.
    .environment(\.universalPercentageParent, false)
  }
}

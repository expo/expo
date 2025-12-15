// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal enum PresentationBackgroundInteractionType: String, Enumerable {
  case automatic
  case enabled
  case disabled
  case enabledUpThrough
}

internal enum PresentationDetentPreset: String, Enumerable {
  case medium
  case large
}

internal struct PresentationBackgroundInteractionDetentProps: Record {
  @Field var preset: PresentationDetentPreset?
  @Field var fraction: Double?
}

internal struct PresentationBackgroundInteractionProps: Record {
  @Field var type: PresentationBackgroundInteractionType = .automatic
  @Field var detent: PresentationBackgroundInteractionDetentProps?
}

internal enum PresentationDragIndicatorVisibility: String, Enumerable {
  case automatic
  case visible
  case hidden

  func toPresentationDragIndicator() -> Visibility {
    switch self {
    case .visible:
      return .visible
    case .hidden:
      return .hidden
    default:
      return .automatic
    }
  }
}

final class BottomSheetProps: UIBaseViewProps {
  @Field var isOpened: Bool = false
  // Accepts `medium`, `large`, and `fraction` like 0.4
  @Field var presentationDetents: [Any]?
  @Field var presentationDragIndicator: PresentationDragIndicatorVisibility = .automatic
  @Field var presentationBackgroundInteraction: PresentationBackgroundInteractionProps?
  var onIsOpenedChange = EventDispatcher()
  @Field var interactiveDismissDisabled: Bool = false
}

struct SizePreferenceKey: PreferenceKey {
  static var defaultValue: CGSize?

  static func reduce(value: inout CGSize?, nextValue: () -> CGSize?) {
    guard let nextValue = nextValue() else {
      return
    }
    value = nextValue
  }
}

private struct ReadSizeModifier: ViewModifier {
  private var sizeView: some View {
    GeometryReader { geometry in
      Color.clear
        .preference(key: SizePreferenceKey.self, value: geometry.size)
        .allowsHitTesting(false)
    }
  }

  func body(content: Content) -> some View {
    content.background(sizeView)
  }
}

private struct BottomSheetSizeReader<Children: View>: View {
  let children: Children
  let onChildrenSizeChange: ((CGSize) -> Void)?

  init(
    children: Children,
    onChildrenSizeChange: ((CGSize) -> Void)? = nil
  ) {
    self.children = children
    self.onChildrenSizeChange = onChildrenSizeChange
  }

  var body: some View {
    children
      .modifier(ReadSizeModifier())
      .onPreferenceChange(SizePreferenceKey.self) { size in
        if let size, let onChildrenSizeChange {
          onChildrenSizeChange(size)
        }
      }
    }
}

struct BottomSheetView: ExpoSwiftUI.View {
  @ObservedObject var props: BottomSheetProps
  @State private var isOpened: Bool
  @State private var childrenSize: CGSize = .zero

  init(props: BottomSheetProps) {
    self.props = props
    self._isOpened = State(initialValue: props.isOpened)
  }

  @available(iOS 16.0, tvOS 16.0, *)
  private func detent(from value: Any) -> PresentationDetent? {
    if let str = value as? String {
      switch str {
      case "medium":
        return .medium
      case "large":
        return .large
      default:
        return nil
      }
    } else if let value = value as? Double {
      return .fraction(CGFloat(value))
    }

    return nil
  }

  @available(iOS 16.0, tvOS 16.0, *)
  private func detent(
    from detentProps: PresentationBackgroundInteractionDetentProps?
  ) -> PresentationDetent? {
    guard let detentProps else {
      return nil
    }

    if let preset = detentProps.preset {
      switch preset {
      case .medium:
        return .medium
      case .large:
        return .large
      }
    }

    if let fraction = detentProps.fraction {
      return .fraction(CGFloat(fraction))
    }

    return nil
  }

  @available(iOS 16.0, tvOS 16.0, *)
  private func getDetents() -> Set<PresentationDetent> {
    guard let detentArray = props.presentationDetents, !detentArray.isEmpty else {
      return [.height(childrenSize.height)]
    }
    let result = detentArray.compactMap { detent(from: $0) }
    return result.isEmpty ? [.height(childrenSize.height)] : Set(result)
  }

  @available(iOS 16.4, tvOS 16.4, *)
  private func getPresentationBackgroundInteraction() -> PresentationBackgroundInteraction {
    guard let interaction = props.presentationBackgroundInteraction else {
      return .automatic
    }
    switch interaction.type {
    case .automatic:
      return .automatic
    case .enabled:
      return .enabled
    case .disabled:
      return .disabled
    case .enabledUpThrough:
      guard let detent = detent(from: interaction.detent) else {
        return .enabled
      }
      return .enabled(upThrough: detent)
    }
  }

  private func handleChildrenSizeChange(_ size: CGSize) {
    // Only update if size actually changed to avoid unnecessary re-renders
    guard childrenSize != size else { return }
    childrenSize = size
  }

  @ViewBuilder
  private var sheetContent: some View {
    let content = BottomSheetSizeReader(
      children: Children(),
      onChildrenSizeChange: handleChildrenSizeChange
    ).interactiveDismissDisabled(props.interactiveDismissDisabled)

    if #available(iOS 16.4, tvOS 16.4, *) {
      content
        .presentationDetents(getDetents())
        .presentationDragIndicator(props.presentationDragIndicator.toPresentationDragIndicator())
        .presentationBackgroundInteraction(getPresentationBackgroundInteraction())
    } else if #available(iOS 16.0, tvOS 16.0, *) {
      content
        .presentationDetents(getDetents())
        .presentationDragIndicator(props.presentationDragIndicator.toPresentationDragIndicator())
    } else {
      content
    }
  }

  var body: some View {
    Rectangle().hidden()
      .sheet(isPresented: $isOpened) { sheetContent }
      .onChange(of: isOpened, perform: { newIsOpened in
        if props.isOpened == newIsOpened {
          return
        }
        props.onIsOpenedChange([
          "isOpened": newIsOpened
        ])
      })
      .onChange(of: props.isOpened) { newValue in
        isOpened = newValue
      }
      .onAppear {
        isOpened = props.isOpened
      }
  }
}

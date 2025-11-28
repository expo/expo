// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

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

final class BottomSheetProps: UIBaseViewProps {
  @Field var isOpened: Bool = false
  // Accepts `medium`, `large`, and `fraction` like 0.4
  @Field var presentationDetents: [Any]?
  @Field var presentationDragIndicator: PresentationDragIndicatorVisibility = .automatic
  @Field var presentationBackgroundInteraction: PresentationBackgroundInteractionProps?
  var onIsOpenedChange = EventDispatcher()
  @Field var interactiveDismissDisabled: Bool = false
}

struct HeightPreferenceKey: PreferenceKey {
  static var defaultValue: CGFloat?

  static func reduce(value: inout CGFloat?, nextValue: () -> CGFloat?) {
    guard let nextValue = nextValue() else {
      return
    }
    value = nextValue
  }
}

private struct ReadHeightModifier: ViewModifier {
  private var sizeView: some View {
    GeometryReader { geometry in
      Color.clear.preference(key: HeightPreferenceKey.self, value: geometry.size.height)
    }
  }

  func body(content: Content) -> some View {
    content.background(sizeView)
  }
}

struct BottomSheetView: ExpoSwiftUI.View {
  @ObservedObject var props: BottomSheetProps

  @State private var isOpened: Bool
  @State var height: CGFloat = 0
 
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
      return [.height(self.height)]
    }

    let result = detentArray.compactMap { detent(from: $0) }
    return result.isEmpty ? [.height(self.height)] : Set(result)
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

  var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      // When children contain a UIView (UIViewRepresentable),
      // SwiftUI will try to expand the UIView size to match the SwiftUI layout.
      // This breaks the `ReadHeightModifier()` size measurement.
      // In this case, we must measure the current view directly.
      let hasHostingChildren = (props.children ?? []).first { ExpoSwiftUI.isHostingView($0) } != nil

      Rectangle().hidden()
        .if(hasHostingChildren) {
          $0
            .modifier(ReadHeightModifier())
            .onPreferenceChange(HeightPreferenceKey.self) { height in
              if let height {
                self.height = height
              }
            }
        }
        .sheet(isPresented: $isOpened) {
          let sheetContent = Children()
            .if(!hasHostingChildren) {
              $0
                .modifier(ReadHeightModifier())
                .onPreferenceChange(HeightPreferenceKey.self) { height in
                  if let height {
                    self.height = height
                  }
                }
            }
            .presentationDetents(getDetents())
            .interactiveDismissDisabled(props.interactiveDismissDisabled)
            .presentationDragIndicator(props.presentationDragIndicator.toPresentationDragIndicator())

          if #available(iOS 16.4, tvOS 16.4, *) {
            sheetContent.presentationBackgroundInteraction(getPresentationBackgroundInteraction())
          } else {
            sheetContent
          }
        }
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
    } else {
      Rectangle().hidden()
        .sheet(isPresented: $isOpened) {
          Children()
            .interactiveDismissDisabled(props.interactiveDismissDisabled)
        }
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
}

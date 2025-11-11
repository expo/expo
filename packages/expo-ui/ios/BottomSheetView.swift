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

final class BottomSheetProps: UIBaseViewProps {
  @Field var isOpened: Bool = false
  // Accepts `medium`, `large`, and `fraction` like 0.4
  @Field var presentationDetents: [Any]?
  @Field var presentationDragIndicator: PresentationDragIndicatorVisibility = .automatic
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
        if let size {
          if let onChildrenSizeChange {
            onChildrenSizeChange(size)
          }
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
  private func getDetents() -> Set<PresentationDetent> {
    var result: Set<PresentationDetent> = []

    if let detentArray = props.presentationDetents {
      for detent in detentArray {
        if let str = detent as? String {
          switch str {
          case "medium":
            result.insert(.medium)
          case "large":
            result.insert(.large)
          default:
            break
          }
        } else if let value = detent as? Double {
          result.insert(.fraction(CGFloat(value)))
        }
      }
    }

    // fallback to children height if no detents were added
    return result.isEmpty ? [.height(childrenSize.height)] : result
  }

  private func handleChildrenSizeChange(_ size: CGSize) {
    // Only update if size actually changed to avoid unnecessary re-renders
    guard childrenSize != size else { return }
    childrenSize = size
  }

  var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      Rectangle().hidden()
        .sheet(isPresented: $isOpened) {
          BottomSheetSizeReader(
            children: Children(),
            onChildrenSizeChange: handleChildrenSizeChange
          )
          .presentationDetents(getDetents())
          .interactiveDismissDisabled(props.interactiveDismissDisabled)
          .presentationDragIndicator(props.presentationDragIndicator.toPresentationDragIndicator())
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
          BottomSheetSizeReader(
            children: Children(),
            onChildrenSizeChange: handleChildrenSizeChange
          )
        }
        .interactiveDismissDisabled(props.interactiveDismissDisabled)
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

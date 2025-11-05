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
  @Field var includeChildrenHeightDetent: Bool = false
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

struct SizePreferenceKey: PreferenceKey {
  static var defaultValue: CGSize?

  static func reduce(value: inout CGSize?, nextValue: () -> CGSize?) {
    guard let nextValue = nextValue() else {
      return
    }
    value = nextValue
  }
}

private struct ReadHeightModifier: ViewModifier {
  private var sizeView: some View {
    GeometryReader { geometry in
      Color.clear
        .preference(key: HeightPreferenceKey.self, value: geometry.size.height)
        .allowsHitTesting(false)
    }
  }

  func body(content: Content) -> some View {
    content.background(sizeView)
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

private struct BottomSheetSizeReader<Content: View>: View {
  let content: Content
  let onSizeChange: (CGSize) -> Void
  let onChildrenSizeChange: ((CGSize) -> Void)?

  init(
    content: Content,
    onSizeChange: @escaping (CGSize) -> Void,
    onChildrenSizeChange: ((CGSize) -> Void)? = nil
  ) {
    self.content = content
    self.onSizeChange = onSizeChange
    self.onChildrenSizeChange = onChildrenSizeChange
  }

  var body: some View {
    content
      .modifier(ReadSizeModifier())
      .onPreferenceChange(SizePreferenceKey.self) { size in
        if let size, let onChildrenSizeChange {
          onChildrenSizeChange(size)
        }
      }
      .background(
        GeometryReader { geo in
          Color.clear
            .onAppear {
              onSizeChange(geo.size)
            }
            .onChange(of: geo.size) {
              onSizeChange($0)
            }
            .allowsHitTesting(false)
        }
      )
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

    if props.includeChildrenHeightDetent && childrenSize.height > 0 {
      result.insert(.height(childrenSize.height))
    }

    // fallback to children height if no detents were added
    return result.isEmpty ? [.height(childrenSize.height)] : result
  }

  private func handleSheetSizeChange(_ size: CGSize) {
    props.virtualViewShadowNodeProxy?.setViewSize?(size)
  }

  private func handleChildrenSizeChange(_ size: CGSize) {
    // Only update if size actually changed to avoid unnecessary re-renders
    guard childrenSize != size else { return }
    childrenSize = size

    #if DEBUG
    if props.includeChildrenHeightDetent {
      print("BottomSheet children size updated: \(size), will add as detent")
    }
    #endif
  }

  var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {

      Rectangle().hidden()
        .sheet(isPresented: $isOpened) {
          BottomSheetSizeReader(
            content: Children(),
            onSizeChange: handleSheetSizeChange,
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
            content: Children()
              .interactiveDismissDisabled(props.interactiveDismissDisabled),
            onSizeChange: handleSheetSizeChange,
            onChildrenSizeChange: handleChildrenSizeChange
          )
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

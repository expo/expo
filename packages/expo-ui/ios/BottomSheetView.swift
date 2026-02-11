// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class BottomSheetProps: UIBaseViewProps {
  @Field var isPresented: Bool = false
  @Field var fitToContents: Bool = false
  var onIsPresentedChange = EventDispatcher()
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

private struct BottomSheetSizeReader<Content: View>: View {
  let content: Content
  let onSizeChange: ((CGSize) -> Void)?

  init(
    content: Content,
    onSizeChange: ((CGSize) -> Void)? = nil
  ) {
    self.content = content
    self.onSizeChange = onSizeChange
  }

  var body: some View {
    content
      .modifier(ReadSizeModifier())
      .onPreferenceChange(SizePreferenceKey.self) { size in
        if let size, let onSizeChange {
          onSizeChange(size)
        }
      }
  }
}

struct BottomSheetView: ExpoSwiftUI.View {
  @ObservedObject var props: BottomSheetProps
  @State private var isPresented: Bool
  @State private var childrenSize: CGSize = .zero

  init(props: BottomSheetProps) {
    self.props = props
    self._isPresented = State(initialValue: props.isPresented)
  }

  private func handleSizeChange(_ size: CGSize) {
    guard childrenSize != size else { return }
    childrenSize = size
  }

  @ViewBuilder
  private var sheetContent: some View {
    if props.fitToContents {
      let content = BottomSheetSizeReader(
        content: Children(),
        onSizeChange: handleSizeChange
      )
      if #available(iOS 16.0, tvOS 16.0, *) {
        content.presentationDetents([.height(childrenSize.height)])
      } else {
        content
      }
    } else {
      Children()
    }
  }

  var body: some View {
    Rectangle().hidden()
      .sheet(isPresented: $isPresented) {
        sheetContent
      }
      .onChange(of: isPresented, perform: { newIsPresented in
        if props.isPresented == newIsPresented {
          return
        }
        props.onIsPresentedChange([
          "isPresented": newIsPresented
        ])
      })
      .onChange(of: props.isPresented) { newValue in
        isPresented = newValue
      }
      .onAppear {
        isPresented = props.isPresented
      }
  }
}

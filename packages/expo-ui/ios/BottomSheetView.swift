// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class BottomSheetProps: UIBaseViewProps {
  @Field var isPresented: Bool = false
  @Field var fitToContents: Bool = false
  var onIsPresentedChange = EventDispatcher()
  var onDismiss = EventDispatcher()
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
  @State private var isPresented: Bool = false
  @State private var childrenSize: CGSize = .zero

  private func handleSizeChange(_ size: CGSize) {
    guard childrenSize != size else { return }
    childrenSize = size
  }

  @ViewBuilder
  private func contentChildren() -> some View {
    ForEach(props.children?.withoutSlot("anchor") ?? [], id: \.id) { child in
      let view: any View = child.childView
      AnyView(view)
    }
  }

  @ViewBuilder
  private var sheetContent: some View {
    if props.fitToContents {
      let content = BottomSheetSizeReader(
        content: contentChildren(),
        onSizeChange: handleSizeChange
      )
      if #available(iOS 16.0, tvOS 16.0, *) {
        content.presentationDetents(childrenSize.height > 0 ? [.height(childrenSize.height)] : [.medium])
      } else {
        content
      }
    } else {
      contentChildren()
    }
  }

  @ViewBuilder
  private var anchor: some View {
    if let anchorView = props.children?.slot("anchor") {
      anchorView
    } else {
      Color.clear.frame(width: 0, height: 0)
    }
  }

  var body: some View {
    anchor
      .sheet(isPresented: $isPresented, onDismiss: {
        props.onDismiss()
      }) {
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

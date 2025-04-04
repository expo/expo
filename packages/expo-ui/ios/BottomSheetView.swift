// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class BottomSheetProps: ExpoSwiftUI.ViewProps {
  @Field var isOpened: Bool = false
  var onIsOpenedChange = EventDispatcher()
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

struct BottomSheetView: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
  @ObservedObject var props: BottomSheetProps

  @State private var isOpened = true
  @State var height: CGFloat = 0

  init(props: BottomSheetProps) {
    self.props = props
  }

  var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      Rectangle().hidden()
        .modifier(ReadHeightModifier())
        .onPreferenceChange(HeightPreferenceKey.self) { height in
          if let height {
            self.height = height
          }
        }
        .sheet(isPresented: $isOpened) {
          Children()
            .presentationDetents([.height(self.height)])
        }
        .onChange(of: isOpened, perform: { newIsOpened in
          if props.isOpened == newIsOpened {
            return
          }
          props.onIsOpenedChange([
            "isOpened": newIsOpened
          ])
        })
        .onReceive(props.objectWillChange, perform: {
          isOpened = props.isOpened
        })
    } else {
      Rectangle().hidden()
        .sheet(isPresented: $isOpened) {
          Children()
        }
        .onChange(of: isOpened, perform: { newIsOpened in
          if props.isOpened == newIsOpened {
            return
          }
          props.onIsOpenedChange([
            "isOpened": newIsOpened
          ])
        })
        .onReceive(props.objectWillChange, perform: {
          isOpened = props.isOpened
        })
    }
  }
}

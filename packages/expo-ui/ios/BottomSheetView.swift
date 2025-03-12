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

struct BottomSheetView: ExpoSwiftUI.View {
  @EnvironmentObject var props: BottomSheetProps
  @EnvironmentObject var shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy
  
  @State private var isOpened = true
  @State var height: CGFloat = 0
  
  var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      Rectangle().hidden()
        .sheet(isPresented: $isOpened) {
          Group { Children()
          }.frame(maxWidth: .infinity, maxHeight: .infinity).onGeometryChange(for: CGSize.self) { proxy in
            proxy.size
        } action: {
          print("ongeochange", $0.height)
          if let setViewSize = shadowNodeProxy.setViewSize {
            
            setViewSize(CGSize(width: $0.width, height: $0.height))
          }
          
        }
          //            .blur(radius: 20)
          .presentationDetents([.medium, .large])
          //            .presentationDragIndicator(.visible)
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
    }
  }
}

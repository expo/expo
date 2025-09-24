// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class BottomSheetProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var isOpened: Bool = false
  @Field var presentationDetents: [Any]?
  var onIsOpenedChange = EventDispatcher()
  var onDismiss = EventDispatcher()
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
  
  @available(iOS 16.0, *)
  private func getDetents() -> Set<PresentationDetent> {
    guard let detentArray = props.presentationDetents, !detentArray.isEmpty else {
      return [.height(self.height)]
    }
    
    var result: Set<PresentationDetent> = []
    
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
    
    return result.isEmpty ? [.height(self.height)] : result
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
        .sheet(isPresented: $isOpened, onDismiss: {
          props.onDismiss()
        }) {
          Children()
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
        }
        .modifier(CommonViewModifiers(props: props))
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
        .sheet(isPresented: $isOpened, onDismiss: {
          props.onDismiss()
        }) {
          Children()
            .interactiveDismissDisabled(props.interactiveDismissDisabled)
        }
        .modifier(CommonViewModifiers(props: props))
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

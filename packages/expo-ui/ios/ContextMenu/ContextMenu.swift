import SwiftUI
import ExpoModulesCore

struct SinglePressContextMenu<ActivationElement: View, MenuContent: View>: View {
  let activationElement: ActivationElement
  let menuContent: MenuContent

  var body: some View {
    #if !os(tvOS)
    SwiftUI.Menu {
      menuContent
    } label: {
      activationElement
    }
    #else
    Text("SinglePressContextMenu is not supported on this platform")
    #endif
  }
}

struct LongPressContextMenuWithPreview<ActivationElement: View, Preview: View, MenuContent: View>: View {
  let activationElement: ActivationElement
  let preview: Preview
  let menuContent: MenuContent

  var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      activationElement.contextMenu(menuItems: {
        menuContent
      }, preview: {
        preview
      })
    } else {
      activationElement.contextMenu(menuItems: {
        menuContent
      })
    }
  }
}

struct ContextMenu: ExpoSwiftUI.View {
  @ObservedObject var props: ContextMenuProps

  var body: some View {
    let activationElement = (props.children?
      .compactMap { $0.childView as? ContextMenuActivationElement }
      .first) ?? ContextMenuActivationElement(props: ContextMenuActivationElementProps())

    let menuContent = (props.children?
      .compactMap { $0.childView as? ContextMenuContent }
      .first) ?? ContextMenuContent(props: ContextMenuContentProps())

    if props.activationMethod == .singlePress {
      SinglePressContextMenu(
        activationElement: activationElement,
        menuContent: menuContent
      )
      .modifier(CommonViewModifiers(props: props))
    } else {
      let preview = props.children?
        .compactMap { $0.childView as? ContextMenuPreview }
        .first

      if let preview {
        LongPressContextMenuWithPreview(
          activationElement: activationElement,
          preview: preview,
          menuContent: menuContent
        )
        .modifier(CommonViewModifiers(props: props))
      } else {
        LongPressContextMenu(
          activationElement: activationElement,
          menuContent: menuContent
        )
        .modifier(CommonViewModifiers(props: props))
      }
    }
  }
}

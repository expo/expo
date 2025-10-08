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

struct LongPressContextMenu<ActivationElement: View, MenuContent: View>: View {
  let activationElement: ActivationElement
  let menuContent: MenuContent

  var body: some View {
    activationElement.contextMenu(menuItems: {
      menuContent
    })
  }
}

struct LongPressContextMenuWithPreview<ActivationElement: View, Preview: View>: View {
  let elements: [ContextMenuElement]?
  let activationElement: ActivationElement
  let preview: Preview
  let props: ContextMenuProps?

  var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      activationElement.contextMenu(menuItems: {
//        MenuItems(fromElements: elements, props: props)
      }, preview: {
        preview
      })
    } else {
      activationElement.contextMenu(menuItems: {
//        MenuItems(fromElements: elements, props: props)
      })
    }
  }
}

struct ContextMenuPreview: ExpoSwiftUI.View {
  @ObservedObject var props: ContextMenuPreviewProps

  var body: some View {
    Children()
      .modifier(CommonViewModifiers(props: props))
  }
}

struct ContextMenuActivationElement: ExpoSwiftUI.View {
  @ObservedObject var props: ContextMenuActivationElementProps

  var body: some View {
    Children()
      .modifier(CommonViewModifiers(props: props))
  }
}

struct ContextMenu: ExpoSwiftUI.View {
  @ObservedObject var props: ContextMenuProps

  var body: some View {
    let activationElement = (props.children?
      .compactMap { $0.childView as? ContextMenuActivationElement }
      .first) ?? ContextMenuActivationElement(props: ContextMenuActivationElementProps())

    if props.activationMethod == .singlePress {
      SinglePressContextMenu(
        activationElement: activationElement,
        menuContent: Children()
      )
      .modifier(CommonViewModifiers(props: props))
    } else {
      let preview = props.children?
        .compactMap { $0.childView as? ContextMenuPreview }
        .first
      
      if let preview {
        LongPressContextMenuWithPreview(
          elements: props.elements,
          activationElement: activationElement,
          preview: preview,
          props: props
        )
        .modifier(CommonViewModifiers(props: props))
      } else {
        LongPressContextMenu(
          activationElement: activationElement,
          menuContent: Children()
        )
        .modifier(CommonViewModifiers(props: props))
      }
    }
  }
}

private func addId(_ id: String?, toMap initialMap: [String: Any]?) -> [String: Any] {
  var newMap = initialMap ?? [:]
  newMap["contextMenuElementID"] = id
  return newMap
}

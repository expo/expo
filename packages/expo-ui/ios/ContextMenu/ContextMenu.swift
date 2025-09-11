import SwiftUI
import ExpoModulesCore

struct MenuItems: View {
  let fromElements: [ContextMenuElement]?
  let props: ContextMenuProps?

  init(fromElements: [ContextMenuElement]?, props: ContextMenuProps?) {
    self.fromElements = fromElements
    self.props = props

    fromElements?.forEach { element in
      let id = element.contextMenuElementID
      if let button = element.button {
        button.onButtonPressed.onEventSent = { _ in
          props?.onContextMenuButtonPressed(addId(id, toMap: nil))
        }
      }
      if let `switch` = element.switch {
        `switch`.onValueChange.onEventSent = { map in
          props?.onContextMenuSwitchCheckedChanged(addId(id, toMap: map))
        }
      }
      if let picker = element.picker {
        picker.onOptionSelected.onEventSent = { map in
          props?.onContextMenuPickerOptionSelected(addId(id, toMap: map))
        }
      }
    }
  }

  var body: some View {
    ForEach(fromElements ?? []) { elem in
      if let button = elem.button {
        ExpoUI.Button(props: button)
      }

      if let picker = elem.picker {
        ExpoUI.PickerView(props: picker)
      }

      if let `switch` = elem.switch {
        ExpoUI.SwitchView(props: `switch`)
      }

      if let submenu = elem.submenu {
        SinglePressContextMenu(
          elements: submenu.elements,
          activationElement: ExpoUI.Button(props: submenu.button),
          props: props
        )
      }
    }
  }
}

struct SinglePressContextMenu<ActivationElement: View>: View {
  let elements: [ContextMenuElement]?
  let activationElement: ActivationElement
  let props: ContextMenuProps?

  var body: some View {
    #if !os(tvOS)
    SwiftUI.Menu {
      MenuItems(fromElements: elements, props: props)
    } label: {
      activationElement
    }
    #else
    Text("SinglePressContextMenu is not supported on this platform")
    #endif
  }
}

struct LongPressContextMenu<ActivationElement: View>: View {
  let elements: [ContextMenuElement]?
  let activationElement: ActivationElement
  let props: ContextMenuProps?

  var body: some View {
    activationElement.contextMenu(menuItems: {
      MenuItems(fromElements: elements, props: props)
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
        MenuItems(fromElements: elements, props: props)
      }, preview: {
        preview
      })
    } else {
      activationElement.contextMenu(menuItems: {
        MenuItems(fromElements: elements, props: props)
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
    if props.activationMethod == .singlePress {
      let activationElement = props.children?
        .compactMap { $0.childView as? ContextMenuActivationElement }
        .first
      SinglePressContextMenu(
        elements: props.elements,
        activationElement: activationElement,
        props: props
      )
      .modifier(CommonViewModifiers(props: props))
    } else {
      let preview = props.children?
        .compactMap { $0.childView as? ContextMenuPreview }
        .first
      let activationElement = props.children?
        .compactMap { $0.childView as? ContextMenuActivationElement }
        .first
      if preview != nil {
        LongPressContextMenuWithPreview(
          elements: props.elements,
          activationElement: activationElement,
          preview: preview,
          props: props
        )
        .modifier(CommonViewModifiers(props: props))
      } else {
        LongPressContextMenu(
          elements: props.elements,
          activationElement: activationElement,
          props: props
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

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
        button.internalOnPress = {
          props?.onContextMenuButtonPressed(addId(id, toMap: nil))
        }
      }
      if let `switch` = element.switch {
        `switch`.internalOnCheckedChanged = { map in
          props?.onContextMenuSwitchCheckedChanged(addId(id, toMap: map))
        }
      }
      if let picker = element.picker {
        picker.internalOnOptionSelected = { map in
          props?.onContextMenuPickerOptionSelected(addId(id, toMap: map))
        }
      }
    }
  }

  var body: some View {
    ForEach(fromElements ?? []) { elem in
      if let button = elem.button {
        ExpoUI.Button().environmentObject(button)
      }

      if let picker = elem.picker {
        ExpoUI.PickerView().environmentObject(picker)
      }

      if let `switch` = elem.switch {
        ExpoUI.SwitchView().environmentObject(`switch`)
      }

      if let submenu = elem.submenu {
        SinglePressContextMenu(
          elements: submenu.elements,
          activationElement: ExpoUI.Button().environmentObject(submenu.button),
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
    SwiftUI.Menu {
      MenuItems(fromElements: elements, props: props)
    } label: {
      activationElement
    }
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

struct ContextMenu: ExpoSwiftUI.View {
  @EnvironmentObject var props: ContextMenuProps

  var body: some View {
    if props.activationMethod == .singlePress {
      SinglePressContextMenu(elements: props.elements, activationElement: Children(), props: props)
    } else {
      LongPressContextMenu(elements: props.elements, activationElement: Children(), props: props)
    }
  }
}

private func addId(_ id: String?, toMap initialMap: [String: Any]?) -> [String: Any] {
  var newMap = initialMap ?? [:]
  newMap["contextMenuElementID"] = id
  return newMap
}

import SwiftUI
import ExpoModulesCore

struct LongPressContextMenu<ActivationElement: View, MenuContent: View>: View {
  let activationElement: ActivationElement
  let menuContent: MenuContent

  var body: some View {
    activationElement.contextMenu(menuItems: {
      menuContent
    })
  }
}

struct ContextMenuPreview: ExpoSwiftUI.View {
  @ObservedObject var props: ContextMenuPreviewProps

  var body: some View {
    Children()
  }
}

struct ContextMenuContent: ExpoSwiftUI.View {
  @ObservedObject var props: ContextMenuContentProps

  var body: some View {
    Children()
  }
}

struct ContextMenuActivationElement: ExpoSwiftUI.View {
  @ObservedObject var props: ContextMenuActivationElementProps

  var body: some View {
    Children()
  }
}

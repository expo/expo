import SwiftUI
import ExpoModulesCore

struct ContextMenu: ExpoSwiftUI.View {
  @ObservedObject var props: ContextMenuProps

  var body: some View {
    let activationElement = props.children?
      .compactMap { $0.childView as? ContextMenuActivationElement }
      .first

    let menuContent = props.children?
      .compactMap { $0.childView as? ContextMenuContent }
      .first

    let preview = props.children?
      .compactMap { $0.childView as? ContextMenuPreview }
      .first

    if let activationElement, let menuContent {
      if #available(iOS 16.0, tvOS 16.0, *), let preview {
        activationElement.contextMenu {
          menuContent
        } preview: {
          preview
        }
      } else {
        activationElement.contextMenu {
          menuContent
        }
      }
    }
  }
}

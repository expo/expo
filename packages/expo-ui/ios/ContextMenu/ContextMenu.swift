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

struct PeekAndPop<ActivationElement: View, Preview: View>: UIViewRepresentable {
    let elements: [ContextMenuElement]?
    let activationElement: ActivationElement
    let preview: Preview
    let props: ContextMenuProps?
    let onPreviewTap: () -> Void

    func makeUIView(context: Context) -> UIView {
        let containerView = UIView()

        // Embed the SwiftUI activationElement in UIKit
        let hostingController = UIHostingController(rootView: activationElement)
        context.coordinator.hostingController = hostingController

        // Add the hostingController's view to the container
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(hostingController.view)

        NSLayoutConstraint.activate([
            hostingController.view.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
            hostingController.view.topAnchor.constraint(equalTo: containerView.topAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: containerView.bottomAnchor)
        ])

        let interaction = UIContextMenuInteraction(delegate: context.coordinator)
        containerView.addInteraction(interaction)

        return containerView
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        // No-op
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(preview: preview, elements: elements, onPreviewTap: onPreviewTap)
    }

    class Coordinator: NSObject, UIContextMenuInteractionDelegate {
        var hostingController: UIHostingController<ActivationElement>?
        let preview: Preview
        let elements: [ContextMenuElement]?
        let onPreviewTap: () -> Void

        init(preview: Preview, elements: [ContextMenuElement]?, onPreviewTap: @escaping () -> Void) {
            self.preview = preview
            self.elements = elements
            self.onPreviewTap = onPreviewTap
        }

        func contextMenuInteraction(_ interaction: UIContextMenuInteraction, configurationForMenuAtLocation location: CGPoint) -> UIContextMenuConfiguration? {
            return UIContextMenuConfiguration(identifier: nil, previewProvider: {
                let hosting = UIHostingController(rootView: self.preview)
                hosting.view.backgroundColor = .clear
                return hosting
            }, actionProvider: { _ in
                UIMenu(title: "", children: [])
            })
        }

        func contextMenuInteraction(_ interaction: UIContextMenuInteraction, willPerformPreviewActionForMenuWith configuration: UIContextMenuConfiguration, animator: UIContextMenuInteractionCommitAnimating) {
            animator.addCompletion {
                self.onPreviewTap()
            }
        }
    }
}


struct ContextMenuPreview: ExpoSwiftUI.View {
  @ObservedObject var props: ContextMenuPreviewProps

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
    } else {
      let preview = props.children?
        .compactMap { $0.childView as? ContextMenuPreview }
        .first
      let activationElement = props.children?
        .compactMap { $0.childView as? ContextMenuActivationElement }
        .first
      if preview != nil {
      PeekAndPop(
          elements: props.elements,
          activationElement: activationElement,
          preview: preview,
          props: props,
          onPreviewTap: { props.onPreviewTap() }
        )
      } else {
        LongPressContextMenu(
          elements: props.elements,
          activationElement: activationElement,
          props: props
        )
      }
    }
  }
}

private func addId(_ id: String?, toMap initialMap: [String: Any]?) -> [String: Any] {
  var newMap = initialMap ?? [:]
  newMap["contextMenuElementID"] = id
  return newMap
}

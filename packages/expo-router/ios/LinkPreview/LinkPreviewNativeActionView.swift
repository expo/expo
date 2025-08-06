import ExpoModulesCore
import WebKit

class LinkPreviewNativeActionView: ExpoView {
  // MARK: - Shared props
  var title: String = "" {
    didSet {
      updateUiAction()
      if isMenuAction {
        updateMenuAction()
      }
    }
  }
  var icon: String? {
    didSet {
      updateUiAction()
      if isMenuAction {
        updateMenuAction()
      }
    }
  }
  var destructive: Bool = false {
    didSet {
      updateUiAction()
      if isMenuAction {
        updateMenuAction()
      }
    }
  }

  // MARK: - Action only props
  var disabled: Bool = false {
    didSet {
      updateUiAction()
    }
  }
  var isOn: Bool = false {
    didSet {
      updateUiAction()
    }
  }
  var keepPresented: Bool = false {
    didSet {
      updateUiAction()
    }
  }

  // MARK: - Menu only props
  var singleSelection: Bool = false {
    didSet {
      if isMenuAction {
        updateMenuAction()
      }
    }
  }
  var displayAsPalette: Bool = false {
    didSet {
      if isMenuAction {
        updateMenuAction()
      }
    }
  }
  var displayInline: Bool = false {
    didSet {
      if isMenuAction {
        updateMenuAction()
      }
    }
  }
  var subActions: [LinkPreviewNativeActionView] = [] {
    didSet {
      updateMenuAction()
    }
  }

  // MARK: - Events
  let onSelected = EventDispatcher()

  // MARK: - Native API
  var updateMenuCallback: (() -> Void) = {}

  private var baseUiAction: UIAction
  private var menuAction: UIMenu

  var isMenuAction: Bool {
    return !subActions.isEmpty
  }

  var uiAction: UIMenuElement {
    isMenuAction ? menuAction : baseUiAction
  }

  required init(appContext: AppContext? = nil) {
    baseUiAction = UIAction(title: "", handler: { _ in })
    menuAction = UIMenu(title: "", image: nil, options: [], children: [])
    super.init(appContext: appContext)
    clipsToBounds = true
    baseUiAction = UIAction(title: "", handler: { _ in self.onSelected() })
  }

  private func updateMenuAction() {
    let subActions = subActions.map { subAction in
      subAction.uiAction
    }
    var options: UIMenu.Options = []
    if #available(iOS 17.0, *) {
      if displayAsPalette {
        options.insert(.displayAsPalette)
      }
    }
    if singleSelection {
      options.insert(.singleSelection)
    }
    if displayInline {
      options.insert(.displayInline)
    }
    if destructive {
      options.insert(.destructive)
    }

    menuAction = UIMenu(
      title: title,
      image: icon.flatMap { UIImage(systemName: $0) },
      options: options,
      children: subActions
    )

    updateMenuCallback()
  }

  private func updateUiAction() {
    var attributes: UIMenuElement.Attributes = []
    if destructive { attributes.insert(.destructive) }
    if disabled { attributes.insert(.disabled) }

    if #available(iOS 16.0, *) {
      if keepPresented { attributes.insert(.keepsMenuPresented) }
    }

    baseUiAction.title = title
    baseUiAction.image = icon.flatMap { UIImage(systemName: $0) }
    baseUiAction.attributes = attributes
    baseUiAction.state = isOn ? .on : .off

    updateMenuCallback()
  }

  #if RCT_NEW_ARCH_ENABLED
    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
      if let childActionView = childComponentView as? LinkPreviewNativeActionView {
        subActions.append(childActionView)
        childActionView.updateMenuCallback = { [weak self] in
          self?.updateMenuCallback()
        }
      } else {
        print(
          "ExpoRouter: Unknown child component view (\(childComponentView)) mounted to NativeLinkPreviewActionView"
        )
      }
    }

    override func unmountChildComponentView(_ child: UIView, index: Int) {
      if let childActionView = child as? LinkPreviewNativeActionView {
        subActions.removeAll(where: { $0 == childActionView })
      } else {
        print(
          "ExpoRouter: Unknown child component view (\(child)) unmounted from NativeLinkPreviewActionView"
        )
      }
    }
  #endif
}

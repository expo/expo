import ExpoModulesCore

class LinkPreviewNativeActionView: RouterViewWithLogger, LinkPreviewMenuUpdatable {
  var identifier: String = ""
  // MARK: - Shared props
  @NativeActionProp(updateAction: true, updateMenu: true) var title: String = ""
  @NativeActionProp(updateMenu: true) var label: String?
  @NativeActionProp(updateAction: true, updateMenu: true) var icon: String?
  @NativeActionProp(updateAction: true, updateMenu: true) var xcassetName: String?
  var customImage: SharedRef<UIImage>? {
    didSet {
      updateUiAction()
      updateMenu()
    }
  }
  @NativeActionProp(updateAction: true, updateMenu: true) var imageRenderingMode: ImageRenderingMode?
  @NativeActionProp(updateAction: true, updateMenu: true) var destructive: Bool?
  @NativeActionProp(updateAction: true, updateMenu: true) var disabled: Bool = false

  // MARK: - Action only props
  @NativeActionProp(updateAction: true) var isOn: Bool?
  @NativeActionProp(updateAction: true) var keepPresented: Bool?
  @NativeActionProp(updateAction: true) var discoverabilityLabel: String?
  @NativeActionProp(updateAction: true, updateMenu: true) var subtitle: String?

  // MARK: - Menu only props
  @NativeActionProp(updateMenu: true) var singleSelection: Bool = false
  @NativeActionProp(updateMenu: true) var displayAsPalette: Bool = false
  @NativeActionProp(updateMenu: true) var displayInline: Bool = false
  @NativeActionProp(updateMenu: true) var preferredElementSize: MenuElementSize?

  // MARK: - UIBarButtonItem props
  @NativeActionProp(updateAction: true, updateMenu: true) var routerHidden: Bool = false
  @NativeActionProp(updateMenu: true) var titleStyle: TitleStyle?
  @NativeActionProp(updateMenu: true) var sharesBackground: Bool?
  @NativeActionProp(updateMenu: true) var hidesSharedBackground: Bool?
  @NativeActionProp(updateAction: true, updateMenu: true) var customTintColor: UIColor?
  @NativeActionProp(updateMenu: true) var barButtonItemStyle: UIBarButtonItem.Style?
  @NativeActionProp(updateMenu: true) var subActions: [LinkPreviewNativeActionView] = []
  @NativeActionProp(updateMenu: true) var accessibilityLabelForMenu: String?
  @NativeActionProp(updateMenu: true) var accessibilityHintForMenu: String?

  // MARK: - Events
  let onSelected = EventDispatcher()

  // MARK: - Native API
  weak var parentMenuUpdatable: LinkPreviewMenuUpdatable?

  private var baseUiAction: UIAction
  private var menuAction: UIMenu

  var isMenuAction: Bool {
    return !subActions.isEmpty
  }

  var uiAction: UIMenuElement {
    isMenuAction ? menuAction : baseUiAction
  }

  var image: UIImage? {
    if let customImage = customImage {
      let renderingMode: UIImage.RenderingMode = imageRenderingMode == .template ? .alwaysTemplate : .alwaysOriginal
      return customImage.ref.withRenderingMode(renderingMode)
    }
    if let xcassetName = xcassetName {
      let renderingMode: UIImage.RenderingMode = imageRenderingMode == .template ? .alwaysTemplate : .alwaysOriginal
      return UIImage(named: xcassetName)?.withRenderingMode(renderingMode)
    }
    if let icon = icon {
      return UIImage(systemName: icon)
    }
    return nil
  }

  required init(appContext: AppContext? = nil) {
    baseUiAction = UIAction(title: "", handler: { _ in })
    menuAction = UIMenu(title: "", image: nil, options: [], children: [])
    super.init(appContext: appContext)
    clipsToBounds = true
    baseUiAction = UIAction(title: "", handler: { _ in self.onSelected() })
  }

  func updateMenu() {
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
    if destructive == true {
      options.insert(.destructive)
    }

    menuAction = UIMenu(
      title: title,
      image: image,
      options: options,
      children: subActions
    )

    if let subtitle = subtitle {
      menuAction.subtitle = subtitle
    }

    if #available(iOS 16.0, *) {
      if let preferredElementSize = preferredElementSize {
        menuAction.preferredElementSize = preferredElementSize.toUIMenuElementSize()
      }
    }

    parentMenuUpdatable?.updateMenu()
  }

  func updateUiAction() {
    var attributes: UIMenuElement.Attributes = []
    if destructive == true { attributes.insert(.destructive) }
    if disabled == true { attributes.insert(.disabled) }
    if routerHidden {
      attributes.insert(.hidden)
    }

    if #available(iOS 16.0, *) {
      if keepPresented == true { attributes.insert(.keepsMenuPresented) }
    }

    baseUiAction.title = title
    baseUiAction.image = image
    baseUiAction.attributes = attributes
    baseUiAction.state = isOn == true ? .on : .off

    if let subtitle = subtitle {
      baseUiAction.subtitle = subtitle
    }
    if let label = discoverabilityLabel {
      baseUiAction.discoverabilityTitle = label
    }

    parentMenuUpdatable?.updateMenu()
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let childActionView = childComponentView as? LinkPreviewNativeActionView {
      subActions.insert(childActionView, at: index)
      childActionView.parentMenuUpdatable = self
    } else {
      logger?.warn(
        "[expo-router] Unknown child component view (\(childComponentView)) mounted to NativeLinkPreviewActionView. This is most likely a bug in expo-router."
      )
    }
  }

  override func unmountChildComponentView(_ child: UIView, index: Int) {
    if let childActionView = child as? LinkPreviewNativeActionView {
      subActions.removeAll(where: { $0 == childActionView })
    } else {
      logger?.warn(
        "ExpoRouter: Unknown child component view (\(child)) unmounted from NativeLinkPreviewActionView. This is most likely a bug in expo-router."
      )
    }
  }

  @propertyWrapper
  struct NativeActionProp<Value: Equatable> {
    var value: Value
    let updateAction: Bool
    let updateMenu: Bool

    init(wrappedValue: Value, updateAction: Bool = false, updateMenu: Bool = false) {
      self.value = wrappedValue
      self.updateAction = updateAction
      self.updateMenu = updateMenu
    }

    static subscript<EnclosingSelf: LinkPreviewNativeActionView>(
      _enclosingInstance instance: EnclosingSelf,
      wrapped wrappedKeyPath: ReferenceWritableKeyPath<EnclosingSelf, Value>,
      storage storageKeyPath: ReferenceWritableKeyPath<EnclosingSelf, NativeActionProp<Value>>
    ) -> Value {
      get {
        instance[keyPath: storageKeyPath].value
      }
      set {
        let oldValue = instance[keyPath: storageKeyPath].value
        if oldValue != newValue {
          instance[keyPath: storageKeyPath].value = newValue
          if instance[keyPath: storageKeyPath].updateAction {
            instance.updateUiAction()
          }
          if instance[keyPath: storageKeyPath].updateMenu {
            instance.updateMenu()
          }
        }
      }
    }

    var wrappedValue: Value {
      get { value }
      set { value = newValue }
    }
  }
}

// Needed to allow optional properties without default `= nil` to avoid repetition
extension LinkPreviewNativeActionView.NativeActionProp where Value: ExpressibleByNilLiteral {
  init(updateAction: Bool = false, updateMenu: Bool = false) {
    self.value = nil
    self.updateAction = updateAction
    self.updateMenu = updateMenu
  }
}

protocol LinkPreviewMenuUpdatable: AnyObject {
  func updateMenu()
}

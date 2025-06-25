import ExpoModulesCore

class NativeLinkPreviewView: ExpoView, UIContextMenuInteractionDelegate {
  private var trigger: NativeLinkPreviewTrigger?
  private var preview: NativeLinkPreviewContentView?
  private var interaction: UIContextMenuInteraction?
  private var nextScreenId: String?
  private var actions: [LinkPreviewNativeActionView] = []
  
  private let linkPreviewNativeNavigation = LinkPreviewNativeNavigation()
  
  let onPreviewTapped = EventDispatcher()
  let onWillPreviewOpen = EventDispatcher()
  let onDidPreviewOpen = EventDispatcher()
  let onPreviewWillClose = EventDispatcher()
  let onPreviewDidClose = EventDispatcher()
  let onActionSelected = EventDispatcher()
  
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.interaction = UIContextMenuInteraction(delegate: self)
  }
  
  // MARK: - Props
  
  func setNextScreenId(_ screenId: String) {
    self.nextScreenId = screenId
    linkPreviewNativeNavigation.updatePreloadedView(screenId, with: self)
  }
  
  // MARK: - Children
  
  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let triggerView = childComponentView as? NativeLinkPreviewTrigger {
      trigger = triggerView
      if let interaction = self.interaction, self.preview != nil {
        trigger?.addInteraction(interaction)
      }
      super.mountChildComponentView(childComponentView, index: index)
    } else if let previewView = childComponentView as? NativeLinkPreviewContentView {
      preview = previewView
      if let interaction = self.interaction, let trigger = self.trigger {
        trigger.addInteraction(interaction)
      }
    } else if let actionView = childComponentView as? LinkPreviewNativeActionView {
      actions.append(actionView)
    } else {
      print(
        "ExpoRouter: Unknown child component view (\(childComponentView)) mounted to NativeLinkPreviewView"
      )
    }
  }
  
  override func unmountChildComponentView(_ child: UIView, index: Int) {
    if child is NativeLinkPreviewTrigger {
      if let interaction = self.interaction {
        trigger?.removeInteraction(interaction)
      }
      trigger = nil
      super.unmountChildComponentView(child, index: index)
    } else if child is NativeLinkPreviewContentView {
      preview = nil
      if let interaction = self.interaction {
        trigger?.removeInteraction(interaction)
      }
    } else if let actionView = child as? LinkPreviewNativeActionView {
      actions.removeAll(where: {
        $0 == actionView
      })
    } else {
      print(
        "ExpoRouter: Unknown child component view (\(child)) unmounted from NativeLinkPreviewView")
    }
  }
  
  // MARK: - UIContextMenuInteractionDelegate
  
  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    configurationForMenuAtLocation location: CGPoint
  ) -> UIContextMenuConfiguration? {
    onWillPreviewOpen()
    return UIContextMenuConfiguration(
      identifier: nil,
      previewProvider: { [weak self] in
        self?.createPreviewViewController()
      },
      actionProvider: { [weak self] _ in
        self?.createContextMenu()
      })
  }
  
  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    configuration: UIContextMenuConfiguration,
    highlightPreviewForItemWithIdentifier identifier: any NSCopying
  ) -> UITargetedPreview? {
    if let trigger = self.trigger {
      let target = UIPreviewTarget(container: self, center: trigger.center)
      
      let parameters = UIPreviewParameters()
      parameters.backgroundColor = .clear
      parameters.shadowPath = UIBezierPath(roundedRect: trigger.bounds, cornerRadius: 10)
      
      return UITargetedPreview(view: trigger, parameters: parameters, target: target)
    }
    return nil
  }
  
  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    willDisplayMenuFor configuration: UIContextMenuConfiguration,
    animator: UIContextMenuInteractionAnimating?
  ) {
    // This happens when preview starts to become visible.
    // It is not yet fully extended at this moment though
    self.onDidPreviewOpen()
    animator?.addCompletion {
      // This happens around a second after the preview is opened and thus gives us no real value
      // User could have already interacted with preview beforehand
    }
  }
  
  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    willEndFor configuration: UIContextMenuConfiguration,
    animator: UIContextMenuInteractionAnimating?
  ) {
    onPreviewWillClose()
    animator?.addCompletion {
      self.onPreviewDidClose()
    }
  }
  
  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    willPerformPreviewActionForMenuWith configuration: UIContextMenuConfiguration,
    animator: UIContextMenuInteractionCommitAnimating
  ) {
    linkPreviewNativeNavigation.pushPreloadedView()
    animator.addCompletion { [weak self] in
      self?.onPreviewTapped()
    }
  }
  
  // MARK: - Context Menu Helpers
  
  private func createPreviewViewController() -> UIViewController {
    guard let preview = preview else {
      return UIViewController()
    }
    
    let vc = PreviewViewController(linkPreviewNativePreview: preview)
    vc.view.addSubview(preview)
    let preferredSize = preview.preferredContentSize
    vc.preferredContentSize.width = preferredSize.width
    vc.preferredContentSize.height = preferredSize.height
    return vc
  }
  
  private func createImg(source: String) -> UIImage? {
    var parsedImage: UIImage? = nil
    
    if source != "" {
      if let img = UIImage(named: source) {
        parsedImage = img
      } else if let systemImage = UIImage(systemName: source) {
        parsedImage = systemImage
      } else {
        parsedImage = UIImage(systemName: "questionmark") ?? UIImage()
      }
    }
    
    return parsedImage
  }
  
  private func createSubContextMenu(action: LinkPreviewNativeActionView) -> UIMenuElement {
    let parsedImage = createImg(source: action.image)
    
    if action.children.count > 0 {
      var options: UIMenu.Options = []
      
      if action.destructive {
        options = options.union(.destructive)
      }
      if action.displayInline {
        options = options.union(.displayInline)
      }
      if action.singleSelection {
        options = options.union(.singleSelection)
      }
      if #available(iOS 17.0, *) {
        if action.displayAsPalette {
          options = options.union(.displayAsPalette)
        }
      }
      
      return UIMenu(
        title: action.title,
        subtitle: action.subtitle,
        image: parsedImage,
        identifier: UIMenu.Identifier(rawValue: action.id),
        options: options,
        children: action.children.map {
          createSubContextMenu(action: $0)
        }
      )
    }
    
    var attributes: UIMenuElement.Attributes = []
    
    if action.destructive {
      attributes = [.destructive]
    }
    if action.disabled {
      attributes = attributes.union(.disabled)
    }
    if action.isHidden {
      attributes = attributes.union(.hidden)
    }
    if #available(iOS 16.0, *) {
      if action.persistent {
        attributes = attributes.union(.keepsMenuPresented)
      }
    }
   
    return UIAction(
      title: action.title,
      subtitle: action.subtitle,
      image: parsedImage,
      attributes: attributes
    ) { _ in
      self.onActionSelected([
        "id": action.id
      ])
    }
  }
  
  private func createContextMenu() -> UIMenu {
    return UIMenu(title: "", children: actions.map { action in
      createSubContextMenu(action: action)
    })
  }
}

class PreviewViewController: UIViewController {
  private let linkPreviewNativePreview: NativeLinkPreviewContentView
  init(linkPreviewNativePreview: NativeLinkPreviewContentView) {
    self.linkPreviewNativePreview = linkPreviewNativePreview
    super.init(nibName: nil, bundle: nil)
  }
  
  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  // TODO: Consider using setViewSize from ExpoFabricView
  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    linkPreviewNativePreview.setInitialSize(bounds: self.view.bounds)
  }
}

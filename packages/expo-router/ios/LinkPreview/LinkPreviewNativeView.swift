import ExpoModulesCore

class NativeLinkPreviewView: ExpoView, UIContextMenuInteractionDelegate,
  LinkPreviewModalDismissible, LinkPreviewMenuUpdatable {
  var triggerBorderRadius: Double = 0
  private var preview: NativeLinkPreviewContentView?
  private var interaction: UIContextMenuInteraction?
  var nextScreenId: String? {
    didSet {
      performUpdateOfPreloadedView()
    }
  }
  var tabPath: TabPathPayload? {
    didSet {
      performUpdateOfPreloadedView()
    }
  }
  private var actions: [LinkPreviewNativeActionView] = []

  private let linkPreviewNativeNavigation = LinkPreviewNativeNavigation()

  let onPreviewTapped = EventDispatcher()
  let onPreviewTappedAnimationCompleted = EventDispatcher()
  let onWillPreviewOpen = EventDispatcher()
  let onDidPreviewOpen = EventDispatcher()
  let onPreviewWillClose = EventDispatcher()
  let onPreviewDidClose = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.interaction = UIContextMenuInteraction(delegate: self)
  }

  // MARK: - LinkPreviewModalDismissable

  func isDismissible() -> Bool {
    return false
  }

  // MARK: - Props

  func performUpdateOfPreloadedView() {
    if nextScreenId == nil && tabPath?.path.isEmpty != false {
      // If we have no tab to change and no screen to push, then we can't update the preloaded view
      return
    }
    // However if one these is defined then we can perform the native update
    linkPreviewNativeNavigation.updatePreloadedView(
      screenId: nextScreenId, tabPath: tabPath, responder: self)
  }

  // MARK: - Children
  #if RCT_NEW_ARCH_ENABLED
    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
      if let previewView = childComponentView as? NativeLinkPreviewContentView {
        preview = previewView
        if let interaction = self.interaction {
          self.addInteraction(interaction)
        }
      } else if let actionView = childComponentView as? LinkPreviewNativeActionView {
        actionView.parentMenuUpdatable = self
        actions.append(actionView)
      } else {
        super.mountChildComponentView(childComponentView, index: index)
      }
    }

    override func unmountChildComponentView(_ child: UIView, index: Int) {
      if child is NativeLinkPreviewContentView {
        preview = nil
        if let interaction = self.interaction {
          self.removeInteraction(interaction)
        }
      } else if let actionView = child as? LinkPreviewNativeActionView {
        actions.removeAll(where: {
          $0 == actionView
        })
      } else {
        super.unmountChildComponentView(child, index: index)
      }
    }
  #endif

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
    if let superview = self.superview {
      let target = UIPreviewTarget(container: superview, center: self.center)

      let parameters = UIPreviewParameters()
      parameters.backgroundColor = .clear
      parameters.shadowPath = UIBezierPath(
        roundedRect: self.bounds, cornerRadius: self.triggerBorderRadius)

      return UITargetedPreview(view: self, parameters: parameters, target: target)
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
    self.onPreviewTapped()
    animator.addCompletion { [weak self] in
      self?.linkPreviewNativeNavigation.pushPreloadedView()
      self?.onPreviewTappedAnimationCompleted()
    }
  }

  // MARK: - Context Menu Helpers

  private func createPreviewViewController() -> UIViewController? {
    guard let preview = preview else {
      return nil
    }

    let vc = PreviewViewController(linkPreviewNativePreview: preview)
    vc.view.addSubview(preview)
    let preferredSize = preview.preferredContentSize
    vc.preferredContentSize.width = preferredSize.width
    vc.preferredContentSize.height = preferredSize.height
    return vc
  }

  func updateMenu() {
    self.interaction?.updateVisibleMenu { _ in
      self.createContextMenu()
    }
  }

  private func createContextMenu() -> UIMenu {
    if actions.count == 1, let menu = actions[0].uiAction as? UIMenu {
      return menu
    }
    return UIMenu(
      title: "",
      children: actions.map { action in
        action.uiAction
      }
    )
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

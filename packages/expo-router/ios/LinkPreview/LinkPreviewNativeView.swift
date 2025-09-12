import ExpoModulesCore

class NativeLinkPreviewView: ExpoView, UIContextMenuInteractionDelegate,
  LinkPreviewModalDismissible, LinkPreviewMenuUpdatable {
  private var preview: NativeLinkPreviewContentView?
  private var interaction: UIContextMenuInteraction?
  private var directChild: UIView?
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
      } else if let actionView = childComponentView as? LinkPreviewNativeActionView {
        actionView.parentMenuUpdatable = self
        actions.append(actionView)
      } else {
        if directChild != nil {
          print(
            "[expo-router] Found a second child of <Link.Trigger>. Only one is allowed. This is most likely a bug in expo-router."
          )
          return
        }
        directChild = childComponentView
        if let interaction = self.interaction {
          childComponentView.addInteraction(interaction)
        }
        super.mountChildComponentView(childComponentView, index: index)
      }
    }

    override func unmountChildComponentView(_ child: UIView, index: Int) {
      if child is NativeLinkPreviewContentView {
        preview = nil
      } else if let actionView = child as? LinkPreviewNativeActionView {
        actions.removeAll(where: {
          $0 == actionView
        })
      } else {
        if let directChild = directChild {
          if directChild != child {
            print(
              "[expo-router] Unmounting unexpected child from <Link.Trigger>. This is most likely a bug in expo-router."
            )
            return
          }
          if let interaction = self.interaction {
            directChild.removeInteraction(interaction)
          }
          super.unmountChildComponentView(child, index: index)
        } else {
          print(
            "[expo-router] No link child found to unmount. This is most likely a bug in expo-router."
          )
          return
        }
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
      if let directChild = self.directChild {
        let target = UIPreviewTarget(
          container: superview, center: self.convert(directChild.center, to: superview))

        let parameters = UIPreviewParameters()
        parameters.backgroundColor = .clear

        return UITargetedPreview(view: directChild, parameters: parameters, target: target)
      }
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

  override func loadView() {
    self.view = linkPreviewNativePreview
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

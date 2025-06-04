import ExpoModulesCore
import WebKit

// This view will be used as a native component. Make sure to inherit from `ExpoView`
// to apply the proper styling (e.g. border radius and shadows).
class PeekAndPopView: ExpoView, UIContextMenuInteractionDelegate {
    private var trigger: PeekAndPopTriggerView?
    private var preview: PeekAndPopPreviewView?
    private var interaction: UIContextMenuInteraction?
    private var nextScreenTag: Int?

    private let math: PeekAndPopNavigation = PeekAndPopNavigation()

    let onPreviewTapped = EventDispatcher()
    let onWillPreviewOpen = EventDispatcher()
    let onDidPreviewOpen = EventDispatcher()
    let onPreviewClose = EventDispatcher()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        self.interaction = UIContextMenuInteraction(delegate: self)
    }

    func setNextScreenTag(_ tag: Int) {
        self.nextScreenTag = tag
        math.updatePreloadedView(Int32(tag), with: self)
    }

    /**
        Fabric calls this function when mounting (attaching) a child component view.
        */
    public override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
        if let triggerView = childComponentView as? PeekAndPopTriggerView {
            trigger = triggerView
            super.mountChildComponentView(childComponentView, index: index)
        } else if let previewView = childComponentView as? PeekAndPopPreviewView {
            preview = previewView
            self.addInteraction(interaction!)
        } else {
            print("Unknown child component view \(childComponentView)")
        }
    }

    /**
        Fabric calls this function when unmounting (detaching) a child component view.
        */
    public override func unmountChildComponentView(_ child: UIView, index: Int) {
        if child is PeekAndPopTriggerView {
            trigger = nil
            super.unmountChildComponentView(child, index: index)
        } else if child is PeekAndPopPreviewView {
            preview = nil
            self.removeInteraction(interaction!)
        } else {
            print("Unknown child component view")
        }
    }

    // MARK: - UIContextMenuInteractionDelegate

    func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        configurationForMenuAtLocation location: CGPoint
    ) -> UIContextMenuConfiguration? {
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
        willDisplayMenuFor configuration: UIContextMenuConfiguration,
        animator: UIContextMenuInteractionAnimating?
    ) {
        onWillPreviewOpen()
        animator?.addCompletion {
            self.onDidPreviewOpen()
        }
    }

    func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        willEndFor configuration: UIContextMenuConfiguration,
        animator: UIContextMenuInteractionAnimating?
    ) {
        onPreviewClose()
    }

    func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        willPerformPreviewActionForMenuWith configuration: UIContextMenuConfiguration,
        animator: UIContextMenuInteractionCommitAnimating
    ) {
        print("Preview tapped!")
        math.pushPreloadedView(self)
        animator.addCompletion {
            self.onPreviewTapped()
        }
    }

    // MARK: - Context Menu Helpers

    private func createPreviewViewController() -> UIViewController {
        guard let preview = preview else {
            return UIViewController()
        }

        let vc = PreviewViewController(peekAndPopPreview: preview)
        vc.view.addSubview(preview)
        return vc
    }

    private func createContextMenu() -> UIMenu {
        let action1 = UIAction(
            title: "Action 1",
            handler: { _ in
                print("Action 1 selected")
            })

        return UIMenu(title: "", children: [action1])
    }
}

class PreviewViewController: UIViewController {
    private let peekAndPopPreview: PeekAndPopPreviewView
    init(peekAndPopPreview: PeekAndPopPreviewView) {
        self.peekAndPopPreview = peekAndPopPreview
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidAppear(_ animated: Bool) {
        peekAndPopPreview.setInitialSize(bounds:self.view.bounds)
    }
}

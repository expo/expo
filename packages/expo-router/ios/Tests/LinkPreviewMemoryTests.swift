import Testing
import UIKit

@testable import ExpoRouter

// Records the completion blocks handed to it, mimicking how the system animator
// retains them for the duration of the context-menu dismiss animation.
private final class MockContextMenuAnimator: NSObject, UIContextMenuInteractionAnimating {
  var preferredCommitStyle: UIContextMenuInteractionCommitStyle = .dismiss
  var previewViewController: UIViewController?
  var completions: [() -> Void] = []

  func addAnimations(_ animations: @escaping () -> Void) {}
  func addCompletion(_ completion: @escaping () -> Void) {
    completions.append(completion)
  }
}

@Suite("LinkPreview memory management")
@MainActor
struct LinkPreviewMemoryTests {

  // The dismiss completion must not strongly capture the view: the system animator
  // outlives the interaction, so a strong capture pins the view to the animation.
  @Test
  func `preview view is released even while a dismiss completion is pending`() {
    let animator = MockContextMenuAnimator()
    weak var weakView: NativeLinkPreviewView?

    autoreleasepool {
      let view = NativeLinkPreviewView(appContext: nil)
      let interaction = UIContextMenuInteraction(delegate: view)
      let configuration = UIContextMenuConfiguration(
        identifier: nil, previewProvider: nil, actionProvider: nil)
      view.contextMenuInteraction(
        interaction, willEndFor: configuration, animator: animator)

      weakView = view
      #expect(weakView != nil)
      #expect(!animator.completions.isEmpty)
    }

    #expect(weakView == nil)
  }
}

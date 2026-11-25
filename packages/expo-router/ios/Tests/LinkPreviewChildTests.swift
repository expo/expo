import Testing
import UIKit

@testable import ExpoRouter

@Suite("LinkPreview trigger child")
@MainActor
struct LinkPreviewChildTests {
  @Test
  func `remounted child becomes the trigger`() {
    let view = NativeLinkPreviewView(appContext: nil)
    let a = UIView()
    let b = UIView()

    view.mountChildComponentView(a, index: 0)
    view.unmountChildComponentView(a, index: 0)
    view.mountChildComponentView(b, index: 0)

    #expect(view.directChild === b)
    #expect(b.interactions.contains { $0 is UIContextMenuInteraction })
  }
}

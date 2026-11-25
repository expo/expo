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

  @Test
  func `highlight is centered on a trigger inside a zoom source`() throws {
    // `UIPreviewTarget` requires a container in a window.
    let host = UIWindow(frame: CGRect(x: 0, y: 0, width: 400, height: 800))
    let view = NativeLinkPreviewView(appContext: nil)
    host.addSubview(view)
    view.center = CGPoint(x: 16, y: 100)
    view.bounds = .zero
    let zoomSource = LinkZoomTransitionSource(appContext: nil)
    zoomSource.center = CGPoint(x: 10, y: 20)
    zoomSource.bounds = .zero
    let trigger = UIView()
    trigger.center = CGPoint(x: 100, y: 20)
    trigger.bounds = CGRect(x: 0, y: 0, width: 200, height: 40)
    zoomSource.mountChildComponentView(trigger, index: 0)
    view.mountChildComponentView(zoomSource, index: 0)

    let preview = try #require(
      view.contextMenuInteraction(
        UIContextMenuInteraction(delegate: view),
        configuration: UIContextMenuConfiguration(),
        highlightPreviewForItemWithIdentifier: "" as NSString
      ))

    #expect(preview.target.container === host)
    #expect(preview.target.center == CGPoint(x: 126, y: 140))
  }
}

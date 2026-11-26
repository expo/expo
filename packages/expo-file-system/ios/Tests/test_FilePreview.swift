// Copyright 2026-present 650 Industries. All rights reserved.

#if os(iOS)
import QuickLook
import Testing

@testable import ExpoFileSystem

@MainActor
@Suite("File preview source view")
struct FilePreviewSourceViewTests {
  @Test
  func testOnlyTheInitialItemUsesTheAttachedSourceView() {
    let window = UIWindow()
    let view = UIView()
    window.addSubview(view)
    let items = ["first.png", "second.pdf"].map {
      FileSystemPreviewItem(url: URL(fileURLWithPath: "/tmp/\($0)"), title: nil)
    }
    let session = FileSystemPreviewSession(
      items: items, scopedAccesses: [], sourceView: view, sourceItemIndex: 1, onFinish: {}
    )
    let controller = QLPreviewController()

    #expect(session.previewController(controller, transitionViewFor: items[1]) === view)
    #expect(session.previewController(controller, transitionViewFor: items[0]) == nil)
    view.removeFromSuperview()
    #expect(session.previewController(controller, transitionViewFor: items[1]) == nil)
  }

  @Test
  func testSessionDoesNotRetainTheSourceView() {
    let item = FileSystemPreviewItem(url: URL(fileURLWithPath: "/tmp/image.png"), title: nil)
    var view: UIView? = UIView()
    weak var weakView = view
    let session = FileSystemPreviewSession(
      items: [item], scopedAccesses: [], sourceView: view, sourceItemIndex: 0, onFinish: {}
    )
    view = nil

    #expect(weakView == nil)
    #expect(session.previewController(QLPreviewController(), transitionViewFor: item) == nil)
  }
}
#endif

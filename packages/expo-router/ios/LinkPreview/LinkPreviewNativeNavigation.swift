import UIKit

internal class LinkPreviewNativeNavigation {
  private var preloadedView: UIView?
  private var preloadedStackView: UIView?

  init() {}

  func pushPreloadedView() {
    guard let preloadedView,
      let preloadedStackView
    else {
      return
    }
    LinkPreviewNativeNavigationObjC.pushPreloadedView(
      preloadedView, ontoStackView: preloadedStackView)
  }

  func updatePreloadedView(screenId: String, responder: UIView) {
    if screenId.isEmpty {
      print("LinkPreviewNativeNavigation: No screenId provided, skipping preloading.")
      return
    }

    let stackView = findStackViewWithScreenId(screenId: screenId, responder: responder)
    if let stackView = stackView {
      let screenViews = LinkPreviewNativeNavigationObjC.getScreenViews(stackView)
      if let screenView = screenViews.first(where: {
        LinkPreviewNativeNavigationObjC.getScreenId($0) == screenId
      }) {
        preloadedView = screenView
        preloadedStackView = stackView
        print("LinkPreviewNativeNavigation: Preloaded view for screenId \(screenId).")
      }
    } else {
      print("LinkPreviewNativeNavigation: No stack view found for screenId \(screenId).")
    }
  }

  private func findStackViewWithScreenId(screenId: String, responder: UIView) -> UIView? {
    var currentResponder: UIResponder? = responder

    while let nextResponder = currentResponder?.next {
      if let view = nextResponder as? UIView,
        LinkPreviewNativeNavigationObjC.isRNSScreenStackView(view) {
        let screenIds = LinkPreviewNativeNavigationObjC.getStackViewScreenIds(view)
        if screenIds.contains(screenId) {
          return view
        }
      }
      currentResponder = nextResponder
    }
    return nil
  }
}

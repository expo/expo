import ExpoModulesCore
import UIKit

class LinkPreviewNativeZoomTransitionEnabler: ExpoView {
  var zoomViewNativeTag: Int = 0

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  // didMoveToSuperview
  override func didMoveToSuperview() {
    // Need to run this async. Otherwise the view is not yet mounted (is it safe?)
    DispatchQueue.main.async {
      print("After didMoveToSuperview of LinkPreviewNativeZoomTransitionEnabler")
      if self.zoomViewNativeTag > 0, let controller = self.findViewController() {
        // From iOS 18
        if #available(iOS 18.0, *) {
          // print controller
          print("didMoveToSuperview controller", controller)
          // get screenId from controller
          let screenId = LinkPreviewNativeNavigationObjC.getScreenId(controller.view)
          print("⚠️ Found screenId: \(String(describing: screenId))")

          // TODO: Find a better way to get the view from native tag
          let view: UIView? = UIApplication.shared.keyWindow?.rootViewController?.view.viewWithTag(
            self.zoomViewNativeTag)
          controller.preferredTransition = .zoom(options: nil) { context in
            print("View from native tag \(self.zoomViewNativeTag): \(String(describing: view))")
            return view
          }
          return
        }
      } else {
        print("⚠️ No navigation controller found")
      }
    }
  }

  /// Walk up the responder chain to find the owning UIViewController
  private func findViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let r = responder {
      //      print("\(r)")
      if LinkPreviewNativeNavigationObjC.isRNScreen(r) {
        return r as? UIViewController
      }
      responder = r.next
    }
    return nil
  }
}

import ExpoModulesCore
import UIKit

class LinkPreviewNativeZoomTransitionEnabler: ExpoView {
  var zoomViewNativeTag: Int = 0

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  override func didMoveToWindow() {
    if let controller = self.findViewController() {
      // From iOS 18
      if #available(iOS 18.0, *) {
        // print controller
        print("controller", controller)
        let leftButton = UIBarButtonItem(
          image: UIImage(systemName: "arrow.left"), style: .plain, target: self,
          action: nil)
        let leftButton1 = UIBarButtonItem(
          image: UIImage(systemName: "arrow.left"), style: .plain, target: self,
          action: nil)
        let rightButton = UIBarButtonItem(title: "Right", style: .plain, target: self, action: nil)
        let space = UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil)
        controller.toolbarItems = [leftButton, leftButton1, space, rightButton]

        // This will set navigation bar items. Not sure if we want to override the screens implementation
        // But this shows that we can do it fairly easily
        // If we would like to do that though, we should override react navigation's header options
        let topLeftButton = UIBarButtonItem(
          image: UIImage(systemName: "arrow.right"), style: .plain, target: self,
          action: nil)
        let topLeftButton1 = UIBarButtonItem(
          image: UIImage(systemName: "arrow.right"), style: .plain, target: self,
          action: nil)
        controller.navigationItem.leftBarButtonItems = [topLeftButton, topLeftButton1]
          controller.navigationItem.title="Tessst"
        return
      }
    } else {
      print("⚠️ No navigation controller found")
    }
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
          print(controller)
          // get screenId from controller
          let screenId = LinkPreviewNativeNavigationObjC.getScreenId(controller.view)
          print("⚠️ Found screenId: \(String(describing: screenId))")
          controller.preferredTransition = .zoom(options: nil) { context in
            let view: UIView? = controller.navigationController?.view.viewWithTag(
              self.zoomViewNativeTag)
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
      print("\(r)")
      if LinkPreviewNativeNavigationObjC.isRNScreen(r) {
        return r as? UIViewController
      }
      responder = r.next
    }
    return nil
  }
}

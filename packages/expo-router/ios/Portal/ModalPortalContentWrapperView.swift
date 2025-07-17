import ExpoModulesCore
import React

class ModalPortalContentWrapperView: ExpoView {
  var host: ModalPortalHostView?
  var contentView: ModalPortalContentView?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    if contentView != nil {
      print(
        "Warning: Multiple ModalPortalContentView components found. Only the first one will be used."
      )
      return
    }
    if let content = childComponentView as? ModalPortalContentView {
      self.contentView = content
      print("Mounting content view")
      self.host?.unmountContentView()
      self.host?.setContentView(contentView: content)
    } else {
      print("Mounting: Child component view must be of type ModalPortalContentView")
    }
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let content = childComponentView as? ModalPortalContentView {
      print("Unmounting content view")
      self.host?.unmountContentView()
      contentView = nil
    } else {
      print("Unmounting: Child component view must be of type ModalPortalContentView")
    }
  }

  func setHost(hostId: String) {
    let hostView = PortalHostsRegistry.shared.getHost(hostId: hostId)
    if hostView != nil {
      self.host = hostView
      if let contentView = self.contentView {
        self.host?.setContentView(contentView: contentView)
      }
    } else {
      print("Host view not found")
    }
  }
}

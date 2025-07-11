import ExpoModulesCore

class ModalPortalHostView: ExpoView {
  var hostId: String = ""
  private var contentView: ModalPortalContentView?

  let onRegistered = EventDispatcher()
  let onUnregistered = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }

  func setHostId(hostId: String) {
    if hostId == self.hostId {
      return
    }
    PortalHostsRegistry.shared.unregister(hostId: self.hostId)
    self.onUnregistered([
      "hostId": self.hostId
    ])
    self.hostId = hostId
    PortalHostsRegistry.shared.register(host: self)
    self.onRegistered([
      "hostId": self.hostId
    ])
  }

  override func removeFromSuperview() {
    PortalHostsRegistry.shared.unregister(hostId: self.hostId)
    self.onUnregistered([
      "hostId": self.hostId
    ])
    super.removeFromSuperview()
  }

  func setContentView(contentView: ModalPortalContentView) {
    if self.contentView != nil {
      self.unmountContentView()
    }
    self.contentView = contentView
    self.contentView?.setHostComponent(self)
    self.addSubview(contentView)
  }

  func unmountContentView() {
    self.contentView?.removeFromSuperview()
    self.contentView = nil
  }
}

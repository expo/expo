import ExpoModulesCore

class ModalPortalHostView: ExpoView {
  var hostId: String = ""
  var disableFullHeight: Bool = false
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

  func setSize(width: Float, height: Float) {
    let computedWidth = Float(self.bounds.width)
    let computedHeight = disableFullHeight ? height : Float(self.bounds.height)
    self.setShadowNodeSize(computedWidth, height: computedHeight)
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
    updateContentViewSize()
    self.addSubview(contentView)
  }

  func unmountContentView() {
    self.contentView?.removeFromSuperview()
    self.contentView = nil
  }

  func updateContentViewSize() {
    let width = Float(self.bounds.width)
    let height = disableFullHeight ? nil : Float(self.bounds.height)
    self.contentView?.setSize(
      width: width, height: height)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    updateContentViewSize()
  }
}

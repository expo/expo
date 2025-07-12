import ExpoModulesCore

class WeakModalPortalHostView {
  weak var value: ModalPortalHostView?

  init(_ value: ModalPortalHostView) {
    self.value = value
  }
}

class PortalHostsRegistry {
  static let shared = PortalHostsRegistry()

  private var map = [String: WeakModalPortalHostView]()

  func register(host: ModalPortalHostView) {
    map[host.hostId] = WeakModalPortalHostView(host)
  }

  func unregister(hostId: String) {
    map.removeValue(forKey: hostId)
  }

  func getHost(hostId: String) -> ModalPortalHostView? {
    return map[hostId]?.value
  }
}

class ModalPortalHostView: ExpoView {
  var hostId: String = ""
  var fluid: Bool = false
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
    if !fluid {
      self.setShadowNodeSize(width, height: height)
    }
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
    if fluid {
      self.contentView?.setSize(
        width: Float(self.bounds.width), height: Float(self.bounds.height))
    }
    self.addSubview(contentView)
  }

  func unmountContentView() {
    self.contentView?.removeFromSuperview()
    self.contentView = nil
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    if fluid {
      self.contentView?.setSize(
        width: Float(self.bounds.width), height: Float(self.bounds.height))
    }
  }
}

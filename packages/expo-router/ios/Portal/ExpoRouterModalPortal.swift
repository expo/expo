import ExpoModulesCore

public class ExpoRouterModalPortal: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRouterModalPortal")

    OnDestroy {
      PortalHostsRegistry.shared.reset()
    }

    View(ModalPortalContentView.self) {}

    View(ModalPortalContentWrapperView.self) {
      Prop("hostId") { (view: ModalPortalContentWrapperView, host: String) in
        view.setHost(hostId: host)
      }
    }

    View(ModalPortalHostView.self) {
      Events("onRegistered", "onUnregistered")
      Prop("hostId") { (view: ModalPortalHostView, hostId: String) in
        view.setHostId(hostId: hostId)
      }
    }
  }
}

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

  func reset() {
    map.removeAll()
  }
}

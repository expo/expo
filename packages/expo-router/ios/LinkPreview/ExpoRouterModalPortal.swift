import ExpoModulesCore

public class ExpoRouterModalPortal: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRouterModalPortal")

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
      Prop("fluid") { (view: ModalPortalHostView, isFluid: Bool) in
        view.fluid = isFluid
      }
    }
  }
}

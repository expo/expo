import ExpoModulesCore

class ModalPortalContentView: ExpoView {
  private weak var hostComponent: ModalPortalHostView?
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }

  func setHostComponent(_ hostComponent: ModalPortalHostView) {
    self.hostComponent = hostComponent
  }

  override func removeFromSuperview() {
    super.removeFromSuperview()
    hostComponent = nil
  }
}

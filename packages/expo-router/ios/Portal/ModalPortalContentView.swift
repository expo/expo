import ExpoModulesCore

class ModalPortalContentView: ExpoView {
  private weak var hostComponent: ModalPortalHostView?
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }

  func setHostComponent(_ hostComponent: ModalPortalHostView) {
    self.hostComponent = hostComponent
    hostComponent.setSize(width: Float(bounds.width), height: Float(bounds.height))
  }

  override func removeFromSuperview() {
    super.removeFromSuperview()
    hostComponent = nil
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    hostComponent?.setSize(width: Float(bounds.width), height: Float(bounds.height))
  }

  func setSize(width: Float?, height: Float?) {
    let _width = width ?? Float.nan
    let _height = height ?? Float.nan
    self.setShadowNodeSize(_width, height: _height)
  }
}

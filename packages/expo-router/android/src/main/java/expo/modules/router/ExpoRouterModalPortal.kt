package expo.modules.router

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoRouterModalPortal : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoRouterModalPortal")

    View(ModalPortalContentView::class) {}

    View(ModalPortalContentWrapperView::class) {
      Prop("hostId") { view: ModalPortalContentWrapperView, hostId: String ->
        view.setHostId(hostId)
      }
    }

    View(ModalPortalHostView::class) {
      Events("onRegistered", "onUnregistered")

      Prop("hostId") { view: ModalPortalHostView, hostId: String ->
        view.setHostId(hostId)
      }

      Prop("fluid") { view: ModalPortalHostView, isFluid: Boolean ->
        view.setIsFluid(isFluid)
      }
    }
  }
}

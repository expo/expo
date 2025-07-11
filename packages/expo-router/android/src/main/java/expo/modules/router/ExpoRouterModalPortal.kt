package expo.modules.router

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.lang.ref.WeakReference

object PortalHostsRegistry {
  private val map = mutableMapOf<String, WeakReference<ModalPortalHostView>>()

  fun register(host: ModalPortalHostView) {
    map[host.hostId] = WeakReference(host)
  }

  fun unregister(hostId: String) {
    map.remove(hostId)
  }

  fun getHost(hostId: String): ModalPortalHostView? {
    return map[hostId]?.get()
  }

  fun reset() {
    map.clear()
  }
}

class ExpoRouterModalPortal : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoRouterModalPortal")

    OnDestroy {
      PortalHostsRegistry.reset()
    }

    View(ModalPortalContentView::class) {}

    View(ModalPortalContentWrapperView::class) {
      Prop("hostId") { view: ModalPortalContentWrapperView, hostId: String ->
        view.setHostId(hostId)
      }
    }

    View(ModalPortalHostView::class) {
      Events("onRegistered", "onUnregistered")

      Prop("hostId") { view: ModalPortalHostView, hostId: String ->
        view.hostId = hostId
      }
    }
  }
}

package expo.modules.router

import android.util.Log
import android.view.View
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
      GroupView<ModalPortalContentWrapperView> {
        AddChildView { parent, child: View, _ ->
          if (child is ModalPortalContentView) {
            parent.setContentView(child)
          } else {
            Log.w(
              "ExpoRouter",
              "Mounting: Child component view must be of type ModalPortalContentView"
            )
          }
        }
        RemoveChildView { parent, child: View ->
          if (child is ModalPortalContentView) {
            parent.unsetContentView()
          } else {
            Log.w(
              "ExpoRouter",
              "Unmounting: Child component view must be of type ModalPortalContentView"
            )
          }
        }
      }
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

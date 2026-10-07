package expo.modules.hinge

import android.content.Context
import android.hardware.SensorManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch

private const val HINGE_CHANGE_EVENT = "hingeChange"

class ExpoHingeModule : Module() {
  private val observer by lazy {
    HingeObserver(appContext.reactContext?.getSystemService(Context.SENSOR_SERVICE) as? SensorManager)
  }

  @Volatile
  private var hasListeners = false

  override fun definition() = ModuleDefinition {
    Name("ExpoHinge")

    Constant("isAvailable") {
      HingeObserver.isAvailable
    }

    Events(HINGE_CHANGE_EVENT)

    Function("getHinge") {
      observer.hinge?.toMap()
    }

    OnCreate {
      observer.onChange = { hinge ->
        if (hasListeners) {
          sendEvent(HINGE_CHANGE_EVENT, mapOf("hinge" to hinge?.toMap()))
        }
      }
      attach()
    }

    // The activity may not exist yet when the module is created, and Android stops delivering sensor
    // events while the app is in the background.
    OnActivityEntersForeground {
      attach()
    }

    OnActivityEntersBackground {
      appContext.mainQueue.launch {
        observer.pause()
      }
    }

    OnDestroy {
      observer.detach()
    }

    OnStartObserving(HINGE_CHANGE_EVENT) {
      hasListeners = true
    }

    OnStopObserving(HINGE_CHANGE_EVENT) {
      hasListeners = false
    }
  }

  private fun attach() {
    val activity = appContext.currentActivity ?: return
    appContext.mainQueue.launch {
      observer.attach(activity, appContext.mainQueue)
    }
  }
}

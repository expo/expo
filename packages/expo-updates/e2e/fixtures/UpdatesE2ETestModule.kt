package expo.modules.updates

import android.os.Bundle
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Enumerable
import expo.modules.updatesinterface.UpdatesControllerRegistry
import expo.modules.updatesinterface.UpdatesInterface
import expo.modules.updatesinterface.UpdatesStateChangeListener

class UpdatesE2ETestModule : Module(), UpdatesStateChangeListener {
  private var hasListener: Boolean = false
  private var updatesController: UpdatesInterface? = null
  private var subscriptionId: String? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoUpdatesE2ETest")

    Events<UpdatesE2EEvent>()

    OnCreate {
      UpdatesControllerRegistry.controller?.get()?.let {
        if (it is UpdatesInterface) {
          subscriptionId = it.subscribeToUpdatesStateChanges(this@UpdatesE2ETestModule)
          updatesController = it
        }
      }
    }

    OnStartObserving(UpdatesE2EEvent.StateChange) {
      hasListener = true
    }

    OnStopObserving(UpdatesE2EEvent.StateChange) {
      hasListener = false
    }

    OnDestroy {
      UpdatesControllerRegistry.controller?.get()?.let {
        if (it is UpdatesInterface) {
          it.unsubscribeFromUpdatesStateChanges(subscriptionId ?: "")
          updatesController = null
        }
      }
    }

    Function("getLaunchedUpdateId") {
      return@Function updatesController?.launchedUpdateId?.toString()
    }

    Function("getEmbeddedUpdateId") {
      return@Function updatesController?.embeddedUpdateId?.toString()
    }

    Function("getRuntimeVersion") {
      return@Function updatesController?.runtimeVersion
    }

    AsyncFunction("clearInternalAssetsFolderAsync") { promise: Promise ->
      try {
        val assetsFolder = UpdatesController.instance.updatesDirectory
        assetsFolder!!.deleteRecursively()
        promise.resolve(null)
      } catch (e: Throwable) {
        promise.reject("ERR_E2E_TEST", null, e)
      }
    }

    AsyncFunction("readInternalAssetsFolderAsync") { promise: Promise ->
      try {
        val assetsFolder = UpdatesController.instance.updatesDirectory
        if (!assetsFolder!!.exists()) {
          promise.resolve(0)
        } else {
          val count = assetsFolder.walk()
            .count() - 1 // subtract one for the folder itself, which is included in walk()
          promise.resolve(count)
        }
      } catch (e: Throwable) {
        promise.reject("ERR_E2E_TEST", null, e)
      }
    }
  }

  override fun updatesStateDidChange(event: Map<String, Any>) {
    if (hasListener) {
      val payload = Bundle()
      payload.putString("type", event["type"] as String)
      val manifest = event["manifest"] as? Map<String, Any>
      if (manifest != null) {
        val manifestBundle = Bundle()
        manifestBundle.putString("id", manifest["id"] as String)
        payload.putBundle("manifest", manifestBundle)
      }
      sendEvent(UpdatesE2EEvent.StateChange, payload)
    }
  }
}

enum class UpdatesE2EEvent(val eventName: String) : Enumerable {
  StateChange("Expo.updatesE2EStateChangeEvent")
}

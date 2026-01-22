package expo.modules.updates

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class UpdatesE2ETestModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoUpdatesE2ETest")

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
}
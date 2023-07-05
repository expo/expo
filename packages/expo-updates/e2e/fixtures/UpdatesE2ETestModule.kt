package expo.modules.updates

import android.content.Context
import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import java.util.*

class UpdatesE2ETestModule(context: Context) : ExportedModule(context) {
  override fun getName() = "ExpoUpdatesE2ETest"

  @ExpoMethod
  fun clearInternalAssetsFolderAsync(promise: Promise) {
    try {
      val assetsFolder = UpdatesController.instance.updatesDirectory
      assetsFolder!!.deleteRecursively()
      promise.resolve(null)
    } catch (e: Throwable) {
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun readInternalAssetsFolderAsync(promise: Promise) {
    try {
      val assetsFolder = UpdatesController.instance.updatesDirectory
      if (!assetsFolder!!.exists()) {
        return promise.resolve(0)
      }
      val count = assetsFolder.walk().count() - 1 // subtract one for the folder itself, which is included in walk()
      promise.resolve(count)
    } catch (e: Throwable) {
      promise.reject(e)
    }
  }
}

package expo.modules.notifications.serverregistration

import android.content.Context
import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod

open class ServerRegistrationModule(context: Context) : ExportedModule(context) {
  protected val installationId = InstallationId(context)
  private val mRegistrationInfo = RegistrationInfo(context)

  override fun getName(): String = "NotificationsServerRegistrationModule"

  @ExpoMethod
  open fun getInstallationIdAsync(promise: Promise) {
    promise.resolve(installationId.orCreateUUID)
  }

  @ExpoMethod
  fun getRegistrationInfoAsync(promise: Promise) {
    promise.resolve(mRegistrationInfo.get())
  }

  @ExpoMethod
  fun setRegistrationInfoAsync(registrationInfo: String?, promise: Promise) {
    mRegistrationInfo.set(registrationInfo)
    promise.resolve(null)
  }
}

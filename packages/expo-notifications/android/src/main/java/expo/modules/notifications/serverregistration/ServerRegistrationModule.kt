package expo.modules.notifications.serverregistration

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

open class ServerRegistrationModule : Module() {
  val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  protected val installationId by lazy { InstallationId(context) }
  private val mRegistrationInfo by lazy { RegistrationInfo(context) }

  override fun definition() = ModuleDefinition {
    Name("NotificationsServerRegistrationModule")

    AsyncFunction("getInstallationIdAsync", this@ServerRegistrationModule::getInstallationId)

    AsyncFunction("getRegistrationInfoAsync") {
      mRegistrationInfo.get()
    }

    AsyncFunction("setRegistrationInfoAsync") { registrationInfo: String? ->
      mRegistrationInfo.set(registrationInfo)
    }
  }

  open fun getInstallationId(): String {
    return installationId.orCreateUUID
  }
}

package expo.modules.notifications.serverregistration

import android.content.Context
import java.io.File

open class RegistrationInfo(private val context: Context) {
  companion object {
    const val REGISTRATION_INFO_FILE_NAME = "expo_notifications_registration_info.txt"
  }

  protected val nonBackedUpRegistrationInfoFile: File
    get() = File(context.noBackupFilesDir, REGISTRATION_INFO_FILE_NAME)

  fun get(): String? = if (nonBackedUpRegistrationInfoFile.exists()) {
    nonBackedUpRegistrationInfoFile.readText()
  } else null

  fun set(registrationInfo: String?) {
    nonBackedUpRegistrationInfoFile.delete()
    registrationInfo?.let {
      nonBackedUpRegistrationInfoFile.writeText(it)
    }
  }
}

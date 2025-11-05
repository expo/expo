package expo.modules.updatesinterface

import android.net.Uri
import java.util.UUID

/**
 * Interface for modules that depend on expo-updates for reading metrics information
 * about the currently running update, but do not want
 * to depend on expo-updates or delegate control to the singleton UpdatesController.
 */
interface UpdatesMetricsInterface {
  val runtimeVersion: String?
  val updateUrl: Uri?
  val launchedUpdateId: UUID?
  val embeddedUpdateId: UUID?
}
package expo.modules.storageinspector

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

/**
 * Inline module that reports which Observe data is stored on the device, for the consent tests.
 * It only reads, so it never creates the installation ID or the database.
 */
class StorageInspector : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Function("inspect") {
      fun fileCount(path: String) = File(context.noBackupFilesDir, path).listFiles()?.size ?: 0
      fun settingsFile(name: String) = File(context.applicationInfo.dataDir, "shared_prefs/$name.xml")
      // Reads the settings only when the file exists, so the read creates nothing.
      fun settingsKeys(name: String) =
        if (settingsFile(name).exists()) {
          context.getSharedPreferences(name, Context.MODE_PRIVATE).all.keys.sorted().joinToString(",").ifEmpty { "none" }
        } else {
          "none"
        }
      mapOf(
        "databaseExists" to context.getDatabasePath("app_metrics").exists(),
        "legacyStoreExists" to context.getDatabasePath("eas_observe").exists(),
        "crashFileCount" to fileCount("expo-app-metrics/crashes"),
        "pendingErrorFileCount" to fileCount("ExpoAppMetrics/pending-errors"),
        "installationIdStored" to context
          .getSharedPreferences("dev.expo.EASSharedPreferences", Context.MODE_PRIVATE)
          .contains("eas-client-id"),
        "appMetricsSettingsKeys" to settingsKeys("dev.expo.app-metrics"),
        "appMetricsSettingsFileExists" to settingsFile("dev.expo.app-metrics").exists(),
        "observeSettingsKeys" to settingsKeys("dev.expo.observe"),
        "observeSettingsFileExists" to settingsFile("dev.expo.observe").exists()
      )
    }
  }
}

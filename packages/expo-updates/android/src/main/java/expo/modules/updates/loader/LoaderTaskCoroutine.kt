package expo.modules.updates.loader

import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.selectionpolicy.SelectionPolicy
import java.io.File

data class LoaderTaskCoroutineResult(val launcher: Launcher, val isUpToDate: Boolean)

class LoaderTaskCoroutine(
  private val configuration: UpdatesConfiguration,
  private val databaseHolder: DatabaseHolder,
  private val directory: File,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy,
) {
  suspend fun load(): LoaderTaskCoroutineResult {

  }

  suspend fun launchFallbackUpdateFromDisk() {

  }
}
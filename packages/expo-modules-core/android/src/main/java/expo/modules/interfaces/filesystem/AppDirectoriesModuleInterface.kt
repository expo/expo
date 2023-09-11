package expo.modules.interfaces.filesystem

import java.io.File

interface AppDirectoriesModuleInterface {
  val cacheDirectory: File
  val persistentFilesDirectory: File
}

package expo.modules.filesystem.fsops

import expo.modules.filesystem.unifiedfile.UnifiedFileInterface
import expo.modules.filesystem.DestinationAlreadyExistsException
import expo.modules.filesystem.DestinationDoesNotExistException
import expo.modules.filesystem.CopyOrMoveDirectoryToFileException

/**
 * Encapsulates destination parameters for copy/move operations.
 * Represents what the user specified as the copy/move target.
 */
data class DestinationSpec(
  val path: UnifiedFileInterface,
  val overwrite: Boolean = false,
  val isDirectory: Boolean = false
) {
  /**
   * Resolves and validates the destination for a copy/move operation.
   * Delegates to the destination path's own [CopyMoveStrategy.prepareAsDestination].
   *
   * @param source The source file/directory
   * @return Validated and prepared destination
   * @throws DestinationAlreadyExistsException if destination exists and overwrite is false
   * @throws DestinationDoesNotExistException if parent doesn't exist
   * @throws CopyOrMoveDirectoryToFileException if copying directory to file
   */
  internal fun resolve(source: UnifiedFileInterface): DestinationSink {
    return this.path.copyMoveStrategy.prepareAsDestination(source, this)
  }
}

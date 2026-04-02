package expo.modules.filesystem.fsops

import android.os.Build
import androidx.annotation.RequiresApi
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption

/**
 * NIO-based file operations for local files on API 26+.
 * Uses kernel-level zero-copy (sendfile syscall) where possible,
 * avoiding user-space buffering.
 *
 * These functions are only for local file-to-local file operations (JavaFile).
 * SAF/ContentProvider backends use FileChannel via copyFileWithChannelFallback
 * (see Utilities.kt) with stream-based fallback.
 */

@RequiresApi(Build.VERSION_CODES.O)
internal fun copyFileNio(source: Path, dest: Path) {
  Files.copy(source, dest, StandardCopyOption.REPLACE_EXISTING)
}

@RequiresApi(Build.VERSION_CODES.O)
internal fun moveFileNio(source: Path, dest: Path) {
  Files.move(source, dest, StandardCopyOption.REPLACE_EXISTING)
}

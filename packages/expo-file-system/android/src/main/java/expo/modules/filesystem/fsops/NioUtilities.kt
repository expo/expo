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
 * SAF/ContentProvider/Asset backends must continue using stream-based copy
 * since they only guarantee InputStream/OutputStream via ContentResolver.
 *
 * TODO: SAF files could potentially use ContentResolver.openFileDescriptor()
 * → FileChannel.transferTo() for zero-copy, with fallback to streams when
 * the provider doesn't support file descriptors. FileSystemFileHandle already
 * demonstrates this pattern (forContentURI opens FileChannel via openFileDescriptor).
 */

@RequiresApi(Build.VERSION_CODES.O)
internal fun copyFileNio(source: Path, dest: Path) {
  Files.copy(source, dest, StandardCopyOption.REPLACE_EXISTING)
}

@RequiresApi(Build.VERSION_CODES.O)
internal fun moveFileNio(source: Path, dest: Path) {
  Files.move(source, dest, StandardCopyOption.REPLACE_EXISTING)
}

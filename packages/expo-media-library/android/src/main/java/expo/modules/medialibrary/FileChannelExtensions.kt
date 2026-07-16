package expo.modules.medialibrary

import java.nio.channels.FileChannel
import java.nio.channels.WritableByteChannel

// A single transferTo copies at most ~2.147 GB (the sendfile(2) 0x7ffff000 cap), so loop until the
// whole file is copied or the transfer stalls; otherwise larger files silently truncate (expo/expo#47767).
fun FileChannel.transferAllTo(destination: WritableByteChannel): Long {
  val size = size()
  var position = 0L
  while (position < size) {
    val transferred = transferTo(position, size - position, destination)
    if (transferred <= 0L) {
      break
    }
    position += transferred
  }
  return position
}

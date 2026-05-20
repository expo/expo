package expo.modules.filesystem.fsops

import android.os.Build
import android.net.Uri
import expo.modules.filesystem.unifiedfile.JavaFile
import java.io.File
import java.nio.file.Files
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference
import kotlin.concurrent.thread
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.R])
class CopyDirectoryParallelTest {
  private lateinit var sourceDir: File
  private lateinit var destinationDir: File

  @After
  fun tearDown() {
    if (::sourceDir.isInitialized) {
      sourceDir.deleteRecursively()
    }
    if (::destinationDir.isInitialized) {
      destinationDir.deleteRecursively()
    }
  }

  @Test
  fun `copyDirectoryParallel backpressures traversal after the concurrency limit is reached`() {
    sourceDir = Files.createTempDirectory("expo-file-system-copy-source").toFile().apply {
      repeat(8) { index ->
        File(this, "file-$index.txt").writeText("file-$index")
      }
    }
    destinationDir = Files.createTempDirectory("expo-file-system-copy-dest").toFile()

    val firstCopyStarted = CountDownLatch(1)
    val releaseFirstCopy = CountDownLatch(1)
    val failure = AtomicReference<Throwable?>(null)

    val worker = thread(name = "copyDirectoryParallel-test") {
      try {
        runBlocking {
          copyDirectoryParallel(
            source = JavaFile(Uri.fromFile(sourceDir)),
            dest = JavaFile(Uri.fromFile(destinationDir)),
            parallelism = 1,
            copyFile = { _, _ ->
              firstCopyStarted.countDown()
              if (!releaseFirstCopy.await(5, TimeUnit.SECONDS)) {
                throw AssertionError("Timed out waiting to release the blocked copy")
              }
            }
          )
        }
      } catch (throwable: Throwable) {
        failure.set(throwable)
      }
    }

    assertTrue(firstCopyStarted.await(5, TimeUnit.SECONDS))
    assertEquals(1, destinationDir.listFiles()?.size ?: 0)

    releaseFirstCopy.countDown()
    worker.join(5_000)
    assertFalse(worker.isAlive)
    failure.get()?.let { throw it }

    assertEquals(8, destinationDir.listFiles()?.size ?: 0)
  }
}

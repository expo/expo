package expo.modules.filesystem

import android.os.Build
import android.net.Uri
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File
import java.lang.ref.WeakReference

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.R])
class ZipOperationsContextTest {
  @Test
  fun `derived filesystem paths keep the source runtime context`() {
    val source = FileSystemDirectory(Uri.fromFile(File("/tmp/source"))).apply {
      runtimeContextHolder = WeakReference(null)
    }

    val derived = FileSystemDirectory(Uri.fromFile(File("/tmp/destination")))
      .withRuntimeContextFrom(source)

    assertSame(source.runtimeContextHolder, derived.runtimeContextHolder)
  }
}

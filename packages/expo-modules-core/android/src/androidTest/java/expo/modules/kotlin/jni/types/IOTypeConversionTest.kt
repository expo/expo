package expo.modules.kotlin.jni.types

import org.junit.Test
import java.io.File
import java.nio.file.Path

class IOTypeConversionTest {
  private val path = "/path/to/file"

  @Test
  fun file_should_be_convertible() =
    conversionTest<File>(stringValue = path)

  @Test
  fun path_should_be_convertible() =
    conversionTest<Path>(stringValue = path)
}

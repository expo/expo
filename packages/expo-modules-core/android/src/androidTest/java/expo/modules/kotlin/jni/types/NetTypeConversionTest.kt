package expo.modules.kotlin.jni.types

import android.net.Uri
import org.junit.Test
import java.net.URI
import java.net.URL

class NetTypeConversionTest {
  private val expoDev = "https://expo.dev/"
  private val exampleApi = "http://api.example.org/data/2.5/forecast/daily?q=94043&mode=json&units=metric&cnt=7"

  @Test
  fun URL_should_be_convertible() =
    conversionTest<URL>(stringValue = expoDev)

  @Test
  fun Uri_should_be_convertible() =
    conversionTest<Uri>(stringValue = exampleApi)

  @Test
  fun Java_URI_should_be_convertible() =
    conversionTest<URI>(stringValue = exampleApi)
}

@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import android.net.Uri
import com.google.common.truth.Truth
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test
import java.net.URI
import java.net.URL

class NetTypeConversionTest {
  @Test
  fun URL_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("url") { a: URL -> a.toString() }
    }
  ) {
    val stringValue = evaluateScript("expo.modules.TestModule.url('https://expo.dev/')").getString()
    Truth.assertThat(stringValue).isEqualTo("https://expo.dev/")
  }

  @Test
  fun Uri_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("uri") { a: Uri -> a.toString() }
    }
  ) {
    val stringValue = evaluateScript("expo.modules.TestModule.uri('http://api.example.org/data/2.5/forecast/daily?q=94043&mode=json&units=metric&cnt=7')").getString()
    Truth.assertThat(stringValue).isEqualTo("http://api.example.org/data/2.5/forecast/daily?q=94043&mode=json&units=metric&cnt=7")
  }

  @Test
  fun Java_URI_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("uri") { a: URI -> a.toString() }
    }
  ) {
    val stringValue = evaluateScript("expo.modules.TestModule.uri('http://api.example.org/data/2.5/forecast/daily?q=94043&mode=json&units=metric&cnt=7')").getString()
    Truth.assertThat(stringValue).isEqualTo("http://api.example.org/data/2.5/forecast/daily?q=94043&mode=json&units=metric&cnt=7")
  }
}

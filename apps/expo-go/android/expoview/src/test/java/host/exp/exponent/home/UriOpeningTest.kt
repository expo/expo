package host.exp.exponent.home

import androidx.compose.ui.platform.UriHandler
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class UriOpeningTest {
  private val unhandledUriHandler = object : UriHandler {
    override fun openUri(uri: String) {
      throw IllegalArgumentException("Can't open $uri.")
    }
  }

  @Test
  fun devClientUrlWithoutHandlerShowsDevelopmentBuildError() {
    var error: String? = null

    openUriOrShowError(
      unhandledUriHandler,
      "exp+my-app://expo-development-client/?url=http%3A%2F%2F192.168.1.104%3A8081",
      showError = { error = it }
    )

    assertEquals(
      "This link is for a development build of \"my-app\", not Expo Go. Press s in the terminal running `npx expo start` to switch to Expo Go, then scan the new QR code.",
      error
    )
  }

  @Test
  fun otherUrlWithoutHandlerShowsGenericError() {
    var error: String? = null

    openUriOrShowError(unhandledUriHandler, "foo://bar", showError = { error = it })

    assertEquals(
      "Expo Go couldn't open foo://bar because no app on this device can handle it. Check the URL and try again.",
      error
    )
  }

  @Test
  fun handledUrlShowsNoError() {
    var opened: String? = null
    var error: String? = null
    val handler = object : UriHandler {
      override fun openUri(uri: String) {
        opened = uri
      }
    }

    openUriOrShowError(handler, "exp://192.168.1.104:8081", showError = { error = it })

    assertEquals("exp://192.168.1.104:8081", opened)
    assertNull(error)
  }
}

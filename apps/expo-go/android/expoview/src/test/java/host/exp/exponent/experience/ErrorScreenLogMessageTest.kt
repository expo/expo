package host.exp.exponent.experience

import host.exp.exponent.kernel.ExponentPackageLogger
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ErrorScreenLogMessageTest {
  @Test
  fun detailOnlyIsSent() {
    assertEquals(
      "The accounts need to match.",
      ErrorScreenLogMessage.make(header = null, userMessage = "The accounts need to match.", developerMessage = null)
    )
  }

  @Test
  fun headerComesFirst() {
    assertEquals(
      "Project is incompatible\n\nUpdate Expo Go.",
      ErrorScreenLogMessage.make(header = "Project is incompatible", userMessage = "Update Expo Go.", developerMessage = null)
    )
  }

  @Test
  fun developerMessageIsUsedWhenUserMessageIsEmpty() {
    assertEquals(
      "java.net.ConnectException: Failed to connect",
      ErrorScreenLogMessage.make(header = null, userMessage = "", developerMessage = "java.net.ConnectException: Failed to connect")
    )
  }

  @Test
  fun htmlIsConvertedToPlainText() {
    assertEquals(
      "Sign in as alan.\nThen reload.",
      ErrorScreenLogMessage.make(header = null, userMessage = "Sign in as <b>alan</b>.<br>Then reload.", developerMessage = null)
    )
  }

  @Test
  fun linksKeepTheirUrl() {
    assertEquals(
      "Update Expo Go. Learn more (https://docs.expo.dev/get-started/expo-go/#sdk-versions).",
      ErrorScreenLogMessage.make(
        header = null,
        userMessage = "Update Expo Go. <a href='https://docs.expo.dev/get-started/expo-go/#sdk-versions'>Learn more</a>.",
        developerMessage = null
      )
    )
  }

  @Test
  fun manifestErrorFixInstructionsAreKept() {
    assertEquals(
      "Project is incompatible\n\nThe project uses SDK 57.\n\nHow to fix this error\nUpdate Expo Go.",
      ErrorScreenLogMessage.make(
        header = "Project is incompatible",
        userMessage = "The project uses SDK 57.<br><br><h5><b>How to fix this error</b></h5>Update Expo Go.",
        developerMessage = null
      )
    )
  }

  @Test
  fun noDetailSendsNothing() {
    assertNull(ErrorScreenLogMessage.make(header = "Header", userMessage = null, developerMessage = null))
    assertNull(ErrorScreenLogMessage.make(header = "Header", userMessage = "", developerMessage = ""))
  }

  @Test
  fun payloadTagsTheLogAsAndroid() {
    val payload = ExponentPackageLogger.payload("Detail", ExponentPackageLogger.LogLevel.ERROR)

    assertEquals("log", payload["type"])
    assertEquals("error", payload["level"])
    assertEquals(listOf("Detail"), payload["data"])
    assertEquals("android", payload["mode"])
  }
}

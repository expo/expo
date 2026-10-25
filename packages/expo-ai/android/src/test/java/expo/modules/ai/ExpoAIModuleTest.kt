package expo.modules.ai

import expo.modules.kotlin.AppContext
import io.mockk.every
import io.mockk.mockk
import io.mockk.spyk
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class ExpoAIModuleTest {
  @Test
  fun `module registration succeeds and direct session construction rejects`() {
    val context = mockk<AppContext>(relaxed = true)
    val module = spyk(ExpoAIModule())
    every { module.appContext } returns context

    // Building the actual definition catches missing SharedObject constructors,
    // which otherwise fail while Expo initializes every module in a consumer app.
    val definition = module.definition()
    val sessionClass = definition.classData.single { it.name == "LanguageModelSession" }
    // Receipt calls must complete on the calling JS thread, with no async gap
    // between accepting native history and delivering the public result.
    assertTrue(sessionClass.objectDefinition.syncFunctions.keys.containsAll(listOf("acceptResult", "discardResult")))
    try {
      sessionClass.constructor.callUserImplementation(emptyArray(), context)
      fail("Sessions must be created through the asynchronous factory")
    } catch (error: LanguageModelException) {
      assertEquals("ERR_INVALID_ARGUMENT", error.code)
    }
  }
}

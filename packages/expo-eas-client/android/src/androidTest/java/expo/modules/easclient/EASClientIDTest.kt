package expo.modules.easclient

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry.getInstrumentation
import org.amshove.kluent.shouldBeEqualTo
import org.amshove.kluent.shouldNotBe
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class EASClientIDTest {
  @Test
  fun testCreatesStableUUID() {
    val context = getInstrumentation().targetContext
    val easClientId = EASClientID(context).uuid
    easClientId shouldNotBe null

    val easClientId2 = EASClientID(context).uuid
    easClientId shouldBeEqualTo easClientId2
  }
}

package expo.modules.audio.service

import androidx.media3.common.Player
import java.lang.reflect.Method
import org.junit.Assert.assertEquals
import org.junit.Test

class MetadataForwardingListenerTest {
  @Test
  fun forwardsEveryPlayerListenerCallback() {
    val forwarding = Class.forName(
      "expo.modules.audio.service.MetadataInjectingPlayer\$MetadataForwardingListener"
    )
    val signature = { m: Method ->
      m.name + m.parameterTypes.joinToString(prefix = "(", postfix = ")") { it.name }
    }
    val expected = Player.Listener::class.java.declaredMethods
      .filter { !it.isSynthetic }
      .map(signature)
      .toSet()
    val actual = forwarding.declaredMethods.map(signature).toSet()
    assertEquals(emptySet<String>(), expected - actual)
  }
}

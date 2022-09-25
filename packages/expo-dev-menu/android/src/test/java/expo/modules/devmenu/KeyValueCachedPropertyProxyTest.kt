package expo.modules.devmenu

import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.util.*

@RunWith(RobolectricTestRunner::class)
internal class KeyValueCachedPropertyProxyTest {

  @Test
  fun `checks if loader function is called only once`() {
    var counter = 0
    val cache = KeyValueCachedPropertyProxy(
      {
        counter++
        return@KeyValueCachedPropertyProxy 999
      },
      WeakHashMap<Int, Int>()
    )

    val result = cache[1]
    val result2 = cache[1]

    Truth.assertThat(result).isEqualTo(999)
    Truth.assertThat(result2).isEqualTo(999)
    Truth.assertThat(counter).isEqualTo(1)
  }

  @Test
  fun `checks if container is populated with data`() {
    val container = WeakHashMap<Int, Int>()
    val cache = KeyValueCachedPropertyProxy(
      { key ->
        return@KeyValueCachedPropertyProxy key
      },
      container
    )

    cache[1]
    cache[2]
    cache[3]

    Truth.assertThat(container.size).isEqualTo(3)
    Truth.assertThat(container.values).containsExactly(1, 2, 3)
  }
}

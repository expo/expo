package expo.modules

import com.google.common.truth.Truth
import org.junit.Assert

inline fun <reified T : Throwable> assertThrows(expectedMessage: String? = null, block: () -> Any?) {
  try {
    block()
  } catch (e: Throwable) {
    Truth.assertThat(e).isInstanceOf(T::class.java)
    expectedMessage?.let {
      Truth.assertThat(e.localizedMessage).isEqualTo(it)
    }
    return
  }

  Assert.fail("Provided block should throw.")
}

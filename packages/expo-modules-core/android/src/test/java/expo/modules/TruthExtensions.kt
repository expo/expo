package expo.modules

import com.google.common.truth.Truth
import org.junit.Assert

inline fun <reified T : Throwable> assertThrows(expectedMessage: String? = null, block: () -> Any?) {
  try {
    block()
  } catch (e: Throwable) {
    Truth.assertThat(e).isInstanceOf(T::class.java)
    expectedMessage?.let {
      Truth.assertThat(e.localizedMessage).contains(it)
    }
    return
  }

  Assert.fail("Provided block should throw.")
}

@Suppress("NOTHING_TO_INLINE")
inline fun Any?.assertNotNull() {
  Truth.assertThat(this).isNotNull()
}

@Suppress("NOTHING_TO_INLINE")
inline fun Any?.assertNull() {
  Truth.assertThat(this).isNull()
}

package expo.modules.kotlin

import io.mockk.confirmVerified
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test

class KPromiseWrapperTest {
  @Test
  fun `should convert Unit to null`() {
    val bridgePromiseMock = mockk<com.facebook.react.bridge.Promise>().apply {
      every { resolve(any()) } returns Unit
    }
    val promise = KPromiseWrapper(bridgePromiseMock)

    promise.resolve(Unit)

    verify { bridgePromiseMock.resolve(null) }
    confirmVerified(bridgePromiseMock)
  }
}

package expo.modules.kotlin

import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import expo.modules.PromiseMock
import expo.modules.PromiseState
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.module
import org.junit.Test

class EmptyModule : Module() {
  override fun definition() = module {
    name("empty-module")
  }
}

class ModuleHolderTest {
  @Test
  fun `should cache module instance`() {
    val holder = ModuleHolder(EmptyModule())
    val firstInstance = holder.module
    val secondInstance = holder.module

    Truth.assertThat(firstInstance).isSameInstanceAs(secondInstance)
  }

  @Test
  fun `should reject if method doesn't exist`() {
    val holder = ModuleHolder(EmptyModule())
    val promise = PromiseMock()

    holder.call("not existing method", JavaOnlyArray(), promise)
    Truth.assertThat(promise.state).isEqualTo(PromiseState.REJECTED)
    Truth.assertThat(promise.rejectCode).isEqualTo("ERR_METHOD_NOT_FOUND")
  }
}

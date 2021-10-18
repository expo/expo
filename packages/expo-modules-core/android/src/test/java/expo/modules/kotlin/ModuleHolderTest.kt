package expo.modules.kotlin

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import expo.modules.PromiseMock
import expo.modules.PromiseState
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.module
import org.junit.Test

class EmptyModule: Module()

class ModuleHolderTest {
  @Test
  fun `should cache module instance`() {
    val holder = ModuleHolder(module {
      name("module")
    }.associateWithType(EmptyModule::class.java))
    val firstInstance = holder.module
    val secondInstance = holder.module

    Truth.assertThat(firstInstance).isSameInstanceAs(secondInstance)
  }

  @Test
  fun `should reject if method doesn't exist`() {
    val holder = ModuleHolder(module {
      name("module")
    }.associateWithType(EmptyModule::class.java))
    val promise = PromiseMock()

    holder.call("not existing method", JavaOnlyArray(), promise)
    Truth.assertThat(promise.state).isEqualTo(PromiseState.REJECTED)
  }
}

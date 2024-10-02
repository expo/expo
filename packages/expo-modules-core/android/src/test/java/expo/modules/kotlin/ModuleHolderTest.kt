package expo.modules.kotlin

import com.google.common.truth.Truth
import expo.modules.PromiseMock
import expo.modules.PromiseState
import expo.modules.assertThrows
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.junit.Test

class EmptyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("empty-module")
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
  fun `should throw if method doesn't exist`() {
    val holder = ModuleHolder(EmptyModule())
    val promise = PromiseMock()

    assertThrows<FunctionCallException>(
      """
      Call to function 'empty-module.not_existing_method' has been rejected.
      → Caused by: Method does not exist.
      """.trimIndent()
    ) {
      holder.call("not_existing_method", emptyArray(), promise)
    }

    Truth.assertThat(promise.state).isEqualTo(PromiseState.NONE)
  }
}

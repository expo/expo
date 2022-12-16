package expo.modules.kotlin.modules

import com.google.common.truth.Truth
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.events.EventName
import org.junit.Test

class ModuleHolderTest {

  @Test
  fun `holder should pass events to module`() {
    var onCreateCalls = 0
    var onDestroyCalls = 0

    class MyModule : Module() {
      override fun definition() = ModuleDefinition {
        Name("my-module")
        OnCreate { onCreateCalls++ }
        OnDestroy { onDestroyCalls++ }
      }
    }

    val holder = ModuleHolder(MyModule())

    holder.post(EventName.MODULE_CREATE)
    holder.post(EventName.MODULE_DESTROY)

    Truth.assertThat(onCreateCalls).isEqualTo(1)
    Truth.assertThat(onDestroyCalls).isEqualTo(1)
  }
}

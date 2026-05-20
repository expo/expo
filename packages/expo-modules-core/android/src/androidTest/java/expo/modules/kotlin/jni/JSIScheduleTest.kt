@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class JSIScheduleTest {
  @Test
  fun scheduleOnJSThread_should_execute_runnable() = withJSIInterop {
    evaluateScript("global.counter = 0")

    scheduleOnJSThread {
      evaluateScript("global.counter = global.counter + 1")
    }

    val result = evaluateScript("global.counter").getInt()
    Truth.assertThat(result).isEqualTo(1)
  }

  @Test
  fun scheduleOnJSThread_should_execute_multiple_runnables_in_order() = withJSIInterop {
    evaluateScript("global.values = []")

    scheduleOnJSThread {
      evaluateScript("global.values.push(1)")
    }
    scheduleOnJSThread {
      evaluateScript("global.values.push(2)")
    }
    scheduleOnJSThread {
      evaluateScript("global.values.push(3)")
    }

    val result = evaluateScript("global.values.length").getInt()
    Truth.assertThat(result).isEqualTo(3)

    val first = evaluateScript("global.values[0]").getInt()
    val second = evaluateScript("global.values[1]").getInt()
    val third = evaluateScript("global.values[2]").getInt()
    Truth.assertThat(first).isEqualTo(1)
    Truth.assertThat(second).isEqualTo(2)
    Truth.assertThat(third).isEqualTo(3)
  }
}

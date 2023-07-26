@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class CoreModuleTest {
  @Test
  fun should_be_defined() = withJSIInterop {
    val coreModule = evaluateScript("global.expo")
    Truth.assertThat(coreModule.isObject()).isTrue()
  }
}

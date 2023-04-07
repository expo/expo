@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class JNIDeallocatorTest {
  @Test
  fun inspect_memory_should_return_references_to_existing_objects() = withJSIInterop(
    inlineModule {
      Name("TestModule")
    }
  ) {
    val moduleObject = evaluateScript("expo.modules.TestModule")
    Truth.assertThat(JNIDeallocator.inspectMemory()).contains(moduleObject)
  }

  @Test
  fun deallocate_should_clear_all_saved_references() {
    withJSIInterop(
      inlineModule {
        Name("TestModule")
      }
    ) {
      evaluateScript("expo.modules.TestModule")
    }
    // JNIDeallocator.deallocate() is automatically call in the end of `withJSIInterop` scope
    Truth.assertThat(JNIDeallocator.inspectMemory()).isEmpty()
  }
}

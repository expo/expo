package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import org.junit.Test

class EventEmitterTest {
  @Test
  fun evnet_emitter_class_should_exists() = withJSIInterop {
    val sharedObjectClass = evaluateScript("expo.EventEmitter")
    Truth.assertThat(sharedObjectClass.isFunction()).isTrue()
  }
}

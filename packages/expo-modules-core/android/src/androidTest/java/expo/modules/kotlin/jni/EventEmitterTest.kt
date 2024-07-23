package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import org.junit.Test

class EventEmitterTest {
  @Test
  fun event_emitter_class_should_exists() = withJSIInterop {
    val sharedObjectClass = evaluateScript("expo.EventEmitter")
    Truth.assertThat(sharedObjectClass.isFunction()).isTrue()
  }

  @Test
  fun event_emitter_provides_backwards_compatibility() = withJSIInterop {
    val emittersAreEqual = evaluateScript(
      """
      emitterA = new expo.EventEmitter();
      emitterB = new expo.EventEmitter(emitterA);
      emitterA === emitterB;
      """.trimIndent()
    )
    Truth.assertThat(emittersAreEqual.getBool()).isTrue()
  }
}

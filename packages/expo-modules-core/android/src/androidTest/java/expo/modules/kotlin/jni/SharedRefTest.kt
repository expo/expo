package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.sharedobjects.SharedRef
import org.junit.Test

class SharedString(value: String) : SharedRef<String>(value) {
  override val nativeRefType: String = "string"
}

class SharedRefTest {
  @Test
  fun creates_shared_data() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("create") {
        SharedString("shared string")
      }
    }
  ) {
    val sharedObject = evaluateScript("expo.modules.TestModule.create()")
    Truth.assertThat(sharedObject.kind()).isEqualTo("object")
  }

  @Test
  fun shared_data_object() = withJSIInterop(
    inlineModule {
      Name("FirstModule")
      Function("create") {
        SharedString("shared string")
      }
    },
    inlineModule {
      Name("SecondModule")
      Function("unpack") { sharedString: SharedString ->
        sharedString.ref
      }
    }
  ) {
    val string = evaluateScript(
      """
      const sharedObject = expo.modules.FirstModule.create()
      expo.modules.SecondModule.unpack(sharedObject)
      """.trimIndent()
    ).getString()
    Truth.assertThat(string).isEqualTo("shared string")
  }

  @Test
  fun has_native_ref_type() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("create") {
        SharedString("shared string")
      }
    }
  ) {
    val nativeRefType = evaluateScript("expo.modules.TestModule.create().nativeRefType").getString()
    Truth.assertThat(nativeRefType).isEqualTo("string")
  }
}

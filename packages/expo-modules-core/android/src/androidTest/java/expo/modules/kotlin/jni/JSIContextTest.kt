package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.jni.extensions.addSingleQuotes
import org.junit.Test

class JSIContextTest {
  @Test
  fun module_should_be_registered() = withSingleModule({
    Function("syncFunction") {}
    AsyncFunction("asyncFunction") {}
  }) {
    val value = evaluateScript(moduleRef)
    Truth.assertThat(value.isObject()).isTrue()

    val testModule = value.getObject()

    Truth.assertThat(testModule.hasProperty("syncFunction")).isTrue()
    val syncFunction = testModule.getProperty("syncFunction")
    Truth.assertThat(syncFunction.isFunction()).isTrue()

    Truth.assertThat(testModule.hasProperty("asyncFunction")).isTrue()
    val asyncFunction = testModule.getProperty("asyncFunction")
    Truth.assertThat(asyncFunction.isFunction()).isTrue()

    Truth.assertThat(
      evaluateScript("typeof $moduleRef.syncFunction").getString()
    ).isEqualTo("function")

    Truth.assertThat(
      evaluateScript("typeof $moduleRef.asyncFunction").getString()
    ).isEqualTo("function")
  }

  @Test
  fun sync_functions_should_be_callable() = withSingleModule({
    Function("f1") { return@Function 20 }
    Function("f2") { a: String -> return@Function a + a }
  }) {
    val f1Value = call("f1")
    val f2Value = call("f2", "expo".addSingleQuotes())

    Truth.assertThat(f1Value.isNumber()).isTrue()
    val unboxedF1Value = f1Value.getInt()
    Truth.assertThat(unboxedF1Value).isEqualTo(20)

    Truth.assertThat(f2Value.isString()).isTrue()
    val unboxedF2Value = f2Value.getString()
    Truth.assertThat(unboxedF2Value).isEqualTo("expoexpo")
  }

  @Test
  fun async_functions_should_be_callable() = withSingleModule({
    AsyncFunction("f") {
      return@AsyncFunction 20
    }
  }) {
    val promiseResult = callAsync("f")
    Truth.assertThat(promiseResult.isNumber()).isTrue()
    Truth.assertThat(getLastPromiseResult().getInt()).isEqualTo(20)
  }

  @Test
  fun constants_should_be_exported() = withSingleModule({
    Name("TestModule")
    Constants(
      "c1" to 123,
      "c2" to "string",
      "c3" to mapOf("i1" to 123)
    )
  }) {
    val c1Value = evaluateScript("$moduleRef.c1")
    val c2Value = evaluateScript("$moduleRef.c2")
    val i1Value = evaluateScript("$moduleRef.c3.i1")

    Truth.assertThat(c1Value.isNumber()).isTrue()
    val unboxedC1Value = c1Value.getInt()
    Truth.assertThat(unboxedC1Value).isEqualTo(123)

    Truth.assertThat(c2Value.isString()).isTrue()
    val unboxedC2Value = c2Value.getString()
    Truth.assertThat(unboxedC2Value).isEqualTo("string")

    Truth.assertThat(i1Value.isNumber()).isTrue()
    val unboxedI1Value = i1Value.getInt()
    Truth.assertThat(unboxedI1Value).isEqualTo(123)
  }
}

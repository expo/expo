package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModuleRegistry
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.modules.ModuleDefinitionBuilder
import io.mockk.every
import io.mockk.mockk
import org.junit.Test
import java.lang.ref.WeakReference

private inline fun withJSIInterop(
  vararg modules: Module,
  block: JSIInteropModuleRegistry.() -> Unit
) {
  val appContextMock = mockk<AppContext>()
  val registry = ModuleRegistry(WeakReference(appContextMock)).apply {
    modules.forEach {
      register(it)
    }
  }
  every { appContextMock.registry } answers { registry }

  val jsiIterop = JSIInteropModuleRegistry(appContextMock).apply {
    installJSIForTests()
  }

  block(jsiIterop)
}

private inline fun inlineModule(
  crossinline block: ModuleDefinitionBuilder.() -> Unit
) = object : Module() {
  override fun definition() = ModuleDefinition { block.invoke(this) }
}

class JSIInteropModuleRegistryTest {
  @Test
  fun module_should_be_registered() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("syncFunction") { }
      AsyncFunction("asyncFunction") {}
    }
  ) {
    val value = evaluateScript("ExpoModules.TestModule")
    Truth.assertThat(value.isObject()).isTrue()

    val testModule = value.getObject()

    Truth.assertThat(testModule.hasProperty("syncFunction")).isTrue()
    val syncFunction = testModule.getProperty("syncFunction")
    Truth.assertThat(syncFunction.isFunction()).isTrue()

    Truth.assertThat(testModule.hasProperty("asyncFunction")).isTrue()
    val asyncFunction = testModule.getProperty("asyncFunction")
    Truth.assertThat(asyncFunction.isFunction()).isTrue()

    Truth.assertThat(
      evaluateScript("typeof ExpoModules.TestModule.syncFunction").getString()
    ).isEqualTo("function")

    Truth.assertThat(
      evaluateScript("typeof ExpoModules.TestModule.asyncFunction").getString()
    ).isEqualTo("function")
  }

  @Test
  fun sync_functions_should_be_callable() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("f1") { return@Function 20 }
      Function("f2") { a: String -> return@Function a + a }
    }
  ) {

    val f1Value = evaluateScript("ExpoModules.TestModule.f1()")
    val f2Value = evaluateScript("ExpoModules.TestModule.f2(\"expo\")")

    Truth.assertThat(f1Value.isNumber()).isTrue()
    val unboxedF1Value = f1Value.getDouble().toInt()
    Truth.assertThat(unboxedF1Value).isEqualTo(20)

    Truth.assertThat(f2Value.isString()).isTrue()
    val unboxedF2Value = f2Value.getString()
    Truth.assertThat(unboxedF2Value).isEqualTo("expoexpo")
  }

  @Test
  fun async_functions_should_be_callable() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      AsyncFunction("f") { return@AsyncFunction 20 }
    }
  ) {
    val jsPromiseClass = evaluateScript(
      """
      const promise = ExpoModules.TestModule.f();
      promise.constructor.name
      """.trimIndent()
    )

    Truth.assertThat(jsPromiseClass.isString()).isTrue()
    Truth.assertThat(jsPromiseClass.getString()).isEqualTo("Promise")
  }

  @Test
  fun constants_should_be_exported() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Constants(
        "c1" to 123,
        "c2" to "string",
        "c3" to mapOf("i1" to 123)
      )
    }
  ) {

    val c1Value = evaluateScript("ExpoModules.TestModule.c1")
    val c2Value = evaluateScript("ExpoModules.TestModule.c2")
    val i1Value = evaluateScript("ExpoModules.TestModule.c3.i1")

    Truth.assertThat(c1Value.isNumber()).isTrue()
    val unboxedC1Value = c1Value.getDouble().toInt()
    Truth.assertThat(unboxedC1Value).isEqualTo(123)

    Truth.assertThat(c2Value.isString()).isTrue()
    val unboxedC2Value = c2Value.getString()
    Truth.assertThat(unboxedC2Value).isEqualTo("string")

    Truth.assertThat(i1Value.isNumber()).isTrue()
    val unboxedI1Value = i1Value.getDouble().toInt()
    Truth.assertThat(unboxedI1Value).isEqualTo(123)
  }
}

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
  vararg modules: Module, block: JSIInteropModuleRegistry.() -> Unit
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
    val jsPromiseClass = evaluateScript("""
      const promise = ExpoModules.TestModule.f();
      promise.constructor.name
    """.trimIndent())

    Truth.assertThat(jsPromiseClass.isString()).isTrue()
    Truth.assertThat(jsPromiseClass.getString()).isEqualTo("Promise")
  }
}

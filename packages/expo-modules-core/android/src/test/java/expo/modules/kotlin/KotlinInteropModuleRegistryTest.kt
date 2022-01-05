package expo.modules.kotlin

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.google.common.truth.Truth
import expo.modules.PromiseMock
import expo.modules.PromiseState
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import io.mockk.mockk
import org.junit.Test
import java.lang.ref.WeakReference

private class DomainError : CodedException("Something went wrong")

private class MyRecord : Record {
  @Field
  lateinit var string: String
}

private class DummyModule_1 : Module() {
  override fun definition() = ModuleDefinition {
    name("dummy-1")
    function("f1") {
      throw NullPointerException()
    }
    function<Int, MyRecord>("f2") {
      throw NullPointerException()
    }
    constants {
      mapOf(
        "c1" to 123,
        "c2" to "123"
      )
    }
  }
}

private class DummyModule_2 : Module() {
  override fun definition() = ModuleDefinition {
    name("dummy-2")
    function("f1") {
      throw DomainError()
    }
    function("f2") { arg1: Int ->
      arg1
    }
    viewManager {
      view { mockk() }
    }
  }
}

private val provider = object : ModulesProvider {
  override fun getModulesList(): List<Class<out Module>> {
    return listOf(
      DummyModule_1::class.java,
      DummyModule_2::class.java
    )
  }
}

class KotlinInteropModuleRegistryTest {
  private val interopModuleRegistry = KotlinInteropModuleRegistry(
    provider,
    mockk(),
    WeakReference(mockk(relaxed = true))
  )

  @Test
  fun `should register modules from provider`() {
    interopModuleRegistry.hasModule("dummy-1")
    interopModuleRegistry.hasModule("dummy-2")
  }

  @Test
  fun `should export constants`() {
    Truth.assertThat(interopModuleRegistry.exportedModulesConstants())
      .containsExactly(
        "dummy-1", mapOf("c1" to 123, "c2" to "123"),
        "dummy-2", emptyMap<String, Any>()
      )
  }

  @Test
  fun `should export view manages`() {
    val rnManagers = interopModuleRegistry.exportViewManagers()
    val expoManagersNames = interopModuleRegistry.exportedViewManagersNames()

    Truth.assertThat(rnManagers).hasSize(1)
    Truth.assertThat(rnManagers.first().name).isEqualTo("ViewManagerAdapter_dummy-2")
    Truth.assertThat(expoManagersNames).containsExactly("dummy-2")
  }

  @Test
  fun `call method should reject if something goes wrong`() {
    val mockedPromise = PromiseMock()
    val mockedPromise2 = PromiseMock()

    interopModuleRegistry.callMethod("dummy-1", "f1", JavaOnlyArray(), mockedPromise)
    interopModuleRegistry.callMethod("dummy-2", "f1", JavaOnlyArray(), mockedPromise2)

    Truth.assertThat(mockedPromise.state).isEqualTo(PromiseState.REJECTED)
    Truth.assertThat(mockedPromise.rejectMessage).isEqualTo(
      """
      Cannot call `f1` from the `dummy-1`.
      caused by: java.lang.NullPointerException
      """.trimIndent()
    )

    Truth.assertThat(mockedPromise2.state).isEqualTo(PromiseState.REJECTED)
    Truth.assertThat(mockedPromise2.rejectMessage).isEqualTo(
      """
      Cannot call `f1` from the `dummy-2`.
      caused by: Something went wrong
      """.trimIndent()
    )
  }

  @Test
  fun `call method should reject if method was called with incorrect arguments`() {
    val testCases = listOf(
      Triple(
        "dummy-1",
        "f10",
        JavaOnlyArray()
      ) to """
        Cannot call `f10` from the `dummy-1`.
        caused by: Method does not exist.
      """.trimIndent(),
      Triple(
        "dummy-1",
        "f1",
        JavaOnlyArray().apply { pushInt(1) }
      ) to """
        Cannot call `f1` from the `dummy-1`.
        caused by: Received 1 arguments, but 0 was expected.
      """.trimIndent(),
      Triple(
        "dummy-2",
        "f2",
        JavaOnlyArray().apply { pushString("string") }
      ) to """
        Cannot call `f2` from the `dummy-2`.
        caused by: Cannot obtain `0` parameter. Tried to cast `String` to `kotlin.Int`.
        caused by: java.lang.ClassCastException: java.lang.String cannot be cast to java.lang.Number
      """.trimIndent(),
      Triple(
        "dummy-2",
        "f2",
        JavaOnlyArray()
      ) to """
        Cannot call `f2` from the `dummy-2`.
        caused by: Received 0 arguments, but 1 was expected.
      """.trimIndent(),
      Triple(
        "dummy-1",
        "f2",
        JavaOnlyArray().apply { pushMap(JavaOnlyMap().apply { putInt("string", 10) }) }
      ) to """
        Cannot call `f2` from the `dummy-1`.
        caused by: Cannot obtain `0` parameter. Tried to cast `Map` to `expo.modules.kotlin.MyRecord`.
        caused by: Cannot create a record of the type: `expo.modules.kotlin.MyRecord`.
        caused by: Cannot obtain `string` field. Tried to cast `Number` to kotlin.String`.
        caused by: java.lang.ClassCastException: java.lang.Double cannot be cast to java.lang.String
      """.trimIndent()
    )

    testCases.forEach {
      val callValues = it.first
      val expected = it.second
      val promise = PromiseMock()

      interopModuleRegistry.callMethod(callValues.first, callValues.second, callValues.third, promise)

      Truth.assertThat(promise.state).isEqualTo(PromiseState.REJECTED)
      Truth.assertThat(promise.rejectMessage).isEqualTo(expected)
    }
  }
}

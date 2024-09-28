package expo.modules.kotlin

import android.view.View
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
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.lang.ref.WeakReference

private class TestException : CodedException("Something went wrong")

private class TestRecord : Record {
  @Field
  lateinit var string: String
}

private class TestModule1 : Module() {
  override fun definition() = ModuleDefinition {
    Name("test-1")
    AsyncFunction("f1") {
      throw NullPointerException()
    }
    @Suppress("UNUSED_ANONYMOUS_PARAMETER")
    AsyncFunction<Int, TestRecord>("f2") { record ->
      throw NullPointerException()
    }
    Constants {
      mapOf(
        "c1" to 123,
        "c2" to "123"
      )
    }
  }
}

private class TestModule2 : Module() {
  override fun definition() = ModuleDefinition {
    Name("test-2")
    AsyncFunction("f1") {
      throw TestException()
    }
    AsyncFunction("f2") { arg1: Int ->
      arg1
    }
    View(View::class) {
    }
  }
}

private val provider = object : ModulesProvider {
  override fun getModulesList(): List<Class<out Module>> {
    return listOf(
      TestModule1::class.java,
      TestModule2::class.java
    )
  }
}

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class KotlinInteropModuleRegistryTest {
  private val interopModuleRegistry = KotlinInteropModuleRegistry(
    provider,
    mockk(),
    WeakReference(mockk(relaxed = true))
  )

  @Test
  fun `should register modules from provider`() {
    interopModuleRegistry.hasModule("test-1")
    interopModuleRegistry.hasModule("test-2")
  }

  @Test
  fun `call method should reject if something goes wrong`() {
    val mockedPromise = PromiseMock()
    val mockedPromise2 = PromiseMock()

    interopModuleRegistry.callMethod("test-1", "f1", JavaOnlyArray(), mockedPromise)
    interopModuleRegistry.callMethod("test-2", "f1", JavaOnlyArray(), mockedPromise2)

    Truth.assertThat(mockedPromise.state).isEqualTo(PromiseState.REJECTED)
    Truth.assertThat(mockedPromise.rejectMessage).isEqualTo(
      """
      Call to function 'test-1.f1' has been rejected.
      → Caused by: java.lang.NullPointerException
      """.trimIndent()
    )

    Truth.assertThat(mockedPromise2.state).isEqualTo(PromiseState.REJECTED)
    Truth.assertThat(mockedPromise2.rejectMessage).isEqualTo(
      """
      Call to function 'test-2.f1' has been rejected.
      → Caused by: Something went wrong
      """.trimIndent()
    )
  }

  @Test
  fun `call method should reject if method was called with incorrect arguments`() {
    val testCases = listOf(
      Triple(
        "test-1",
        "f10",
        JavaOnlyArray()
      ) to """
        Call to function 'test-1.f10' has been rejected.
        → Caused by: Method does not exist.
      """.trimIndent(),
      Triple(
        "test-1",
        "f1",
        JavaOnlyArray().apply { pushInt(1) }
      ) to """
        Call to function 'test-1.f1' has been rejected.
        → Caused by: Received 1 arguments, but 0 was expected
      """.trimIndent(),
      Triple(
        "test-2",
        "f2",
        JavaOnlyArray()
      ) to """
        Call to function 'test-2.f2' has been rejected.
        → Caused by: Received 0 arguments, but 1 was expected
      """.trimIndent(),
      Triple(
        "test-1",
        "f2",
        JavaOnlyArray().apply { pushMap(JavaOnlyMap().apply { putInt("string", 10) }) }
      ) to """
        Call to function 'test-1.f2' has been rejected.
        → Caused by: The 1st argument cannot be cast to type expo.modules.kotlin.TestRecord (received class com.facebook.react.bridge.JavaOnlyMap)
        → Caused by: Cannot cast 'Number' for field 'string' ('kotlin.String').
        → Caused by: java.lang.ClassCastException: class java.lang.Double cannot be cast to class java.lang.String (java.lang.Double and java.lang.String are in module java.base of loader 'bootstrap')
      """.trimIndent()
    )

    testCases.forEach {
      val callValues = it.first
      val expected = it.second
      val promise = PromiseMock()

      interopModuleRegistry.callMethod(callValues.first, callValues.second, callValues.third, promise)

      Truth.assertThat(promise.state).isEqualTo(PromiseState.REJECTED)
      Truth.assertThat(promise.rejectMessage).contains(expected)
    }
  }
}

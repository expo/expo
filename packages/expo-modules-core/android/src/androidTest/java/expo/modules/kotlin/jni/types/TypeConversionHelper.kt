package expo.modules.kotlin.jni.types

import com.google.common.truth.Truth
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.jni.extensions.addSingleQuotes
import expo.modules.kotlin.jni.inlineModule
import expo.modules.kotlin.jni.withJSIInterop
import kotlinx.coroutines.ExperimentalCoroutinesApi

fun interface JSAssertion {
  operator fun invoke(value: JavaScriptValue)

  class AlwaysTrue : JSAssertion {
    override fun invoke(value: JavaScriptValue) = Unit
  }

  open class Equal<T>(
    private val expectedValue: T,
    private val map: (JavaScriptValue) -> T
  ) : JSAssertion {
    override operator fun invoke(value: JavaScriptValue) {
      Truth.assertThat(map(value)).isEqualTo(expectedValue)
    }
  }

  class StringEqual(expectedValue: String) :
    Equal<String>(expectedValue, JavaScriptValue::getString)

  class IntEqual(expectedValue: Int) :
    Equal<Int>(expectedValue, JavaScriptValue::getInt)

  class DoubleEqual(expectedValue: Double) :
    Equal<Double>(expectedValue, JavaScriptValue::getDouble)
}

internal class TestCase<T, R>(
  val jsValue: String,
  val nativeAssertion: (T) -> Unit = {},
  val map: (T) -> R = {
    @Suppress("UNCHECKED_CAST")
    it as R
  },
  val jsAssertion: (JavaScriptValue) -> Unit = {}
) {
  constructor(
    jsValue: String,
    nativeAssertion: (T) -> Unit = {},
    map: (T) -> R = {
      @Suppress("UNCHECKED_CAST")
      it as R
    },
    jsAssertion: JSAssertion
  ) : this(jsValue, nativeAssertion, map, jsAssertion::invoke)
}

@OptIn(ExperimentalCoroutinesApi::class)
internal inline fun <reified T, reified R> conversionTest(
  vararg cases: TestCase<T, R>
) {
  withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function<R, Int, T>("conversionTest") { testID: Int, value: T ->
        val case = cases[testID]
        case.nativeAssertion(value)
        return@Function case.map(value)
      }
    }
  ) {
    for ((index, case) in cases.withIndex()) {
      val jsValue = case.jsValue
      val result = evaluateScript(
        "expo.modules.TestModule.conversionTest($index, $jsValue)"
      )
      case.jsAssertion(result)
    }
  }
}

internal inline fun <reified T, reified R> conversionTest(
  jsValue: String,
  noinline nativeAssertion: (T) -> Unit = {},
  noinline map: (T) -> R = {
    it as R
  },
  jsAssertion: JSAssertion = JSAssertion.AlwaysTrue()
) {
  conversionTest(
    TestCase(jsValue, nativeAssertion, map, jsAssertion)
  )
}

@JvmName("conversionTestT")
internal inline fun <reified T> conversionTest(
  jsValue: String,
  noinline nativeAssertion: (T) -> Unit = {},
  noinline map: (T) -> T = { it },
  jsAssertion: JSAssertion
) = conversionTest<T, T>(
  jsValue,
  nativeAssertion,
  map,
  jsAssertion
)

@JvmName("conversionTestT")
internal inline fun <reified T> conversionTest(
  jsValue: String,
  noinline nativeAssertion: (T) -> Unit = {},
  noinline map: (T) -> T = { it },
  noinline jsAssertion: (JavaScriptValue) -> Unit
) = conversionTest<T, T>(
  jsValue,
  nativeAssertion,
  map,
  jsAssertion
)

internal inline fun <reified T, reified R> conversionTest(
  jsValue: String,
  noinline nativeAssertion: (T) -> Unit = {},
  noinline map: (T) -> R = {
    it as R
  },
  noinline jsAssertion: (JavaScriptValue) -> Unit
) {
  conversionTest(
    TestCase(jsValue, nativeAssertion, map, jsAssertion)
  )
}

internal inline fun <reified T : Any> conversionTest(
  stringValue: String
) {
  conversionTest<T, String>(
    jsValue = stringValue.addSingleQuotes(),
    map = { x: T ->
      x.toString()
    },
    jsAssertion = JSAssertion.StringEqual(stringValue)
  )
}

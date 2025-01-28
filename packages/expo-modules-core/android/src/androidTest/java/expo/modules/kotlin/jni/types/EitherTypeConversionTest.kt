@file:OptIn(EitherType::class)

package expo.modules.kotlin.jni.types

import com.facebook.react.bridge.DynamicFromObject
import com.google.common.truth.Truth
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.jni.SharedString
import expo.modules.kotlin.jni.extensions.addSingleQuotes
import expo.modules.kotlin.jni.withSingleModule
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.convert
import org.junit.Test
import java.net.URL

@EitherType
class EitherTypeConversionTest {
  @Test
  fun either_should_be_convertible() = conversionTest(
    TestCase(
      jsValue = "123",
      nativeAssertion = { either: Either<Int, String> ->
        Truth.assertThat(either.`is`(Int::class)).isTrue()
        Truth.assertThat(either.`is`(String::class)).isFalse()
      },
      map = { it.get(Int::class) },
      jsAssertion = JSAssertion.IntEqual(123)
    ),
    TestCase(
      jsValue = "expo".addSingleQuotes(),
      nativeAssertion = { either: Either<Int, String> ->
        Truth.assertThat(either.`is`(Int::class)).isFalse()
        Truth.assertThat(either.`is`(String::class)).isTrue()
      },
      map = { it.get(String::class) },
      jsAssertion = JSAssertion.StringEqual("expo")
    )
  )

  @Test
  fun either_with_overlapping_types_should_be_convertible() = conversionTest<Either<URL, String>, URL>(
    jsValue = "https://expo.dev/".addSingleQuotes(),
    nativeAssertion = { either: Either<URL, String> ->
      Truth.assertThat(either.`is`(URL::class)).isTrue()
      Truth.assertThat(either.`is`(String::class)).isTrue()
    },
    map = { it.first() },
    jsAssertion = JSAssertion.StringEqual("https://expo.dev/")
  )

  @Test(expected = JavaScriptEvaluateException::class)
  fun convert_should_throw_when_conversion_is_impossible() =
    conversionTest<Either<String, Map<String, Any>>, Boolean>(
      jsValue = "123",
      map = { false }
    )

  @Test
  fun should_convert_from_dynamic() {
    val dynamicInt = DynamicFromObject(1.0)
    val dynamicString = DynamicFromObject("second")

    val convertedInt = convert<Either<Int, String>>(dynamicInt)
    val convertedString = convert<Either<Int, String>>(dynamicString)

    Truth.assertThat(convertedInt.`is`(Int::class)).isTrue()
    Truth.assertThat(convertedInt.`is`(String::class)).isFalse()
    Truth.assertThat(convertedInt.first()).isEqualTo(1)

    Truth.assertThat(convertedString.`is`(Int::class)).isFalse()
    Truth.assertThat(convertedString.`is`(String::class)).isTrue()
    Truth.assertThat(convertedString.second()).isEqualTo("second")
  }

  @Test
  fun should_convert_from_shared_ref() = withSingleModule({
    Function("create") {
      SharedString("shared string")
    }

    Function("unpack") { sharedString: Either<Int, SharedRef<String>> ->
      sharedString.second().ref
    }
  }) {
    val sharedString = evaluateScript(
      """
      const ref = $moduleRef.create();
      $moduleRef.unpack(ref);
      """.trimIndent()
    ).getString()

    Truth.assertThat(sharedString).isEqualTo("shared string")
  }
}

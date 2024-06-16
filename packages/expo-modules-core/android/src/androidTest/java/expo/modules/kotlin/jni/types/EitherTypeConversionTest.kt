@file:OptIn(EitherType::class)

package expo.modules.kotlin.jni.types

import com.google.common.truth.Truth
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.jni.extensions.addSingleQuotes
import expo.modules.kotlin.types.Either
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
  fun either_with_overlapping_types_should_be_convertible() = conversionTest(
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
}

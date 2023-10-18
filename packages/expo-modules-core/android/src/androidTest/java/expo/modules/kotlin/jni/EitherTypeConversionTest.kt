@file:OptIn(EitherType::class, ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.types.Either
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test
import java.net.URL

class EitherTypeConversionTest {
  @Test
  fun either_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("eitherFirst") { either: Either<Int, String> ->
        Truth.assertThat(either.`is`(Int::class)).isTrue()
        Truth.assertThat(either.`is`(String::class)).isFalse()
        either.get(Int::class)
      }
      Function("eitherSecond") { either: Either<Int, String> ->
        Truth.assertThat(either.`is`(String::class)).isTrue()
        Truth.assertThat(either.`is`(Int::class)).isFalse()
        either.get(String::class)
      }
    }
  ) {
    val int = evaluateScript("expo.modules.TestModule.eitherFirst(123)").getInt()
    val string = evaluateScript("expo.modules.TestModule.eitherSecond('expo')").getString()

    Truth.assertThat(int).isEqualTo(123)
    Truth.assertThat(string).isEqualTo("expo")
  }

  @Test
  fun either_with_overlapping_types_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("either") { either: Either<URL, String> ->
        Truth.assertThat(either.`is`(URL::class)).isTrue()
        Truth.assertThat(either.`is`(String::class)).isTrue()

        either.first()
      }
    }
  ) {
    val url = evaluateScript("expo.modules.TestModule.either('https://expo.dev/')").getString()

    Truth.assertThat(url).isEqualTo("https://expo.dev/")
  }

  @Test(expected = JavaScriptEvaluateException::class)
  fun convert_should_throw_when_conversion_is_impossible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("either") { _: Either<String, Map<String, Any>> ->
        false
      }
    }
  ) {
    evaluateScript("expo.modules.TestModule.either(123)")
  }
}

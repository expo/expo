package expo.modules.kotlin.jni.types

import android.net.Uri
import com.google.common.truth.Truth
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.jni.extensions.addSingleQuotes
import org.junit.Test
import java.net.URI
import java.net.URL

class NetTypeConversionTest {
  private val expoDev = "https://expo.dev"
  private val exampleApi = "http://api.example.org/data/2.5/forecast/daily?q=94043&mode=json&units=metric&cnt=7"
  private val queryWithEmoji = "param=🥓"
  private val queryWithEmojiEncoded = "param=%F0%9F%A5%93"
  private val path = "/expo//%?^&/test"
  private val pathEncoded = "/expo/%2F%25%3F%5E%26/test" // -> /expo//%?^&/test
  private val queryWithAnchor = "param=#expo"
  private val fileProtocol = "file://"
  private val file = "/expo/image.png"
  private val fileWithUtf8 = "/中文ÅÄÖąÓśĆñ.gif"
  private val fileWithPercent = "/%.png"

  @Test
  fun URL_should_be_convertible() =
    conversionTest<URL>(stringValue = expoDev)

  @Test
  fun Uri_should_be_convertible() =
    conversionTest<Uri>(stringValue = exampleApi)

  @Test
  fun Java_URI_should_be_convertible() =
    conversionTest<URI>(stringValue = exampleApi)

  @Test
  fun URL_converts_with_unencoded_query() {
    val urlString = "$expoDev?$queryWithEmoji"
    return conversionTest<URL>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { url ->
        Truth.assertThat(url.query).isEqualTo(queryWithEmoji)
        Truth.assertThat(url.toString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun Uri_converts_with_unencoded_query() {
    val urlString = "$expoDev?$queryWithEmoji"
    return conversionTest<Uri>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.query).isEqualTo(queryWithEmoji)
        Truth.assertThat(uri.toString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun Java_URI_converts_with_unencoded_query() {
    val urlString = "$expoDev?$queryWithEmoji"
    return conversionTest<URI>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.query).isEqualTo(queryWithEmoji)
        Truth.assertThat(uri.toString()).isEqualTo(urlString)
        Truth.assertThat(uri.toASCIIString()).isEqualTo("$expoDev?$queryWithEmojiEncoded")
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun URL_converts_with_encoded_query() {
    val urlString = "$expoDev?$queryWithEmojiEncoded"
    return conversionTest<URL>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { url ->
        Truth.assertThat(url.query).isEqualTo(queryWithEmojiEncoded)
        Truth.assertThat(url.toString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun Uri_converts_with_encoded_query() {
    val urlString = "$expoDev?$queryWithEmojiEncoded"
    return conversionTest<Uri>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.query).isEqualTo(queryWithEmoji)
        Truth.assertThat(uri.encodedQuery).isEqualTo(queryWithEmojiEncoded)
        Truth.assertThat(uri.toString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun Java_URI_converts_with_encoded_query() {
    val urlString = "$expoDev?$queryWithEmojiEncoded"
    return conversionTest<URI>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.query).isEqualTo(queryWithEmoji)
        Truth.assertThat(uri.rawQuery).isEqualTo(queryWithEmojiEncoded)
        Truth.assertThat(uri.toString()).isEqualTo(urlString)
        Truth.assertThat(uri.toASCIIString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun URL_converts_with_unencoded_path() {
    val urlString = "$expoDev$path"
    return conversionTest<URL>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { url ->
        // URL tries to decode unencoded path
        Truth.assertThat(url.path).isEqualTo("/expo//%")
        Truth.assertThat(url.toString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun Uri_converts_with_unencoded_path() {
    val urlString = "$expoDev$path"
    return conversionTest<Uri>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { uri ->
        // Uri tries to decode unencoded path
        Truth.assertThat(uri.toString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun Java_URI_converts_with_unencoded_path() {
    val urlString = "$expoDev$path"
    try {
      conversionTest<URL>(stringValue = urlString)
    } catch (e: JavaScriptEvaluateException) {
      Truth.assertThat(e.message).contains("Malformed escape pair")
    }
  }

  @Test
  fun URL_converts_with_encoded_path() {
    val urlString = "$expoDev$pathEncoded"
    return conversionTest<URL>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { url ->
        Truth.assertThat(url.path).isEqualTo(pathEncoded)
        Truth.assertThat(url.toString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun Uri_converts_with_encoded_path() {
    val urlString = "$expoDev$pathEncoded"
    return conversionTest<Uri>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.path).isEqualTo(path)
        Truth.assertThat(uri.encodedPath).isEqualTo(pathEncoded)
        Truth.assertThat(uri.toString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun Java_URI_converts_with_encoded_path() {
    val urlString = "$expoDev$pathEncoded"
    return conversionTest<URI>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.path).isEqualTo(path)
        Truth.assertThat(uri.rawPath).isEqualTo(pathEncoded)
        Truth.assertThat(uri.toString()).isEqualTo(urlString)
        Truth.assertThat(uri.toASCIIString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun URL_converts_with_anchor() {
    val urlString = "$expoDev?$queryWithAnchor"
    return conversionTest<URL>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { url ->
        Truth.assertThat(url.query).isEqualTo("param=")
        Truth.assertThat(url.ref).isEqualTo("expo")
        Truth.assertThat(url.toString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun Uri_converts_with_anchor() {
    val urlString = "$expoDev?$queryWithAnchor"
    return conversionTest<Uri>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.query).isEqualTo("param=")
        Truth.assertThat(uri.fragment).isEqualTo("expo")
        Truth.assertThat(uri.toString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun Java_URI_converts_with_anchor() {
    val urlString = "$expoDev?$queryWithAnchor"
    return conversionTest<URI>(
      jsValue = urlString.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.query).isEqualTo("param=")
        Truth.assertThat(uri.fragment).isEqualTo("expo")
        Truth.assertThat(uri.toString()).isEqualTo(urlString)
        Truth.assertThat(uri.toASCIIString()).isEqualTo(urlString)
      },
      jsAssertion = JSAssertion.StringEqual(urlString)
    )
  }

  @Test
  fun URL_converts_from_file_url() {
    val filePath = "$fileProtocol$file"
    return conversionTest<URL>(
      jsValue = filePath.addSingleQuotes(),
      nativeAssertion = { url ->
        Truth.assertThat(url.protocol).isEqualTo("file")
        Truth.assertThat(url.path).isEqualTo(file)
        Truth.assertThat(url.file).isEqualTo(file)
        Truth.assertThat(url.toString()).isEqualTo(filePath)
      },
      jsAssertion = JSAssertion.StringEqual(filePath)
    )
  }

  @Test
  fun Uri_converts_from_file_url() {
    val filePath = "$fileProtocol$file"
    return conversionTest<Uri>(
      jsValue = filePath.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.scheme).isEqualTo("file")
        Truth.assertThat(uri.path).isEqualTo(file)
        Truth.assertThat(uri.toString()).isEqualTo(filePath)
      },
      jsAssertion = JSAssertion.StringEqual(filePath)
    )
  }

  @Test
  fun Java_URI_converts_from_file_url() {
    val filePath = "$fileProtocol$file"
    return conversionTest<URI>(
      jsValue = filePath.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.scheme).isEqualTo("file")
        Truth.assertThat(uri.path).isEqualTo(file)
        Truth.assertThat(uri.toString()).isEqualTo(filePath)
      },
      jsAssertion = JSAssertion.StringEqual(filePath)
    )
  }

  @Test
  fun URL_converts_from_file_path() {
    try {
      conversionTest<URL>(stringValue = file)
    } catch (e: JavaScriptEvaluateException) {
      Truth.assertThat(e.message).contains("MalformedURLException")
    }
  }

  @Test
  fun Uri_converts_from_file_path() {
    return conversionTest<Uri>(
      jsValue = file.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.path).isEqualTo(file)
        Truth.assertThat(uri.isRelative).isTrue()
        Truth.assertThat(uri.toString()).isEqualTo(file)
      },
      jsAssertion = JSAssertion.StringEqual(file)
    )
  }

  @Test
  fun Java_URI_converts_from_file_path() {
    return conversionTest<URI>(
      jsValue = file.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.path).isEqualTo(file)
        Truth.assertThat(uri.isAbsolute).isFalse()
        Truth.assertThat(uri.toString()).isEqualTo(file)
      },
      jsAssertion = JSAssertion.StringEqual(file)
    )
  }

  @Test
  fun URL_converts_from_file_path_with_UTF8_characters() {
    try {
      conversionTest<URL>(stringValue = fileWithUtf8)
    } catch (e: JavaScriptEvaluateException) {
//      Truth.assertThat(e).isEqualTo(MalformedURLException())
      Truth.assertThat(e.message).contains("MalformedURLException")
    }
  }

  @Test
  fun Uri_converts_from_file_path_with_UTF8_characters() {
    return conversionTest<Uri>(
      jsValue = fileWithUtf8.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.path).isEqualTo(fileWithUtf8)
        Truth.assertThat(uri.toString()).isEqualTo(fileWithUtf8)
      },
      jsAssertion = JSAssertion.StringEqual(fileWithUtf8)
    )
  }

  @Test
  fun Java_URI_converts_from_file_path_with_UTF8_characters() {
    return conversionTest<URI>(
      jsValue = fileWithUtf8.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.path).isEqualTo(fileWithUtf8)
        Truth.assertThat(uri.toString()).isEqualTo(fileWithUtf8)
      },
      jsAssertion = JSAssertion.StringEqual(fileWithUtf8)
    )
  }

  @Test
  fun URL_converts_from_file_path_with_percent() {
    try {
      conversionTest<URL>(stringValue = fileWithPercent)
    } catch (e: JavaScriptEvaluateException) {
      Truth.assertThat(e.message).contains("MalformedURLException")
    }
  }

  @Test
  fun Uri_converts_from_file_path_with_percent() {
    return conversionTest<Uri>(
      jsValue = fileWithPercent.addSingleQuotes(),
      nativeAssertion = { uri ->
        Truth.assertThat(uri.encodedPath).isEqualTo(fileWithPercent)
        Truth.assertThat(uri.toString()).isEqualTo(fileWithPercent)
      },
      jsAssertion = JSAssertion.StringEqual(fileWithPercent)
    )
  }

  @Test
  fun Java_URI_converts_from_file_path_with_percent() {
    try {
      conversionTest<URI>(stringValue = fileWithPercent)
    } catch (e: JavaScriptEvaluateException) {
      Truth.assertThat(e.message).contains("Malformed escape pair")
    }
  }
}

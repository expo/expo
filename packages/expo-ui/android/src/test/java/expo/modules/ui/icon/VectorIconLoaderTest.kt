package expo.modules.ui.icon

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class VectorIconLoaderTest {

  private lateinit var context: Context
  private lateinit var okHttpClient: OkHttpClient
  private lateinit var loader: VectorIconLoader
  private lateinit var mockWebServer: MockWebServer

  @Before
  fun setup() {
    context = ApplicationProvider.getApplicationContext()
    okHttpClient = OkHttpClient.Builder().build()
    loader = VectorIconLoader(context, okHttpClient)
    mockWebServer = MockWebServer()
    mockWebServer.start()
  }

  @After
  fun tearDown() {
    mockWebServer.shutdown()
  }

  // ========== XML Parsing Tests ==========

  @Test
  fun `should parse simple material symbol xml to ImageVector`() {
    val xml = """
      <vector xmlns:android="http://schemas.android.com/apk/res/android"
          android:width="24dp"
          android:height="24dp"
          android:viewportWidth="960"
          android:viewportHeight="960">
        <path
            android:fillColor="#000000"
            android:pathData="M160,840L160,360L480,120L800,360L800,840L560,840L560,560L400,560L400,840L160,840Z"/>
      </vector>
    """.trimIndent()

    val imageVector = loader.parseXmlToImageVector(xml.toByteArray())

    assertThat(imageVector).isNotNull()
    assertThat(imageVector!!.defaultWidth.value).isWithin(0.01f).of(24f)
    assertThat(imageVector.defaultHeight.value).isWithin(0.01f).of(24f)
    assertThat(imageVector.viewportWidth).isWithin(0.01f).of(960f)
    assertThat(imageVector.viewportHeight).isWithin(0.01f).of(960f)
  }

  @Test
  fun `should parse xml with multiple paths`() {
    val xml = """
      <vector xmlns:android="http://schemas.android.com/apk/res/android"
          android:width="24dp"
          android:height="24dp"
          android:viewportWidth="24"
          android:viewportHeight="24">
        <path
            android:fillColor="#FF0000"
            android:pathData="M12,2L2,12h10V2z"/>
        <path
            android:fillColor="#00FF00"
            android:pathData="M12,12h10L12,22V12z"/>
      </vector>
    """.trimIndent()

    val imageVector = loader.parseXmlToImageVector(xml.toByteArray())

    assertThat(imageVector).isNotNull()
    assertThat(imageVector!!.viewportWidth).isWithin(0.01f).of(24f)
    assertThat(imageVector.viewportHeight).isWithin(0.01f).of(24f)
  }

  @Test
  fun `should handle xml with different dimension units`() {
    val xml = """
      <vector xmlns:android="http://schemas.android.com/apk/res/android"
          android:width="48dp"
          android:height="48dip"
          android:viewportWidth="100"
          android:viewportHeight="100">
        <path android:fillColor="#000000" android:pathData="M0,0L100,100"/>
      </vector>
    """.trimIndent()

    val imageVector = loader.parseXmlToImageVector(xml.toByteArray())

    assertThat(imageVector).isNotNull()
    assertThat(imageVector!!.defaultWidth.value).isWithin(0.01f).of(48f)
    assertThat(imageVector.defaultHeight.value).isWithin(0.01f).of(48f)
  }

  @Test
  fun `should return null for invalid xml`() {
    val invalidXml = "not xml content"

    val imageVector = loader.parseXmlToImageVector(invalidXml.toByteArray())

    assertThat(imageVector).isNull()
  }

  @Test
  fun `should return null for xml without vector element`() {
    val xml = """
      <svg xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0L100,100"/>
      </svg>
    """.trimIndent()

    val imageVector = loader.parseXmlToImageVector(xml.toByteArray())

    assertThat(imageVector).isNull()
  }

  @Test
  fun `should handle empty path data gracefully`() {
    val xml = """
      <vector xmlns:android="http://schemas.android.com/apk/res/android"
          android:width="24dp"
          android:height="24dp"
          android:viewportWidth="24"
          android:viewportHeight="24">
        <path android:fillColor="#000000" android:pathData=""/>
      </vector>
    """.trimIndent()

    val imageVector = loader.parseXmlToImageVector(xml.toByteArray())

    assertThat(imageVector).isNotNull()
  }

  // ========== URI Loading Tests ==========

  @Test
  fun `should return empty result for null uri`() = runBlocking {
    val result = loader.loadFromUri(null)

    assertThat(result.imageVector).isNull()
    assertThat(result.drawable).isNull()
  }

  @Test
  fun `should return empty result for empty uri`() = runBlocking {
    val result = loader.loadFromUri("")

    assertThat(result.imageVector).isNull()
    assertThat(result.drawable).isNull()
  }

  @Test
  fun `should load xml from http url`() = runBlocking {
    val xml = """
      <vector xmlns:android="http://schemas.android.com/apk/res/android"
          android:width="24dp"
          android:height="24dp"
          android:viewportWidth="24"
          android:viewportHeight="24">
        <path android:fillColor="#000000" android:pathData="M0,0L24,24"/>
      </vector>
    """.trimIndent()

    mockWebServer.enqueue(MockResponse().setBody(xml).setResponseCode(200))

    val result = loader.loadFromUri(mockWebServer.url("/icon.xml").toString())

    assertThat(result.imageVector).isNotNull()
    assertThat(result.drawable).isNull()
  }

  @Test
  fun `should handle http download failure`() = runBlocking {
    mockWebServer.enqueue(MockResponse().setResponseCode(404))

    val result = loader.loadFromUri(mockWebServer.url("/notfound.xml").toString())

    assertThat(result.imageVector).isNull()
    assertThat(result.drawable).isNull()
  }

  @Test
  fun `should handle http server error`() = runBlocking {
    mockWebServer.enqueue(MockResponse().setResponseCode(500))

    val result = loader.loadFromUri(mockWebServer.url("/error.xml").toString())

    assertThat(result.imageVector).isNull()
    assertThat(result.drawable).isNull()
  }

  // ========== XML Detection Tests ==========

  @Test
  fun `should detect xml content`() {
    val xmlBytes = "<?xml version=\"1.0\"?><vector></vector>".toByteArray()
    val loader = VectorIconLoader(context, okHttpClient)

    // Use reflection to access private method for testing
    val method = VectorIconLoader::class.java.getDeclaredMethod("isXmlContent", ByteArray::class.java)
    method.isAccessible = true

    val result = method.invoke(loader, xmlBytes) as Boolean

    assertThat(result).isTrue()
  }

  @Test
  fun `should detect xml with bom`() {
    val bom = byteArrayOf(0xEF.toByte(), 0xBB.toByte(), 0xBF.toByte())
    val xmlContent = "<vector></vector>".toByteArray()
    val xmlBytes = bom + xmlContent

    val method = VectorIconLoader::class.java.getDeclaredMethod("isXmlContent", ByteArray::class.java)
    method.isAccessible = true

    val result = method.invoke(loader, xmlBytes) as Boolean

    assertThat(result).isTrue()
  }

  @Test
  fun `should not detect non-xml content`() {
    val pngHeader = byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)

    val method = VectorIconLoader::class.java.getDeclaredMethod("isXmlContent", ByteArray::class.java)
    method.isAccessible = true

    val result = method.invoke(loader, pngHeader) as Boolean

    assertThat(result).isFalse()
  }

  @Test
  fun `should handle very small byte arrays`() {
    val tinyBytes = byteArrayOf(0x01, 0x02)

    val method = VectorIconLoader::class.java.getDeclaredMethod("isXmlContent", ByteArray::class.java)
    method.isAccessible = true

    val result = method.invoke(loader, tinyBytes) as Boolean

    assertThat(result).isFalse()
  }

  // ========== Color Parsing Tests ==========

  @Test
  fun `should parse hex colors`() {
    val xml = """
      <vector xmlns:android="http://schemas.android.com/apk/res/android"
          android:width="24dp"
          android:height="24dp"
          android:viewportWidth="24"
          android:viewportHeight="24">
        <path android:fillColor="#FF0000" android:pathData="M0,0L24,24"/>
        <path android:fillColor="#00FF00" android:pathData="M0,0L24,24"/>
        <path android:fillColor="#0000FF" android:pathData="M0,0L24,24"/>
      </vector>
    """.trimIndent()

    val imageVector = loader.parseXmlToImageVector(xml.toByteArray())

    assertThat(imageVector).isNotNull()
  }

  @Test
  fun `should handle theme color attributes`() {
    val xml = """
      <vector xmlns:android="http://schemas.android.com/apk/res/android"
          android:width="24dp"
          android:height="24dp"
          android:viewportWidth="24"
          android:viewportHeight="24">
        <path android:fillColor="?attr/colorControlNormal" android:pathData="M0,0L24,24"/>
      </vector>
    """.trimIndent()

    val imageVector = loader.parseXmlToImageVector(xml.toByteArray())

    assertThat(imageVector).isNotNull()
  }

  // ========== Integration Tests ==========

  @Test
  fun `should handle complete material symbol workflow`() = runBlocking {
    val materialSymbolXml = """
      <vector xmlns:android="http://schemas.android.com/apk/res/android"
          android:width="24dp"
          android:height="24dp"
          android:viewportWidth="960"
          android:viewportHeight="960"
          android:tint="?attr/colorControlNormal">
        <path
            android:fillColor="@android:color/white"
            android:pathData="M480,880L80,480L480,80L880,480L480,880ZM480,784L784,480L480,176L176,480L480,784Z"/>
      </vector>
    """.trimIndent()

    mockWebServer.enqueue(MockResponse().setBody(materialSymbolXml).setResponseCode(200))

    val result = loader.loadFromUri(mockWebServer.url("/symbol.xml").toString())

    assertThat(result.imageVector).isNotNull()
    assertThat(result.imageVector!!.defaultWidth.value).isWithin(0.01f).of(24f)
    assertThat(result.imageVector.viewportWidth).isWithin(0.01f).of(960f)
  }
}

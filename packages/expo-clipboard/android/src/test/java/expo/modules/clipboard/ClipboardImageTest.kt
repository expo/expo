package expo.modules.clipboard

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.util.Base64
import androidx.test.core.app.ApplicationProvider
import io.mockk.clearAllMocks
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.verify
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowBitmapFactory
import java.io.ByteArrayInputStream

/**
 * Base64-encoded PNG data - it's a 1x1 image (a black pixel), 8 bit depth
 * the data has length of 68 bytes after decoding
 */
const val IMG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

const val PNG_PREFIX = "iVBORw0KGgo"
const val JPG_PREFIX = "/9j/"

@RunWith(RobolectricTestRunner::class)
class ClipboardImageTest {
  @Rule
  @JvmField
  val tempFolder = TemporaryFolder()

  @After
  fun tearDown() {
    clearAllMocks()
  }

  @Test
  fun `clipDataFromBase64Image should create a file and return its uri`() = runBlocking {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val expectedUri = Uri.parse("content:/image")
    val clipboardTmpDir = tempFolder.newFolder()

    mockkObject(ClipboardFileProvider)
    every { ClipboardFileProvider.getUriForFile(any(), any(), any()) } returns expectedUri

    val clip = clipDataFromBase64Image(context, IMG_BASE64, clipboardTmpDir)

    verify {
      ClipboardFileProvider.getUriForFile(
        context,
        any(),
        match {
          it.isFile && it.parentFile == clipboardTmpDir
        }
      )
    }
    assertEquals(expectedUri, clip.getItemAt(0).uri)
  }

  @Test
  fun `imageFromContentUri should compress bitmap`() = runBlocking {
    val bitmap = mockk<Bitmap>(relaxed = true)
    val uri = mockk<Uri>(relaxed = true)
    val options = GetImageOptions().apply { jpegQuality = 0.42 }

    mockkStatic(::bitmapFromContentUriAsync)
    coEvery { bitmapFromContentUriAsync(any(), any()) } returns bitmap

    imageFromContentUri(ApplicationProvider.getApplicationContext(), uri, options)

    verify {
      bitmap.compress(options.imageFormat.compressFormat, 42, any())
    }
  }

  @Test
  fun `imageFromContentUri should return the bitmap data`() = runBlocking {
    val bitmap = bitmapFromBase64String(IMG_BASE64)
    val uri = mockk<Uri>(relaxed = true)
    val options = GetImageOptions().apply { imageFormat = ImageFormat.PNG }

    mockkStatic(::bitmapFromContentUriAsync)
    coEvery { bitmapFromContentUriAsync(any(), any()) } returns bitmap

    val result = imageFromContentUri(ApplicationProvider.getApplicationContext(), uri, options)

    assertTrue(result.base64Image.startsWith("data:image/png;base64,$PNG_PREFIX"))
  }

  @Test
  fun `bitmapFromBase64String gets correct bitmap`() {
    val bitmap = bitmapFromBase64String(IMG_BASE64)
    assertBitmapMatchesMock(bitmap)
  }

  @Test(expected = InvalidImageException::class)
  fun `bitmapFromBase64String throws when not a base64`() {
    val bitmap = bitmapFromBase64String("invalid bitmap")
  }

  @Test
  @Config(sdk = [27])
  fun `bitmapFromContentUriAsync should return bitmap on API 27 and older`() = runBlocking {
    val uri = Uri.parse("content:/path27")
    val context = ApplicationProvider.getApplicationContext<Context>()

    // old MediaStore images API uses BitmapFactory directly, so we can control the mock this way
    ShadowBitmapFactory.provideWidthAndHeightHints(uri, 123, 456)

    val bitmap = bitmapFromContentUriAsync(context, uri)
    val shadow = shadowOf(bitmap)
    assertEquals("Bitmap for content:/path27", shadow.description)
    assertEquals(123, bitmap.width)
    assertEquals(456, bitmap.height)
  }

  @Test
  @Config(sdk = [28])
  fun `bitmapFromContentUriAsync should return bitmap on API 28+`() = runBlocking {
    val uri = Uri.parse("content:/path")
    val context = ApplicationProvider.getApplicationContext<Context>()
    val shadowContentResolver = shadowOf(context.contentResolver)

    // on API 28, the ImageDecoder decodes bitmap from the content resolver input stream
    val bytes = IMG_BASE64.let { Base64.decode(it, Base64.DEFAULT) }
    shadowContentResolver.registerInputStream(uri, ByteArrayInputStream(bytes))

    val bitmap = bitmapFromContentUriAsync(context, uri)
    val shadow = shadowOf(bitmap)
    assertNotNull(
      "Bitmap was not created from ContentResolver stream",
      shadow.createdFromStream
    )
    assertBitmapMatchesMock(bitmap)
  }
}

private fun assertBitmapMatchesMock(bitmap: Bitmap) {
  val message = "Bitmap doesn't match the mocked data"
  assertEquals("$message: Invalid width", 1, bitmap.width)
  assertEquals("$message: Invalid height", 1, bitmap.height)

  // Note that on some tests, the pixel value will be -16777216, which is
  // 11111111 00000000 00000000 00000000 in binary form. This is also a fully-opaque
  // black color, so comparing hex strings is cleaner to capture both acceptable results
  // (0 and -16777216).
  assertEquals(
    "$message: Incorrect pixel color. Expected black",
    Integer.toHexString(bitmap.getPixel(0, 0)),
    Integer.toHexString(Color.BLACK)
  )
}

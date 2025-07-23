package expo.modules.asset

import android.content.Context
import android.content.res.Resources
import expo.modules.core.errors.InvalidArgumentException
import io.mockk.MockKAnnotations
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.unmockkAll
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.ByteArrayInputStream
import java.io.InputStream

@RunWith(RobolectricTestRunner::class)
class ResourceAssetTest {
  @MockK
  lateinit var mockContext: Context

  @MockK
  lateinit var mockResources: Resources

  private val packageName = "com.example"

  @Before
  fun setUp() {
    MockKAnnotations.init(this)
    every { mockContext.packageName } returns "com.example"
    every { mockContext.resources } returns mockResources
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  // region openAssetResourceStream

  @Test
  fun `openAndroidResStream should return InputStream when valid drawable resource path is provided`() {
    val validResourcePath = "file:///android_res/drawable/test_asset.png"
    val resId = 2000
    val dummyStream: InputStream = ByteArrayInputStream("android".toByteArray())

    every { mockResources.getIdentifier("test_asset", "drawable", packageName) } returns resId
    every { mockResources.openRawResource(resId) } returns dummyStream

    val result = openAndroidResStream(mockContext, validResourcePath)
    assertNotNull(result)
    assertEquals(dummyStream, result)
  }

  fun `openAndroidResStream should return InputStream when valid drawable-xxhdpi resource path is provided`() {
    val validResourcePath = "file:///android_res/drawable-xxhdpi/test_asset.png"
    val resId = 2000
    val dummyStream: InputStream = ByteArrayInputStream("android".toByteArray())

    every { mockResources.getIdentifier("test_asset", "drawable", packageName) } returns resId
    every { mockResources.openRawResource(resId) } returns dummyStream

    val result = openAndroidResStream(mockContext, validResourcePath)
    assertNotNull(result)
    assertEquals(dummyStream, result)
  }

  @Test
  fun `openAndroidResStream should return InputStream when valid raw resource path is provided`() {
    val validResourcePath = "file:///android_res/raw/test_asset.ttf"
    val resId = 2000
    val dummyStream: InputStream = ByteArrayInputStream("android".toByteArray())

    every { mockResources.getIdentifier("test_asset", "raw", packageName) } returns resId
    every { mockResources.openRawResource(resId) } returns dummyStream

    val result = openAndroidResStream(mockContext, validResourcePath)
    assertNotNull(result)
    assertEquals(dummyStream, result)
  }

  @Test
  fun `openAssetResourceStream should return InputStream when resource is found in raw`() {
    val assetName = "test_asset"
    val resId = 1000
    val dummyStream: InputStream = ByteArrayInputStream("dummy".toByteArray())

    every { mockResources.getIdentifier(assetName, "raw", packageName) } returns resId
    every { mockResources.openRawResource(resId) } returns dummyStream

    val result = openAssetResourceStream(mockContext, assetName)
    assertNotNull(result)
    assertEquals(dummyStream, result)
  }

  @Test(expected = Resources.NotFoundException::class)
  fun `openAssetResourceStream should throw NotFoundException when resource not found`() {
    val assetName = "nonexistent"

    every { mockResources.getIdentifier(assetName, "raw", packageName) } returns 0
    every { mockResources.getIdentifier(assetName, "drawable", packageName) } returns 0

    openAssetResourceStream(mockContext, assetName)
  }

  // endregion openAssetResourceStream

  // region openAndroidResStream

  @Test(expected = InvalidArgumentException::class)
  fun `openAndroidResStream should throw exception when resource path has invalid prefix`() {
    openAndroidResStream(mockContext, "file:///invalid/test.ttf")
  }

  @Test(expected = InvalidArgumentException::class)
  fun `openAndroidResStream should throw exception when resource path has insufficient segments`() {
    openAndroidResStream(mockContext, "file:///invalid/test.ttf")
  }

  @Test(expected = Resources.NotFoundException::class)
  fun `openAndroidResStream should throw NotFoundException when resource not found`() {
    every { mockResources.getIdentifier("test", "raw", packageName) } returns 0

    val result = openAndroidResStream(mockContext, "file:///android_res/raw/test.ttf")
    assertNull("Expected null when the resource is not found", result)
  }

  // endregion openAndroidResStream
}

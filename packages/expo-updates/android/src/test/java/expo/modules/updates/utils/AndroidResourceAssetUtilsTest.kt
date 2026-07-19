package expo.modules.updates.utils

import android.content.Context
import android.content.res.AssetManager
import android.content.res.Resources
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.updates.db.entity.AssetEntity
import io.mockk.every
import io.mockk.mockk
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.ByteArrayInputStream

@RunWith(RobolectricTestRunner::class)
class AndroidResourceAssetUtilsTest {
  private val context: Context = ApplicationProvider.getApplicationContext()

  @Test
  fun `createEmbeddedFilenameForAsset should return asset URL when embeddedAssetFilename is provided`() {
    val asset = AssetEntity("key", null)
    asset.embeddedAssetFilename = "index.android.bundle"
    val result = AndroidResourceAssetUtils.createEmbeddedFilenameForAsset(asset)
    Truth.assertThat(result).isEqualTo("file:///android_asset/index.android.bundle")
  }

  @Test
  fun `createEmbeddedFilenameForAsset should return resource URL for drawable asset`() {
    val asset = AssetEntity("key", "png")
    asset.resourcesFolder = "drawable"
    asset.resourcesFilename = "test"
    asset.scales = arrayOf(1.0f, 2.0f)
    asset.scale = 2.0f
    val result = AndroidResourceAssetUtils.createEmbeddedFilenameForAsset(asset)
    Truth.assertThat(result).isEqualTo("file:///android_res/drawable-xhdpi/test.png")
  }

  @Test
  fun `createEmbeddedFilenameForAsset should return resource URL for raw asset`() {
    val asset = AssetEntity("key", "ttf")
    asset.resourcesFolder = "raw"
    asset.resourcesFilename = "test"
    val result = AndroidResourceAssetUtils.createEmbeddedFilenameForAsset(asset)
    Truth.assertThat(result).isEqualTo("file:///android_res/raw/test.ttf")
  }

  @Test
  fun `createEmbeddedFilenameForAsset should return null when neither asset nor resource details are provided`() {
    val asset = AssetEntity("key", "ttf")
    val result = AndroidResourceAssetUtils.createEmbeddedFilenameForAsset(asset)
    Truth.assertThat(result).isNull()
  }

  @Test
  fun `isAndroidResourceAsset should return true for android resource and asset URLs and false otherwise`() {
    val resourcePath = "file:///android_res/some/path"
    val assetPath = "file:///android_asset/someAsset"
    val nonResourcePath = "file:///some_other_path"

    Truth.assertThat(AndroidResourceAssetUtils.isAndroidResourceAsset(resourcePath)).isTrue()
    Truth.assertThat(AndroidResourceAssetUtils.isAndroidResourceAsset(assetPath)).isTrue()
    Truth.assertThat(AndroidResourceAssetUtils.isAndroidResourceAsset(nonResourcePath)).isFalse()
  }

  @Test
  fun `isAndroidAssetExisted should return true when asset exists`() {
    val assetName = "dummy_asset.txt"
    val mockContext = mockk<Context>()
    val mockAssetManager = mockk<AssetManager>()
    every { mockContext.assets } returns mockAssetManager
    every { mockAssetManager.open(assetName) } returns ByteArrayInputStream("dummy".toByteArray())

    val result = AndroidResourceAssetUtils.isAndroidAssetExisted(mockContext, assetName)
    Truth.assertThat(result).isTrue()
  }

  @Test
  fun `isAndroidAssetExisted should return false when asset does not exist`() {
    val assetName = "existing_asset.txt"
    Truth.assertThat(AndroidResourceAssetUtils.isAndroidAssetExisted(context, assetName)).isFalse()
  }

  @Test
  fun `isAndroidResourceExisted should return true for existing resource`() {
    val mockContext = mockk<Context>()
    val mockResources = mockk<Resources>()
    every { mockContext.resources } returns mockResources
    every { mockContext.packageName } returns "com.example.package"
    every { mockResources.getIdentifier(any(), any(), any()) } returns 123

    val result = AndroidResourceAssetUtils.isAndroidResourceExisted(
      mockContext,
      "drawable",
      "dummy_resource"
    )
    Truth.assertThat(result).isTrue()
  }

  @Test
  fun `isAndroidResourceExisted should return false for non-existent resource`() {
    val exists = AndroidResourceAssetUtils.isAndroidResourceExisted(
      context,
      "drawable",
      "non_existent_resource"
    )
    Truth.assertThat(exists).isFalse()
  }

  @Test
  fun `isAndroidAssetOrResourceExisted should return true for existing asset file path`() {
    val assetName = "dummy_asset.txt"
    val mockContext = mockk<Context>()
    val mockAssetManager = mockk<AssetManager>()
    every { mockContext.assets } returns mockAssetManager
    every { mockAssetManager.open(assetName) } returns ByteArrayInputStream("dummy".toByteArray())

    val filePath = "file:///android_asset/dummy_asset.txt"
    val result = AndroidResourceAssetUtils.isAndroidAssetOrResourceExisted(mockContext, filePath)
    Truth.assertThat(result).isTrue()
  }

  @Test
  fun `isAndroidAssetOrResourceExisted should return true for existing resource file path`() {
    val mockContext = mockk<Context>()
    val mockResources = mockk<Resources>()
    every { mockContext.resources } returns mockResources
    every { mockContext.packageName } returns "com.example.package"
    every { mockResources.getIdentifier(any(), any(), any()) } returns 123

    val filePath = "file:///android_res/drawable/dummy_resource.png"
    val result = AndroidResourceAssetUtils.isAndroidAssetOrResourceExisted(mockContext, filePath)
    Truth.assertThat(result).isTrue()
  }

  @Test
  fun `isAndroidAssetOrResourceExisted should return false for unrecognized file path`() {
    val filePath = "file:///some_other_path/something"
    val result = AndroidResourceAssetUtils.isAndroidAssetOrResourceExisted(context, filePath)
    Truth.assertThat(result).isFalse()
  }

  @Test
  fun `parseAndroidResponseAssetFromPath should correctly parse a valid resource URL`() {
    val filePath = "file:///android_res/drawable-xhdpi/ic_launcher.png"
    val (embeddedAssetFilename, resourcesFolder, resourceFilename) =
      AndroidResourceAssetUtils.parseAndroidResponseAssetFromPath(filePath)
    Truth.assertThat(embeddedAssetFilename).isNull()
    Truth.assertThat(resourcesFolder).isEqualTo("drawable")
    Truth.assertThat(resourceFilename).isEqualTo("ic_launcher")
  }

  @Test(expected = InvalidArgumentException::class)
  fun `parseAndroidResponseAssetFromPath should throw InvalidArgumentException for invalid resource path`() {
    val filePath = "file:///android_res/drawable"
    AndroidResourceAssetUtils.parseAndroidResponseAssetFromPath(filePath)
  }

  @Test
  fun `parseAndroidResponseAssetFromPath should correctly parse a valid asset URL`() {
    val filePath = "file:///android_asset/testAsset.png"
    val (embeddedAssetFilename, resourcesFolder, resourceFilename) =
      AndroidResourceAssetUtils.parseAndroidResponseAssetFromPath(filePath)
    Truth.assertThat(embeddedAssetFilename).isEqualTo("testAsset.png")
    Truth.assertThat(resourcesFolder).isNull()
    Truth.assertThat(resourceFilename).isNull()
  }

  @Test
  fun `parseAndroidResponseAssetFromPath should return nulls for classic file path`() {
    val filePath = "file:///data/test.txt"
    val (embeddedAssetFilename, resourcesFolder, resourceFilename) =
      AndroidResourceAssetUtils.parseAndroidResponseAssetFromPath(filePath)
    Truth.assertThat(embeddedAssetFilename).isNull()
    Truth.assertThat(resourcesFolder).isNull()
    Truth.assertThat(resourceFilename).isNull()
  }

  @Test
  fun `parseAndroidResponseAssetFromPath should return nulls for relative file path`() {
    val filePath = "./test.txt"
    val (embeddedAssetFilename, resourcesFolder, resourceFilename) =
      AndroidResourceAssetUtils.parseAndroidResponseAssetFromPath(filePath)
    Truth.assertThat(embeddedAssetFilename).isNull()
    Truth.assertThat(resourcesFolder).isNull()
    Truth.assertThat(resourceFilename).isNull()
  }
}

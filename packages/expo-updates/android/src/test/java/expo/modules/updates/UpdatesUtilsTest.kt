package expo.modules.updates

import expo.modules.updates.db.entity.AssetEntity
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.runners.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class UpdatesUtilsTest {
  @Test
  fun testCreateFilenameForAsset() {
    val assetEntity = AssetEntity("key", ".png")
    Assert.assertEquals("key.png", UpdatesUtils.createFilenameForAsset(assetEntity))
  }

  @Test
  fun testCreateFilenameForAssetWhenMissingDotPrefix() {
    val assetEntity = AssetEntity("key", "png")
    Assert.assertEquals("key.png", UpdatesUtils.createFilenameForAsset(assetEntity))
  }

  @Test
  fun testCreateFilenameForAssetWhenMissingExtension() {
    val assetEntity = AssetEntity("key", null)
    Assert.assertEquals("key", UpdatesUtils.createFilenameForAsset(assetEntity))
  }

  @Test
  fun testCreateFilenameForAsset_NullKey() {
    // asset filenames with null keys should be unique
    val asset1 = AssetEntity(null, "bundle")
    val asset2 = AssetEntity(null, "bundle")
    Assert.assertNotEquals(
      UpdatesUtils.createFilenameForAsset(asset1),
      UpdatesUtils.createFilenameForAsset(asset2)
    )
    val asset1Name = UpdatesUtils.createFilenameForAsset(asset1)
    Assert.assertEquals(asset1Name.substring(asset1Name.length - 7), ".bundle")
  }

  @Test
  fun testGetRuntimeVersion() {
    val sdkOnlyConfig = mockk<UpdatesConfiguration>()
    every { sdkOnlyConfig.sdkVersion } returns "38.0.0"
    every { sdkOnlyConfig.runtimeVersion } returns null
    Assert.assertEquals("38.0.0", UpdatesUtils.getRuntimeVersion(sdkOnlyConfig))
    val runtimeOnlyConfig = mockk<UpdatesConfiguration>()
    every { runtimeOnlyConfig.runtimeVersion } returns "1.0"
    every { runtimeOnlyConfig.sdkVersion } returns null
    Assert.assertEquals("1.0", UpdatesUtils.getRuntimeVersion(runtimeOnlyConfig))

    // should prefer runtimeVersion over sdkVersion if both are specified
    val bothConfig = mockk<UpdatesConfiguration>()
    every { bothConfig.sdkVersion } returns "38.0.0"
    every { bothConfig.runtimeVersion } returns "1.0"
    Assert.assertEquals("1.0", UpdatesUtils.getRuntimeVersion(bothConfig))
  }

  @Test
  fun testGetRuntimeVersion_neitherDefined() {
    val neitherConfig = mockk<UpdatesConfiguration>()
    every { neitherConfig.sdkVersion } returns null
    every { neitherConfig.runtimeVersion } returns null
    Assert.assertEquals("1", UpdatesUtils.getRuntimeVersion(neitherConfig))
  }
}

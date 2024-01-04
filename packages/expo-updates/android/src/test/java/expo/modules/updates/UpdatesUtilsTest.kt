package expo.modules.updates

import expo.modules.updates.db.entity.AssetEntity
import io.mockk.mockk
import junit.framework.TestCase
import org.junit.Assert
import org.junit.Test

class UpdatesUtilsTest : TestCase() {
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
    val baseConfig = UpdatesConfiguration(
      expectsSignedManifest = true,
      scopeKey = "wat",
      updateUrl = mockk(),
      runtimeVersionRaw = "1.0",
      launchWaitMs = 0,
      checkOnLaunch = UpdatesConfiguration.CheckAutomaticallyConfiguration.ALWAYS,
      hasEmbeddedUpdate = true,
      requestHeaders = mapOf(),
      codeSigningCertificate = null,
      codeSigningMetadata = null,
      codeSigningIncludeManifestResponseCertificateChain = true,
      codeSigningAllowUnsignedManifests = true,
      enableExpoUpdatesProtocolV0CompatibilityMode = true
    )

    val runtimeOnlyConfig = baseConfig.copy()
    Assert.assertEquals("1.0", runtimeOnlyConfig.getRuntimeVersion())

    val noRuntimeConfig = baseConfig.copy(runtimeVersionRaw = null)
    val exception = Assert.assertThrows(Exception::class.java) {
      noRuntimeConfig.getRuntimeVersion()
    }
    Assert.assertEquals(exception.message, "No runtime version provided in configuration")
  }
}

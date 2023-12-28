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
      sdkVersion = "38.0.0",
      runtimeVersionRaw = "1.0",
      releaseChannel = "default",
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

    val sdkOnlyConfig = baseConfig.copy(runtimeVersionRaw = null)
    Assert.assertEquals("38.0.0", sdkOnlyConfig.getRuntimeVersion())

    val runtimeOnlyConfig = baseConfig.copy(sdkVersion = null)
    Assert.assertEquals("1.0", runtimeOnlyConfig.getRuntimeVersion())

    // should prefer runtimeVersion over sdkVersion if both are specified
    Assert.assertEquals("1.0", baseConfig.getRuntimeVersion())
  }
}

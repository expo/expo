package expo.modules.updates

import expo.modules.updates.UpdatesUtils.parseContentDispositionNameParameter
import expo.modules.updates.db.entity.AssetEntity
import io.mockk.mockk
import junit.framework.TestCase
import org.junit.Assert

class UpdatesUtilsTest : TestCase() {
  fun testCreateFilenameForAsset() {
    val assetEntity = AssetEntity("key", ".png")
    Assert.assertEquals("key.png", UpdatesUtils.createFilenameForAsset(assetEntity))
  }

  fun testCreateFilenameForAssetWhenMissingDotPrefix() {
    val assetEntity = AssetEntity("key", "png")
    Assert.assertEquals("key.png", UpdatesUtils.createFilenameForAsset(assetEntity))
  }

  fun testCreateFilenameForAssetWhenMissingExtension() {
    val assetEntity = AssetEntity("key", null)
    Assert.assertEquals("key", UpdatesUtils.createFilenameForAsset(assetEntity))
  }

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

  fun testGetRuntimeVersion() {
    val baseConfig = UpdatesConfiguration(
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

  fun testParseContentDisposition() {
    val expected = mapOf(
      "form-data; name=\"hello\"" to "hello",
      "form-data; name=hello" to "hello",

      // from apache.commons.fileupload2.core.ParameterParserTest
      "text/plain; Charset=UTF-8" to null,
      "test; test1 =  stuff   ; test2 =  \"stuff; stuff\"; test3=\"stuff\"; name=wat" to "wat",
      "test; test1 =  stuff   ;name=wat; test2 =  \"stuff; stuff\"; test3=\"stuff\"" to "wat",

      // others
      " form-data; name=\"field_value\"; filename=\"file_name.html\"" to "field_value",
      " form-data; filename=\"file_name.html\"; name=\"field_value\"" to "field_value",
      "text/plain;a=1;b=2;name=manifest-wat;c=3" to "manifest-wat",
      "Message/Partial; number=2; total=3; name=\"oc=abc@example.com\"" to "oc=abc@example.com",
      "multipart/mixed; name=2; name=3" to "2"
    )

    expected.forEach { (case, expectedName) ->
      Assert.assertEquals(expectedName, case.parseContentDispositionNameParameter())
    }
  }
}

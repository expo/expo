package expo.modules.updates

import expo.modules.updates.UpdatesUtils.parseContentDispositionNameParameter
import expo.modules.updates.db.entity.AssetEntity
import io.mockk.mockk
import junit.framework.TestCase
import org.junit.Assert
import java.io.File

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

  fun testIsSafeFilename() {
    val unsafe = listOf(
      "",
      ".",
      "..",
      "../pwned.png",
      "../../shared_prefs/pwned.xml",
      "nested/asset.png",
      "nested\\asset.png",
      "/etc/passwd",
      "asset\u0000.png",
      // A separator followed by a combining mark. Kotlin compares UTF-16 code units so this is
      // caught here, unlike Swift, where the two form one Character that does not equal "/".
      "..\u002F\u0338pwned.png"
    )
    unsafe.forEach {
      Assert.assertFalse("expected \"$it\" to be rejected", UpdatesUtils.isSafeFilename(it))
    }

    val safe = listOf(
      "696a70cf7035664c20ea86f67dae822b.bundle",
      "asset-1699999999-12345.png",
      "..hidden.png",
      "a..b.png"
    )
    safe.forEach {
      Assert.assertTrue("expected \"$it\" to be accepted", UpdatesUtils.isSafeFilename(it))
    }
  }

  fun testIsSafeFilename_rejectedNameEscapesItsDirectory() {
    val updatesDirectory = File("/data/data/com.example/files/.expo-internal")
    val filename = UpdatesUtils.createFilenameForAsset(AssetEntity("../../shared_prefs/pwned", "xml"))

    Assert.assertFalse(UpdatesUtils.isSafeFilename(filename))
    Assert.assertFalse(
      File(updatesDirectory, filename).canonicalPath
        .startsWith(updatesDirectory.canonicalPath + File.separator)
    )
  }

  fun testGetRuntimeVersion() {
    val baseConfig = UpdatesConfiguration(
      scopeKey = "wat",
      updateUrl = mockk(),
      originalEmbeddedUpdateUrl = mockk(),
      runtimeVersionRaw = "1.0",
      launchWaitMs = 0,
      checkOnLaunch = UpdatesConfiguration.CheckAutomaticallyConfiguration.ALWAYS,
      hasEmbeddedUpdate = true,
      originalHasEmbeddedUpdate = true,
      requestHeaders = mapOf(),
      originalEmbeddedRequestHeaders = mapOf(),
      codeSigningCertificate = null,
      codeSigningMetadata = null,
      codeSigningIncludeManifestResponseCertificateChain = true,
      codeSigningAllowUnsignedManifests = true,
      enableExpoUpdatesProtocolV0CompatibilityMode = true,
      disableAntiBrickingMeasures = false,
      hasUpdatesOverride = false,
      cachedOverrideMap = emptyMap()
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

  fun testBytesToHex_negativeByteInArray() {
    val hashString = "B04C4878AFAEDEADBEEFCAFEBABE0123456789ABCDEF0123456789ABCDEF0123"
    val hashBytes = hashString.chunked(2)
      .map { it.toInt(16).toByte() }
      .toByteArray()

    Assert.assertEquals(
      hashString,
      UpdatesUtils.bytesToHex(hashBytes)
    )
  }

  fun testBytesToHex_emptyArray() {
    val hashBytes = ByteArray(0)
    val expected = ""
    Assert.assertEquals(expected, UpdatesUtils.bytesToHex(hashBytes))
  }

  fun testBytesToHex_positiveBytesOnly() {
    // All bytes are in the range 0x00 to 0x7F (positive when interpreted as signed bytes)
    val hashString = "0123456789ABCDEF"
    val hashBytes = hashString.chunked(2)
      .map { it.toInt(16).toByte() }
      .toByteArray()

    Assert.assertEquals(hashString, UpdatesUtils.bytesToHex(hashBytes))
  }
}

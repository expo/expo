package expo.modules.manifests.core

import org.json.JSONObject
import org.junit.Assert
import org.junit.Test

class NewManifestTest {
  @Test
  @Throws(Exception::class)
  fun testGetSDKVersionNullable_ValidCases() {
    val runtimeVersion = "exposdk:39.0.0"
    val manifestJson =
      "{\"runtimeVersion\":\"$runtimeVersion\"}"
    val manifest = NewManifest(JSONObject(manifestJson))
    Assert.assertEquals(manifest.getExpoGoSDKVersion(), "39.0.0")
  }

  @Test
  @Throws(Exception::class)
  fun testGetSDKVersionNullable_ValidCaseUnversioned() {
    val runtimeVersion = "exposdk:UNVERSIONED"
    val manifestJson =
      "{\"runtimeVersion\":\"$runtimeVersion\"}"
    val manifest = NewManifest(JSONObject(manifestJson))
    Assert.assertEquals(manifest.getExpoGoSDKVersion(), "UNVERSIONED")
  }

  @Test
  @Throws(Exception::class)
  fun testGetSDKVersionNullable_NotSDKRuntimeVersionCases() {
    val runtimeVersions = listOf(
      "exposdk:123",
      "exposdkd:39.0.0",
      "exposdk:hello",
      "bexposdk:39.0.0",
      "exposdk:39.0.0-beta.0",
      "exposdk:39.0.0-alpha.256"
    )
    runtimeVersions.forEach { runtimeVersion ->
      val manifestJson =
        "{\"runtimeVersion\":\"$runtimeVersion\"}"
      val manifest = NewManifest(JSONObject(manifestJson))
      Assert.assertNull(manifest.getExpoGoSDKVersion())
    }
  }
}

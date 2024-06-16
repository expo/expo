package expo.modules.manifests.core

import org.json.JSONObject
import org.junit.Assert
import org.junit.Test

class ExpoUpdatesManifestTest {
  @Test
  @Throws(Exception::class)
  fun testGetSDKVersionNullable_ValidCases() {
    val manifestJson =
      "{\"extra\":{\"expoClient\":{\"sdkVersion\":\"39.0.0\"}}}"
    val manifest = ExpoUpdatesManifest(JSONObject(manifestJson))
    Assert.assertEquals(manifest.getExpoGoSDKVersion(), "39.0.0")
  }

  @Test
  @Throws(Exception::class)
  fun testGetSDKVersionNullable_ValidCaseUnversioned() {
    val manifestJson =
      "{\"extra\":{\"expoClient\":{\"sdkVersion\":\"UNVERSIONED\"}}}"
    val manifest = ExpoUpdatesManifest(JSONObject(manifestJson))
    Assert.assertEquals(manifest.getExpoGoSDKVersion(), "UNVERSIONED")
  }
}

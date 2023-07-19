// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.manifests.core

import com.google.common.truth.Truth
import org.json.JSONObject
import org.junit.Test

class ManifestTest {
  @Test
  fun getPluginProperties_emptyManifest_returnsNull() {
    val manifestJson = JSONObject("{}")
    val manifest = Manifest.fromManifestJson(manifestJson)
    Truth.assertThat(manifest.getPluginProperties("test")).isNull()
  }

  @Test
  fun getPluginProperties_emptyPlugins_returnsNull() {
    val manifestJson = JSONObject("{\"plugins\": []}")
    val manifest = Manifest.fromManifestJson(manifestJson)
    Truth.assertThat(manifest.getPluginProperties("test")).isNull()
  }

  @Test
  fun getPluginProperties_nonMatchedPlugins_returnsNull() {
    val manifestJson = JSONObject("{\"plugins\": [\"hello\"]}")
    val manifest = Manifest.fromManifestJson(manifestJson)
    Truth.assertThat(manifest.getPluginProperties("test")).isNull()
  }

  @Test
  fun getPluginProperties_matchedPluginWithoutProps_returnsNull() {
    val manifestJson = JSONObject("{\"plugins\": [\"test\"]}")
    val manifest = Manifest.fromManifestJson(manifestJson)
    Truth.assertThat(manifest.getPluginProperties("test")).isNull()
  }

  @Test
  fun getPluginProperties_matchedPluginWithoutPropsAsNestedArray_returnsNull() {
    val manifestJson = JSONObject("{\"plugins\": [[\"test\"]]}")
    val manifest = Manifest.fromManifestJson(manifestJson)
    Truth.assertThat(manifest.getPluginProperties("test")).isNull()
  }

  @Test
  fun getPluginProperties_matchedPluginWithProps_returnsProps() {
    val props = mapOf<String, Any>("foo" to "bar")
    val manifestJson = JSONObject("{\"plugins\": [ [\"test\", {\"foo\":\"bar\"}] ]}")
    val manifest = Manifest.fromManifestJson(manifestJson)
    val result = manifest.getPluginProperties("test")
    Truth.assertThat(result).isNotNull()
    Truth.assertThat(result).containsExactlyEntriesIn(props)
  }

  @Test
  fun getPluginProperties_matchedPluginWithNestedProps_returnsNestedProps() {
    val props = mapOf<String, Any>("nested" to mapOf<String, Any>("insideNested" to true))
    val manifestJson = JSONObject("{\"plugins\":[[\"test\",{\"nested\":{\"insideNested\":true}}]]}")
    val manifest = Manifest.fromManifestJson(manifestJson)
    val result = manifest.getPluginProperties("test")
    Truth.assertThat(result).isNotNull()
    Truth.assertThat(result).containsExactlyEntriesIn(props)
  }
}

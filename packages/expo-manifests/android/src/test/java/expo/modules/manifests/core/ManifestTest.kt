// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.manifests.core

import com.google.common.truth.Truth
import org.json.JSONObject
import org.junit.Test

class ManifestTest {
  @Test
  fun getPluginProperties_emptyManifest_returnsNull() {
    val manifestJson = JSONObject(emptyMap<String, Any>())
    val manifest = Manifest.fromManifestJson(manifestJson)
    Truth.assertThat(manifest.getPluginProperties("test")).isNull()
  }

  @Test
  fun getPluginProperties_emptyPlugins_returnsNull() {
    val manifestJson = JSONObject(mapOf<String, Any>("plugins" to emptyArray<Any>()))
    val manifest = Manifest.fromManifestJson(manifestJson)
    Truth.assertThat(manifest.getPluginProperties("test")).isNull()
  }

  @Test
  fun getPluginProperties_nonMatchedPlugins_returnsNull() {
    val manifestJson = JSONObject(mapOf<String, Any>("plugins" to arrayOf("hello")))
    val manifest = Manifest.fromManifestJson(manifestJson)
    Truth.assertThat(manifest.getPluginProperties("test")).isNull()
  }

  @Test
  fun getPluginProperties_matchedPluginWithoutProps_returnsNull() {
    val manifestJson = JSONObject(mapOf<String, Any>("plugins" to arrayOf("test")))
    val manifest = Manifest.fromManifestJson(manifestJson)
    Truth.assertThat(manifest.getPluginProperties("test")).isNull()
  }

  @Test
  fun getPluginProperties_matchedPluginWithProps_returnsProps() {
    val props = mapOf<String, Any>("foo" to "bar")
    val pluginWithProp = arrayOf("test", props)
    val manifestJson = JSONObject(mapOf<String, Any>("plugins" to arrayOf(pluginWithProp)))
    val manifest = Manifest.fromManifestJson(manifestJson)
    val result = manifest.getPluginProperties("test")
    Truth.assertThat(result).isNotNull()
    Truth.assertThat(result).containsExactlyEntriesIn(props)
  }

  @Test
  fun getPluginProperties_matchedPluginWithNestedProps_returnsNestedProps() {
    val props = mapOf<String, Any>("nested" to mapOf<String, Any>("insideNested" to true))
    val pluginWithProp = arrayOf("test", props)
    val manifestJson = JSONObject(mapOf<String, Any>("plugins" to arrayOf(pluginWithProp)))
    val manifest = Manifest.fromManifestJson(manifestJson)
    val result = manifest.getPluginProperties("test")
    Truth.assertThat(result).isNotNull()
    Truth.assertThat(result).containsExactlyEntriesIn(props)
  }
}

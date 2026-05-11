@file:JvmName("BrownfieldSetupUtilsKt")

package expo.modules.plugin

import java.io.File
import javax.xml.parsers.DocumentBuilderFactory
import org.gradle.api.Project
import org.w3c.dom.Element

/**
 * Find the app project in the root project.
 *
 * @param project The project to find the app project in.
 * @return The app project.
 * @throws IllegalStateException if the app project is not found.
 */
internal fun findAppProject(project: Project): Project {
  return project.rootProject.subprojects.firstOrNull {
    it.plugins.hasPlugin("com.android.application")
  } ?: throw IllegalStateException("App project not found in the root project")
}

/**
 * Build a release-variant AndroidManifest.xml that forwards every
 * `expo.modules.updates.*` `<meta-data>` entry from the host app's
 * manifest into the brownfield library's release manifest, so AGP merges
 * them into the consumer's manifest.
 *
 * String resource references (`@string/foo`) are resolved against the host
 * app's `res/values/strings.xml`, because the brownfield AAR cannot share
 * those resources with the consumer.
 */
fun buildForwardedUpdatesManifest(appManifest: File, appStrings: File): String {
  val empty = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" />
"""
  if (!appManifest.exists()) return empty

  val factory = DocumentBuilderFactory.newInstance().apply { isNamespaceAware = false }
  val doc = factory.newDocumentBuilder().parse(appManifest)
  val metaNodes = doc.getElementsByTagName("meta-data")
  val strings = parseStringResources(appStrings)

  val entries = mutableListOf<Pair<String, String>>()
  for (i in 0 until metaNodes.length) {
    val el = metaNodes.item(i) as? Element ?: continue
    val name = el.getAttribute("android:name")
    if (name.isNullOrEmpty() || !name.startsWith("expo.modules.updates.")) continue
    val rawValue = el.getAttribute("android:value") ?: ""
    val resolved = resolveResourceReference(rawValue, strings)
    entries.add(name to resolved)
  }
  if (entries.isEmpty()) return empty

  return buildString {
    append("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n")
    append("<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\">\n")
    append("  <application>\n")
    entries.forEach { (name, value) ->
      append("    <meta-data android:name=\"")
      append(escapeXmlAttribute(name))
      append("\" android:value=\"")
      append(escapeXmlAttribute(value))
      append("\" />\n")
    }
    append("  </application>\n")
    append("</manifest>\n")
  }
}

private fun parseStringResources(file: File): Map<String, String> {
  if (!file.exists()) return emptyMap()
  val factory = DocumentBuilderFactory.newInstance().apply { isNamespaceAware = false }
  val doc = factory.newDocumentBuilder().parse(file)
  val list = doc.getElementsByTagName("string")
  val result = mutableMapOf<String, String>()
  for (i in 0 until list.length) {
    val el = list.item(i) as? Element ?: continue
    val name = el.getAttribute("name") ?: continue
    if (name.isEmpty()) continue
    result[name] = el.textContent
  }
  return result
}

private fun resolveResourceReference(raw: String, strings: Map<String, String>): String {
  if (raw.startsWith("@string/")) {
    val key = raw.removePrefix("@string/")
    return strings[key] ?: raw
  }
  return raw
}

private fun escapeXmlAttribute(value: String): String =
  value.replace("&", "&amp;")
    .replace("<", "&lt;")
    .replace(">", "&gt;")
    .replace("\"", "&quot;")
    .replace("'", "&apos;")

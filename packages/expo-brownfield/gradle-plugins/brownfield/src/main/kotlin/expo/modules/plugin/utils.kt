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
 * Build a release-variant AndroidManifest.xml that forwards every `<application>`
 * `<meta-data>` entry from the expo app's manifest into the brownfield library's release
 * manifest, so AGP merges them into the consumer's manifest at AAR consumption time.
 *
 * This covers any expo library whose config plugin injects runtime configuration into
 * the expo app's AndroidManifest at `expo prebuild` time (expo-updates, expo-notifications,
 * etc.). Without forwarding, the brownfield library's runtime modules read empty meta-data
 * and silently disable themselves.
 *
 * Value forms supported:
 *   - Literal `android:value="..."` (preserved as-is).
 *   - String resource refs `android:value="@string/foo"` are resolved against the expo
 *     app's `res/values/strings.xml` and inlined. The brownfield AAR cannot share those
 *     strings with the consumer because resources are not currently forwarded.
 *   - `android:resource="@drawable/foo"` (or any other resource ref) is preserved as a
 *     `resource` attribute. Note: for the consumer to actually resolve it, the referenced
 *     resource needs to ship in the brownfield AAR (drawable, color, etc.).
 */
fun buildForwardedApplicationManifest(appManifest: File, appStrings: File): String {
  val empty = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" />
"""
  if (!appManifest.exists()) return empty

  val factory = DocumentBuilderFactory.newInstance().apply { isNamespaceAware = false }
  val doc = factory.newDocumentBuilder().parse(appManifest)
  val applicationNodes = doc.getElementsByTagName("application")
  if (applicationNodes.length == 0) return empty
  val applicationEl = applicationNodes.item(0) as? Element ?: return empty

  val strings = parseStringResources(appStrings)
  val children = applicationEl.childNodes

  data class MetaEntry(val name: String, val attr: String, val value: String)
  val entries = mutableListOf<MetaEntry>()
  for (i in 0 until children.length) {
    val el = children.item(i) as? Element ?: continue
    if (el.tagName != "meta-data") continue
    val name = el.getAttribute("android:name")
    if (name.isNullOrEmpty()) continue
    val literalValue = el.getAttribute("android:value")
    val resourceRef = el.getAttribute("android:resource")
    when {
      !literalValue.isNullOrEmpty() ->
        entries.add(MetaEntry(name, "android:value", resolveResourceReference(literalValue, strings)))
      !resourceRef.isNullOrEmpty() ->
        entries.add(MetaEntry(name, "android:resource", resourceRef))
    }
  }
  if (entries.isEmpty()) return empty

  return buildString {
    append("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n")
    append("<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\">\n")
    append("  <application>\n")
    entries.forEach { entry ->
      append("    <meta-data android:name=\"")
      append(escapeXmlAttribute(entry.name))
      append("\" ")
      append(entry.attr)
      append("=\"")
      append(escapeXmlAttribute(entry.value))
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

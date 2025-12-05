package expo.modules.plugin

import org.gradle.internal.cc.base.logger
import java.io.File
import javax.xml.parsers.DocumentBuilderFactory

/**
 * Based on a map of `String` and `PermissionInfo` read and parse manifest files, finds cases where
 * a permission is defined in one place with `android:maxSdkVersion` and in another without that annotation.
 *
 * @param problematicPermissions A Map of `String` and `PermissionInfo` obtained with analyzeManifestReport
 */
internal fun findPermissionsToOverride(problematicPermissions: Map<String, PermissionInfo>): Map<String, PermissionInfo> {
  val factory = DocumentBuilderFactory.newInstance()
  factory.isNamespaceAware = true

  // Basic security
  factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true) // Disallow parsing <!DOCTYPE> files
  factory.setFeature("http://xml.org/sax/features/external-general-entities", false) // Prevent external general entities
  factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false) // Prevent external paramater entities

  val builder = factory.newDocumentBuilder()
  val brokenPermissions = mutableMapOf<String, PermissionInfo>()

  problematicPermissions.forEach { permission, info ->
    // Not actually a problematic permission
    if (info.maxSdkSources.size == 0) {
      return@forEach
    }

    info.manifestPaths.forEach { manifestPath ->
      try {
        val file = File(manifestPath)
        if (!file.exists() || !file.canRead()) {
          logger.error("Failed to open manifest file at: $manifestPath")
          return@forEach
        }

        val doc = builder.parse(file)
        val permissionNodes = doc.getElementsByTagName("uses-permission")

        for (i in 0 until permissionNodes.length) {
          val permissionNode = permissionNodes.item(i)

          if (permissionNode.nodeType == org.w3c.dom.Node.ELEMENT_NODE) {
            val element = permissionNode as org.w3c.dom.Element
            val permissionName = element.getAttribute("android:name")

            if (permissionName == permission && !element.hasAttribute("android:maxSdkVersion")) {
              brokenPermissions[permission] = info
              return@forEach
            }
          }
        }
      } catch (e: Exception) {
        logger.error("Failed to parse manifest at ${manifestPath}", e)
      }
    }
  }

  return brokenPermissions
}

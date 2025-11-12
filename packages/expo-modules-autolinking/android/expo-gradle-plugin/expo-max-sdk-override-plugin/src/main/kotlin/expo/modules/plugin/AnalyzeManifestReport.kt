package expo.modules.plugin

import expo.modules.plugin.utils.extractPathFromLine

/**
 * Analyzes the manifest merge report content to find permissions that may be defined with android:maxSdkVersion,
 * where one AndroidManifest.xml defines the permission with the aforementioned annotation and another one without.
 *
 * This method should be used to reduce the search scope for `findPermissionsToOverride` method.
 *
 * @param reportContent The content of the manifest merge report to analyze.
 * @return A map of suspicious permission names to their corresponding PermissionInfo objects.
 */
internal fun analyzeManifestReport(reportContent: String): Map<String, PermissionInfo> {
  val allPermissionInfo = mutableMapOf<String, PermissionInfo>()
  var currentPermission: String? = null
  var lastAttributeWasMaxSdk = false

  for (line in reportContent.lines()) {
    val trimmedLine = line.trimStart()

    // This line starts a new permission definition
    if (line.startsWith("uses-permission#")) {
      currentPermission = line.substringAfter("uses-permission#").trim()
      allPermissionInfo.getOrPut(currentPermission) {
        PermissionInfo()
      }
      lastAttributeWasMaxSdk = false
    } else if (currentPermission != null) {
      when {
        line.startsWith("\tandroid:maxSdkVersion") -> {
          lastAttributeWasMaxSdk = true
        }

        // Source of maxSdkVersion annotation
        line.startsWith("\t") && (trimmedLine.startsWith("ADDED from") || trimmedLine.startsWith("MERGED from")) -> {
          if (lastAttributeWasMaxSdk) {
            extractPathFromLine(line)?.let { source ->
              allPermissionInfo[currentPermission]?.maxSdkSources?.add(source)
            }
          }
          lastAttributeWasMaxSdk = false
        }

        // Source of the permission definition
        !line.startsWith("\t") && (trimmedLine.startsWith("ADDED from") || trimmedLine.startsWith("MERGED from")) -> {
          extractPathFromLine(line)?.let { path ->
            allPermissionInfo[currentPermission]?.manifestPaths?.add(path)
          }
          lastAttributeWasMaxSdk = false
        }

        else -> {
          lastAttributeWasMaxSdk = false
        }
      }
    }
  }

  // Permissions which may have maxSdkConflicts, happen when there is more than one
  // source fora a permission and the permission is annotated with maxSdkVersion
  val problematicPermissions = allPermissionInfo.filter { (permission, info) ->
    val multipleDefinitions = info.manifestPaths.size > 1
    val maxSdkDefined = info.maxSdkSources.isNotEmpty()
    multipleDefinitions && maxSdkDefined
  }

  return problematicPermissions.toMap()
}

package expo.modules.plugin

import expo.modules.plugin.text.Colors
import expo.modules.plugin.text.withColor
import org.gradle.api.DefaultTask
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.OutputFile
import org.gradle.api.tasks.TaskAction
import java.io.File
import javax.xml.parsers.DocumentBuilderFactory
import javax.xml.transform.OutputKeys
import javax.xml.transform.TransformerFactory
import javax.xml.transform.dom.DOMSource
import javax.xml.transform.stream.StreamResult

/**
 * This task reads the manifest merge report, finds conflicting permissions, and removes 'android:maxSdkVersion' from them in the final merged manifest.
 */
abstract class FixManifestMaxSdkTask : DefaultTask() {
  @get:InputFile
  abstract val blameReportFile: RegularFileProperty

  @get:InputFile
  abstract val mergedManifestIn: RegularFileProperty

  @get:OutputFile
  abstract val modifiedManifestOut: RegularFileProperty

  @TaskAction
  fun taskAction() {
    val blameFile = blameReportFile.get().asFile
    val inManifest = mergedManifestIn.get().asFile
    val outManifest = modifiedManifestOut.get().asFile

    logger.quiet("---------- Expo Max Sdk Override Plugin ----------".withColor(Colors.YELLOW))

    if (!blameFile.exists()) {
      logger.warn("Manifest blame report not found: ${blameFile.absolutePath}. Skipping `android:maxSdkVersion` permission conflict check.")
      inManifest.copyTo(outManifest, overwrite = true)
      logNoChanges()
      return
    }

    val reportContents = blameFile.readText()
    val potentialProblems = analyzeManifestReport(reportContents)

    if (potentialProblems.isEmpty()) {
      inManifest.copyTo(outManifest, overwrite = true)
      logNoChanges()
      return
    }

    val brokenPermissions = findPermissionsToOverride(potentialProblems)

    if (brokenPermissions.isEmpty()) {
      inManifest.copyTo(outManifest, overwrite = true)
      logNoChanges()
      return
    }

    logger.quiet(">>> WARNING: Found ${brokenPermissions.size} permission(s) with conflicting 'android:maxSdkVersion' declarations.".withColor(Colors.YELLOW))
    brokenPermissions.forEach { (permission, info) ->
      val sourcesWithoutMaxSdk = info.manifestPaths.subtract(info.maxSdkSources)
      logger.quiet("    - $permission".withColor(Colors.YELLOW))
      logger.quiet("      > Defined WITH `android:maxSdkVersion` in: ${info.maxSdkSources.joinToString()}".withColor(Colors.YELLOW))
      logger.quiet("      > Defined WITHOUT `android:maxSdkVersion` in: ${sourcesWithoutMaxSdk.joinToString()}".withColor(Colors.YELLOW))
    }
    logger.quiet(">>> Removing 'android:maxSdkVersion' from these permissions in the final manifest to prevent runtime issues.".withColor(Colors.YELLOW))

    tryFixManifest(inManifest, outManifest, brokenPermissions)

    logger.quiet("--------------------------------------------------".withColor(Colors.YELLOW))
  }

  private fun logNoChanges() {
    logger.quiet(">>> No 'android:maxSdkVersion' conflicts found".withColor(Colors.GREEN))
    logger.quiet("--------------------------------------------------".withColor(Colors.YELLOW))
  }

  private fun tryFixManifest(inManifest: File, outManifest: File, brokenPermissions: Map<String, PermissionInfo>) {
    try {
      val factory = DocumentBuilderFactory.newInstance()
      factory.isNamespaceAware = true
      val builder = factory.newDocumentBuilder()

      val doc = builder.parse(inManifest)
      val permissionNodes = doc.getElementsByTagName(ManifestConstants.USES_PERMISSION_TAG)
      var modificationsMade = 0

      val nodesToProcess = (0 until permissionNodes.length)
        .map { permissionNodes.item(it) }
        .filterIsInstance<org.w3c.dom.Element>()

      for (element in nodesToProcess) {
        val permissionName = element.getAttribute(ManifestConstants.ANDROID_NAME_ATTRIBUTE)

        if (brokenPermissions.containsKey(permissionName) && element.hasAttribute(ManifestConstants.ANDROID_MAX_SDK_VERSION_ATTRIBUTE)) {
          element.removeAttribute(ManifestConstants.ANDROID_MAX_SDK_VERSION_ATTRIBUTE)
          modificationsMade++
        }
      }

      if (modificationsMade > 0) {
        logger.quiet(">>> Removed 'android:maxSdkVersion' from $modificationsMade instance(s) in the final manifest.".withColor(Colors.YELLOW))
      }

      TransformerFactory.newInstance().newTransformer().apply {
        setOutputProperty(OutputKeys.INDENT, "yes")
        setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "4")
        setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "no")
        setOutputProperty(OutputKeys.ENCODING, "UTF-8")
        transform(DOMSource(doc), StreamResult(outManifest))
      }
    } catch (e: Exception) {
      logger.error("Failed to parse and fix merged manifest: ${e.message}".withColor(Colors.RESET), e)
      logger.quiet(">>> Restored the original merged manifest.".withColor(Colors.YELLOW))

      inManifest.copyTo(outManifest, overwrite = true)
    }
  }
}

private object ManifestConstants {
  const val USES_PERMISSION_TAG = "uses-permission"
  const val ANDROID_NAME_ATTRIBUTE = "android:name"
  const val ANDROID_MAX_SDK_VERSION_ATTRIBUTE = "android:maxSdkVersion"
}

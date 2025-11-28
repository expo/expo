package expo.modules.plugin

import com.android.build.api.artifact.SingleArtifact
import org.gradle.api.Plugin
import org.gradle.api.Project
import com.android.build.api.variant.ApplicationAndroidComponentsExtension
import expo.modules.plugin.text.Colors
import expo.modules.plugin.text.Emojis
import expo.modules.plugin.text.withColor
import org.gradle.internal.cc.base.logger

/**
 * Plugin, which registers ExpoMaxSdkOverrideTask and schedules it to run with `app:processDebugManifest`.
 *
 * The task finds all permissions declared with `android:maxSdkVersion`. If the permission was declared in more than one place, and one of the places
 * defines the task without `android:maxSdkVersion` the task will remove the `android:maxSdkVersion` from the final merged manifest
 */
class ExpoMaxSdkOverridePlugin : Plugin<Project> {
  override fun apply(project: Project) {
    val androidComponents = project.extensions.getByType(ApplicationAndroidComponentsExtension::class.java)
    logger.quiet(" ${Emojis.INFORMATION}  ${"Applying gradle plugin".withColor(Colors.YELLOW)} '${"expo-max-sdk-override-plugin".withColor(Colors.GREEN)}'")
    logger.quiet("  [expo-max-sdk-override-plugin] This plugin will find all permissions declared with `android:maxSdkVersion`. If there exists a declaration with the `android:maxSdkVersion` annotation and another one without, the plugin will remove the annotation from the final merged manifest. In order to see a log with the changes run a clean build of the app.")

    androidComponents.onVariants(androidComponents.selector().all()) { variant ->
      val taskName = "expo${variant.name.replaceFirstChar { it.uppercase() }}OverrideMaxSdkConflicts"
      val blameReportPath = "outputs/logs/manifest-merger-${variant.name}-report.txt"
      val reportFile = project.layout.buildDirectory.file(blameReportPath)
      val fixTaskProvider = project.tasks.register(
        taskName,
        FixManifestMaxSdkTask::class.java
      ) { task ->
        task.blameReportFile.set(reportFile)
      }

      variant.artifacts
        .use(fixTaskProvider)
        .wiredWithFiles(
          FixManifestMaxSdkTask::mergedManifestIn,
          FixManifestMaxSdkTask::modifiedManifestOut
        )
        .toTransform(SingleArtifact.MERGED_MANIFEST)
    }
  }
}

// Single fat AAR that merges every autolinked Expo Android module + the brownfield
// library's own classes/resources/jni into one publishable artifact via AGP's
// `com.android.fused-library` plugin (Preview in AGP 9.0+).
//
// Built only when the user opts in via `expo-brownfield build:android --fused`,
// which routes Gradle to `:${{libraryName}}-fused:publishBrownfieldReleasePublicationTo...`
// and passes `-Pbrownfield.fused=true` so the publish plugin's per-module re-publish
// loop is skipped (everything is already inside this AAR).
//
// `android.experimental.fusedLibrarySupport.publicationOnly=false` in gradle.properties
// lets `include(project(...))` resolve sibling Gradle subprojects directly without
// first publishing them to mavenLocal.

plugins {
  id("com.android.fused-library")
  id("maven-publish")
}

group = "${{groupId}}"

version = "${{version}}"

androidFusedLibrary {
  namespace = "${{packageId}}.fused"
  minSdk = 24
  aarMetadata { minCompileSdk = 36 }
}

// Originally we skipped dev-only modules (expo-dev-menu, expo-dev-launcher, etc.)
// to keep dev tooling out of release. But the autolinking-generated
// `ExpoModulesPackageList.kt` baked into `:${{libraryName}}` references every
// autolinked module's Package class with a hard static reference — skipping a
// module from the fused AAR leaves a dangling reference that crashes the host
// at app startup with `NoClassDefFoundError`. We accept the trade-off: dev
// modules ship inside the fused AAR (their classes exist, autolinking resolves),
// but the host still only invokes dev features in debug-side flows. ViewBinding/
// DataBinding from these modules is stripped by the `configurations.configureEach`
// block below.
val devOnlyExpoProjects = emptySet<String>()

// Modules whose classes reference resources from EXTERNAL Maven deps (ExoPlayer for
// expo-video, CameraX for expo-camera, Google Maps SDK for expo-maps, etc.). AGP
// Fused Library's `rewriteClasses` step can't rewrite R.id/R.string references to
// resources it never saw — only the included projects' own R.txt is merged. Including
// these modules makes the build fail with "unknown symbol of type X and name Y" at
// `rewriteClasses`. Consumers can still depend on them as regular Maven coords next
// to the fused AAR.
//
// Extend at invocation time with `-Pbrownfield.fused.skip=foo,bar` (comma-separated
// project names) if you hit additional `rewriteClasses` failures with other modules.
val externalResourceExpoProjects = setOf(
  "expo-video",
  "expo-camera",
  "expo-maps",
  "expo-image",
  "expo-av",
  "expo-image-picker",
  "expo-document-picker",
)
val extraSkip: Set<String> = (project.findProperty("brownfield.fused.skip") as? String)
  ?.split(',')
  ?.map { it.trim() }
  ?.filter { it.isNotEmpty() }
  ?.toSet()
  ?: emptySet()
val fusedSkipProjects = devOnlyExpoProjects + externalResourceExpoProjects + extraSkip

// Force every sibling expo module to evaluate its build script before we resolve
// `include()` targets. Without this, `sub.plugins.hasPlugin(...)` returns false for
// any project Gradle hasn't reached yet and the fused AAR ships empty.
rootProject.subprojects.forEach {
  if (it.path != project.path) {
    evaluationDependsOn(it.path)
  }
}

// AGP Fused Library rejects ANY `androidx.databinding:*` dep — including
// `viewbinding`, which is pulled transitively by `react { autolinkLibrariesWithApp() }`
// on the brownfield library and by some autolinked modules. We don't use binding
// in the fused AAR, so strip it from every configuration before validation runs.
//
// Plus: skip-list modules (dev-only + external-resource) leak into the fused POM as
// transitive deps from `:brownfield`'s `react { autolinkLibrariesWithApp() }`, and
// the Fused Library plugin externalizes them using Gradle project names
// (`expo-camera`) rather than their real published artifactIds (`expo.modules.camera`).
// The resulting coords don't resolve at consume time. Strip them from every
// configuration so they never make it into the published POM — consumers add the
// modules they actually need as separate deps in their host app.
configurations.configureEach {
  exclude(group = "androidx.databinding", module = "viewbinding")
  exclude(group = "androidx.databinding", module = "databinding-common")
  exclude(group = "androidx.databinding", module = "databinding-runtime")
  exclude(group = "androidx.databinding", module = "databinding-adapters")
  exclude(group = "androidx.databinding", module = "databinding-ktx")

  fusedSkipProjects.forEach { skipName -> exclude(module = skipName) }
}

dependencies {
  // The brownfield library carries the user's BrownfieldActivity / Fragment / Host code.
  include(project(":${{libraryName}}"))

  // Every autolinked Expo Android module. `expo-module-gradle-plugin` is applied by
  // expo-modules-core's autolinking integration on Android modules only, so it's a
  // reliable marker for "this is an Expo module we should fuse in" vs an unrelated
  // `com.android.library` subproject (e.g. the host app's own library modules).
  rootProject.subprojects.forEach { sub ->
    if (sub.name in fusedSkipProjects) return@forEach
    if (sub.path == project.path) return@forEach
    if (!sub.plugins.hasPlugin("expo-module-gradle-plugin")) return@forEach
    include(project(sub.path))
  }
}

publishing {
  publications {
    register<MavenPublication>("brownfieldRelease") {
      afterEvaluate { from(components["fusedLibraryComponent"]) }
      // The Fused Library plugin externalizes every transitive dep it saw (RN, AndroidX,
      // Kotlin, and — relevant here — every skip-list Expo module reachable via
      // `:${{libraryName}}`'s `react { autolinkLibrariesWithApp() }`). It uses Gradle
      // project names (`expo-camera`) as artifactIds rather than the real published coords
      // (`expo.modules.camera`), so consumers can't resolve them. Configuration-level
      // excludes don't reach the component's POM emission. Strip the broken nodes
      // here after Gradle generates the POM.
      pom.withXml {
        val deps = (asNode().get("dependencies") as? groovy.util.NodeList)?.firstOrNull() as? groovy.util.Node
          ?: return@withXml
        val toRemove = deps.children().filterIsInstance<groovy.util.Node>().filter { dep ->
          val artifactId = (dep.get("artifactId") as? groovy.util.NodeList)?.firstOrNull()
            ?.let { (it as? groovy.util.Node)?.text() }
          artifactId in fusedSkipProjects
        }
        toRemove.forEach { deps.remove(it) }
      }
    }
  }
}

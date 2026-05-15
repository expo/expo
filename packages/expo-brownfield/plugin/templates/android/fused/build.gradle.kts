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

// Every autolinked Expo Android module fuses in by default. Earlier iterations
// skipped "heavy" modules (expo-video, expo-camera, expo-image, expo-maps, etc.)
// because their classes reference R.* values from EXTERNAL Maven deps (ExoPlayer
// for expo-video, CameraX for expo-camera, Glide for expo-image, Google Maps SDK
// for expo-maps, ...) — AGP Fused Library's `rewriteClasses` step couldn't resolve
// those references because the external libraries came in as POM deps, not as
// included `include()` targets. The fix below: at Gradle time, walk each Expo
// module's `releaseRuntimeClasspath`, collect every resolved external AAR, and
// `include()` it alongside the project. The external library's R.txt + resources
// end up merged into the fused AAR and `rewriteClasses` resolves cleanly.
//
// Override at invocation via `-Pbrownfield.fused.skip=foo,bar` if a specific
// module still trips a build (e.g. a new Expo module introduces an external
// library that needs a manual coord override).
val extraSkip: Set<String> = (project.findProperty("brownfield.fused.skip") as? String)
  ?.split(',')
  ?.map { it.trim() }
  ?.filter { it.isNotEmpty() }
  ?.toSet()
  ?: emptySet()
val fusedSkipProjects = extraSkip

// Force every sibling expo module to evaluate its build script before we resolve
// `include()` targets and walk their `releaseRuntimeClasspath`. Without this, the
// `hasPlugin(...)` check and the classpath resolution both see incomplete state.
rootProject.subprojects.forEach {
  if (it.path != project.path) {
    evaluationDependsOn(it.path)
  }
}

// Group prefixes for non-AndroidX coords that MUST stay external in the published POM.
// The consumer's host app provides these foundational libraries; bundling them inside
// the fused AAR triggers duplicate-class errors at dex merge time. Extend at
// invocation via `-Pbrownfield.fused.exclude-transitive=foo,bar`.
val transitiveIncludeDenylistNonAndroidX = setOf(
  "org.jetbrains.kotlin",
  "org.jetbrains.kotlinx",
  "com.facebook.fbjni",
  "com.facebook.fresco",
  "com.facebook.hermes",
  "com.facebook.react",
  "com.facebook.soloader",
  "com.facebook.yoga",
  "com.google.android.material",
  "com.google.guava",
  "com.squareup.okhttp3",
  "com.squareup.okio",
)
// AndroidX subgroups we DO want fused — these provide the heavy library code Expo
// modules wrap (ExoPlayer for expo-video, CameraX for expo-camera). All other
// `androidx.*` groups stay external because the consumer's host app already provides
// them, and Fused Library's validation refuses partially-included transitive-dep
// chains (one allowed transitive's parent must also be in the fat AAR — easy to
// trip when AndroidX modules cross-depend).
val androidxFuseAllowlist = setOf(
  "androidx.camera",
  "androidx.media3",
)
val extraDenylist: Set<String> =
  (project.findProperty("brownfield.fused.exclude-transitive") as? String)
    ?.split(',')
    ?.map { it.trim() }
    ?.filter { it.isNotEmpty() }
    ?.toSet()
    ?: emptySet()
val effectiveDenylist = transitiveIncludeDenylistNonAndroidX + extraDenylist
// Helper that decides if a group should stay external (in POM, not in the fat AAR).
fun isGroupDenied(group: String): Boolean {
  if (effectiveDenylist.any { group == it || group.startsWith("$it.") }) return true
  // AndroidX: deny everything EXCEPT the explicit allowlist.
  if (group == "androidx" || group.startsWith("androidx.")) {
    return androidxFuseAllowlist.none { group == it || group.startsWith("$it.") }
  }
  return false
}

// AGP Fused Library rejects ANY `androidx.databinding:*` dep — including
// `viewbinding`, which is pulled transitively by `react { autolinkLibrariesWithApp() }`
// on the brownfield library and by some autolinked modules. We don't use binding
// in the fused AAR, so strip it from every configuration before validation runs.
// This MUST be registered BEFORE the aggregator below is resolved — `configureEach`
// fires for every configuration including future ones, and adding excludes after
// resolution throws "Cannot mutate after resolved".
configurations.configureEach {
  exclude(group = "androidx.databinding", module = "viewbinding")
  exclude(group = "androidx.databinding", module = "databinding-common")
  exclude(group = "androidx.databinding", module = "databinding-runtime")
  exclude(group = "androidx.databinding", module = "databinding-adapters")
  exclude(group = "androidx.databinding", module = "databinding-ktx")

  fusedSkipProjects.forEach { skipName -> exclude(module = skipName) }
}

// Create an aggregator configuration on THIS project that depends on every Expo
// module. Resolving another project's configuration directly fails under Gradle 8+
// parallel execution with "attempted without an exclusive lock"; resolving our own
// configuration is always safe. Attributes pin the consumer side to
// `java-runtime` + `BuildTypeAttr=release` so Gradle's variant matcher picks each
// Expo module's release runtime variant rather than emitting "no matching variants"
// or silently resolving nothing.
val expoAggregator = configurations.create("brownfieldFusedExpoAggregator") {
  isCanBeResolved = true
  isCanBeConsumed = false
  attributes {
    attribute(
      org.gradle.api.attributes.Usage.USAGE_ATTRIBUTE,
      project.objects.named(org.gradle.api.attributes.Usage::class.java, org.gradle.api.attributes.Usage.JAVA_RUNTIME)
    )
    attribute(
      org.gradle.api.attributes.Category.CATEGORY_ATTRIBUTE,
      project.objects.named(org.gradle.api.attributes.Category::class.java, org.gradle.api.attributes.Category.LIBRARY)
    )
    // AGP's `releaseRuntimeElements` exposes multiple sub-variants under one
    // configuration (`android-aar`, `android-aar-metadata`, `android-classes`,
    // `android-jni`, ...). Without LibraryElements=aar Gradle can't pick which
    // sub-variant to give us and emits "cannot choose between the following variants".
    attribute(
      org.gradle.api.attributes.LibraryElements.LIBRARY_ELEMENTS_ATTRIBUTE,
      project.objects.named(org.gradle.api.attributes.LibraryElements::class.java, "aar")
    )
    attribute(
      com.android.build.api.attributes.BuildTypeAttr.ATTRIBUTE,
      project.objects.named(com.android.build.api.attributes.BuildTypeAttr::class.java, "release")
    )
  }
  // Two Expo modules pin different `-android`-suffixed Guava versions which Gradle's
  // version comparator can't reconcile (the suffix throws off SemVer ordering). The
  // conflict cascades and lenient resolution returns ZERO artifacts. Neither
  // `force(...)` nor `eachDependency` resolves it cleanly. Excluding Guava from the
  // aggregator entirely is the pragmatic fix — Guava is foundational and stays
  // external in the POM via the denylist above, so the consumer's host app provides
  // it. Add more `exclude(...)` lines here if another dep introduces a similar
  // suffix-conflict that the aggregator can't reconcile.
  exclude(group = "com.google.guava", module = "guava")
}
dependencies {
  rootProject.subprojects.forEach { sub ->
    if (sub.path == project.path) return@forEach
    if (sub.name in fusedSkipProjects) return@forEach
    if (!sub.plugins.hasPlugin("expo-module-gradle-plugin")) return@forEach
    add("brownfieldFusedExpoAggregator", sub)
  }
}

// Walk the aggregator's resolved artifacts to collect external AAR coordinates the
// fused AAR should `include()`. Auto-discovers ExoPlayer for expo-video, CameraX
// for expo-camera, Glide for expo-image, etc. without hardcoding per-module coord
// lists. Foundational coords from the denylist stay out; sibling Expo projects are
// already include()'d as projects below.
//
// Uses the modern `incoming.artifactView { lenient(true) }` API rather than
// `resolvedConfiguration.lenientConfiguration` — the latter throws on any failure
// before you can access the lenient surface, masking the underlying error.
val transitiveAarIncludes: Set<String> = run {
  val collected = mutableSetOf<String>()
  // Request `artifactType=aar` on the view. For external Maven AARs that's the
  // file-extension type. For AGP project deps, Gradle's built-in artifact transforms
  // converts the `android-aar` sub-variant to a plain `aar` file. Both targets match,
  // sidestepping the "cannot choose between sub-variants" ambiguity.
  val artifactView = expoAggregator.incoming.artifactView {
    isLenient = true
    attributes {
      attribute(
        org.gradle.api.attributes.Attribute.of("artifactType", String::class.java),
        "aar"
      )
    }
  }
  artifactView.artifacts.artifacts.forEach { result ->
    val id = result.id.componentIdentifier
    if (id !is org.gradle.api.artifacts.component.ModuleComponentIdentifier) return@forEach
    if (result.file.extension != "aar") return@forEach
    val group = id.group
    if (isGroupDenied(group)) return@forEach
    if (rootProject.findProject(":${id.module}") != null) return@forEach
    collected += "${group}:${id.module}:${id.version}"
  }
  logger.lifecycle("brownfield.fused: collected ${collected.size} external AAR coords")
  collected
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

  // External Maven AARs reachable from each fused Expo module's release runtime
  // classpath (ExoPlayer for expo-video, CameraX for expo-camera, Glide for
  // expo-image, etc.). Bringing them in as `include()` targets merges their R.txt
  // + resources into the fused AAR so `rewriteClasses` can resolve the FQNs Expo
  // modules reference. The denylist above keeps foundational coords (kotlin-stdlib,
  // androidx.core, RN runtime) external in the POM.
  transitiveAarIncludes.forEach { coord -> include(coord) }
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

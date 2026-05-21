// Fuses every autolinked Android module + the brownfield library into a single
// publishable AAR via AGP's `com.android.fused-library` (Preview, AGP 8.13+).
//
// One sibling subproject per variant — `:<libraryName>-fused-release` and
// `-fused-debug` — both rendered from this template; `{{fusedVariant}}` is the
// only delta.

plugins {
  id("com.android.fused-library")
  id("maven-publish")
}

group = "${{groupId}}"

version = "${{version}}"

val fusedVariant = "${{fusedVariant}}"
val isReleaseVariant = fusedVariant == "release"
val fusedVariantCapitalized = fusedVariant.replaceFirstChar { it.uppercase() }

androidFusedLibrary {
  namespace = "${{packageId}}.fused.${{fusedVariant}}"
  minSdk = 24
  aarMetadata { minCompileSdk = 36 }
}

// Dev tooling is `debugImplementation`-only on the brownfield library, so the
// release fat AAR must skip it. `setupFusedModeStripping` strips matching entries
// from the generated `ExpoModulesPackageList.kt` to avoid `NoClassDefFoundError`
// at host startup. Extend ad-hoc via `-Pbrownfield.fused.skip=foo,bar`.
val devOnlySkipProjects: Set<String> = if (isReleaseVariant) {
  setOf("expo-dev-client", "expo-dev-launcher", "expo-dev-menu", "expo-dev-menu-interface")
} else {
  emptySet()
}
val extraSkip: Set<String> = (project.findProperty("brownfield.fused.skip") as? String)
  ?.split(',')
  ?.map { it.trim() }
  ?.filter { it.isNotEmpty() }
  ?.toSet()
  ?: emptySet()
val fusedSkipProjects = devOnlySkipProjects + extraSkip

// Force sibling evaluation before resolving include() targets and walking their
// runtime classpaths — without this, plugin detection and classpath resolution
// see incomplete state. Skip self and the OTHER fused sibling to avoid a cycle.
rootProject.subprojects.forEach {
  if (it.path == project.path) return@forEach
  if (it.name == "${{libraryName}}-fused-release") return@forEach
  if (it.name == "${{libraryName}}-fused-debug") return@forEach
  evaluationDependsOn(it.path)
}

// Foundational libraries the host app already provides — bundling them in the
// fused AAR causes duplicate-class errors at dex merge. Stay external in the POM.
// Extend via `-Pbrownfield.fused.exclude-transitive=foo,bar`.
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
// AndroidX subgroups we DO want fused (ExoPlayer for expo-video, CameraX for
// expo-camera). All other `androidx.*` stays external — Fused Library rejects
// partial transitive chains, easy to trip with cross-depending AndroidX modules.
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
// True → coord stays external in the POM. AndroidX uses an allowlist, everything
// else uses the denylist above.
fun isGroupDenied(group: String): Boolean {
  if (effectiveDenylist.any { group == it || group.startsWith("$it.") }) return true
  if (group == "androidx" || group.startsWith("androidx.")) {
    return androidxFuseAllowlist.none { group == it || group.startsWith("$it.") }
  }
  return false
}

// AGP Fused Library rejects any `androidx.databinding:*` dep (including
// `viewbinding`, pulled transitively by `react { autolinkLibrariesWithApp() }`).
// Strip them from every configuration. MUST be registered BEFORE the aggregator
// resolves, otherwise `configureEach` throws "Cannot mutate after resolved".
configurations.configureEach {
  exclude(group = "androidx.databinding", module = "viewbinding")
  exclude(group = "androidx.databinding", module = "databinding-common")
  exclude(group = "androidx.databinding", module = "databinding-runtime")
  exclude(group = "androidx.databinding", module = "databinding-adapters")
  exclude(group = "androidx.databinding", module = "databinding-ktx")

  fusedSkipProjects.forEach { skipName -> exclude(module = skipName) }
}

// Aggregator configuration: depends on every autolinked module, resolved locally
// to avoid Gradle 8+'s "attempted without an exclusive lock" on cross-project
// resolution. `BuildTypeAttr` picks the matching variant per module.
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
    attribute(
      org.gradle.api.attributes.LibraryElements.LIBRARY_ELEMENTS_ATTRIBUTE,
      project.objects.named(org.gradle.api.attributes.LibraryElements::class.java, "aar")
    )
    attribute(
      com.android.build.api.attributes.BuildTypeAttr.ATTRIBUTE,
      project.objects.named(com.android.build.api.attributes.BuildTypeAttr::class.java, fusedVariant)
    )
  }
  // Conflicting `-android`-suffixed Guava versions confuse Gradle's SemVer
  // comparator and cascade into lenient resolution returning zero artifacts.
  // Guava is denylisted anyway (host provides it), so just drop it here.
  exclude(group = "com.google.guava", module = "guava")
}

// `project.path` inside a `Project` extension function resolves to the RECEIVER
// (Project.getProject() returns `this`), not the script's project. Capture it in
// an outer `val` so the self-check compares against THIS fused module.
val thisProjectPath: String = project.path

// `plugins.hasPlugin("com.android.library")` returns false on Expo modules because
// `expo-module-gradle-plugin` applies AGP via `pluginManager.apply(LibraryPlugin::class.java)`,
// which doesn't register the plugin ID. Match by class FQN to catch both apply paths.
fun Project.hasAndroidLibraryPlugin(): Boolean {
  if (plugins.hasPlugin("com.android.library")) return true
  if (plugins.toList().any { p ->
        val n = p.javaClass.name
        (n.startsWith("com.android.build.gradle.") || n.startsWith("com.android.build.api.")) &&
          n.endsWith("LibraryPlugin")
      }) return true
  val android = extensions.findByName("android") ?: return false
  return android.javaClass.name.contains("Library", ignoreCase = true)
}

fun Project.isFusableAndroidLibrary(): Boolean {
  if (path == thisProjectPath) return false
  if (name == "${{libraryName}}") return false
  if (name == "${{libraryName}}-fused-release") return false
  if (name == "${{libraryName}}-fused-debug") return false
  if (name in fusedSkipProjects) return false
  if (!hasAndroidLibraryPlugin()) return false
  return true
}

val fusableSubprojects: List<Project> = rootProject.subprojects.filter { it.isFusableAndroidLibrary() }
logger.lifecycle(
  "brownfield.fused[${fusedVariant}]: fusing ${fusableSubprojects.size} subprojects: " +
    fusableSubprojects.joinToString(", ") { it.name }
)

dependencies {
  fusableSubprojects.forEach { sub ->
    add("brownfieldFusedExpoAggregator", sub)
  }
}

// Walk the aggregator's resolved artifacts to collect external AAR coords for
// `include()`. Auto-discovers ExoPlayer, CameraX, Glide, etc. Lenient via the
// modern `artifactView` API — the legacy `lenientConfiguration` throws before
// you can read the lenient surface, masking the real failure.
val transitiveAarIncludes: Set<String> = run {
  val collected = mutableSetOf<String>()
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
    // Drop per-build-type coords (e.g. `com.composables:core-android-debug`):
    // AGP fused-library's internal release-hardcoded resolution trips on
    // cross-variant lookups. Leave them external; the host resolves them.
    if (id.module.endsWith("-debug") || id.module.endsWith("-release")) return@forEach
    collected += "${group}:${id.module}:${id.version}"
  }
  logger.lifecycle(
    "brownfield.fused[${fusedVariant}]: collected ${collected.size} external AAR coords"
  )
  collected
}

dependencies {
  // User's BrownfieldActivity / Fragment / Host code.
  include(project(":${{libraryName}}"))

  // Every autolinked Android module (Expo + RN community).
  rootProject.subprojects.forEach { sub ->
    if (!sub.isFusableAndroidLibrary()) return@forEach
    include(project(sub.path))
  }

  // External heavy libs (ExoPlayer, CameraX, Glide, ...). Including them merges
  // R.txt + resources so `rewriteClasses` can resolve the FQNs modules reference.
  transitiveAarIncludes.forEach { coord -> include(coord) }
}

publishing {
  // Mirror the root project's `expoBrownfieldPublishPlugin` repositories. The
  // publish plugin skips fused modules (no `LibraryExtension`), so without this
  // loop no `publishBrownfield<V>PublicationTo<X>Repository` tasks are created.
  repositories {
    val rootPublishConfig =
      rootProject.extensions.findByType(expo.modules.plugin.ExpoPublishExtension::class.java)
    rootPublishConfig?.publications?.forEach { pubConfig ->
      when (pubConfig.type.get()) {
        "localMaven" -> mavenLocal()
        "localDirectory", "remotePublic" -> maven {
          name = pubConfig.name
          url = uri(pubConfig.url.get())
          isAllowInsecureProtocol = pubConfig.allowInsecure.get()
        }
        "remotePrivate" -> maven {
          name = pubConfig.name
          url = uri(pubConfig.url.get())
          credentials {
            username = pubConfig.username.get()
            password = pubConfig.password.get()
          }
          isAllowInsecureProtocol = pubConfig.allowInsecure.get()
        }
      }
    }
  }

  publications {
    register<MavenPublication>("brownfield${fusedVariantCapitalized}") {
      afterEvaluate { from(components["fusedLibraryComponent"]) }
      // Fused Library emits skip-list modules into the POM using Gradle project
      // names (`expo-camera`) instead of the real coords (`expo.modules.camera`),
      // breaking consumer resolution. Configuration-level excludes don't reach
      // the POM, so strip them post-generation.
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

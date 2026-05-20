// Single fat AAR that merges every autolinked Android module (Expo + RN community)
// plus the brownfield library's own classes/resources/jni into one publishable
// artifact via AGP's `com.android.fused-library` plugin (Preview in AGP 8.13+).
//
// Two sibling subprojects are emitted by the brownfield config plugin:
//   `:<libraryName>-fused-release` and `:<libraryName>-fused-debug`.
// They share THIS template — `{{fusedVariant}}` is substituted at prebuild time to
// `"release"` or `"debug"` and the script branches on `isReleaseVariant` for the
// few places the two siblings actually differ.
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

// Substituted by the config plugin: "release" or "debug".
val fusedVariant = "${{fusedVariant}}"
val isReleaseVariant = fusedVariant == "release"
val fusedVariantCapitalized = fusedVariant.replaceFirstChar { it.uppercase() }

androidFusedLibrary {
  namespace = "${{packageId}}.fused.${{fusedVariant}}"
  minSdk = 24
  aarMetadata { minCompileSdk = 36 }
}

// Modules that must NOT land in the release fat AAR. Dev tooling
// (`expo-dev-menu` / `-launcher` / `-client` / `-menu-interface`) is wired as
// `debugImplementation` on the brownfield library by `templates/patches/build.gradle.patch`
// — leaking it into release shipped to consumers contradicts that policy. The debug
// sibling intentionally includes them so devs get dev-menu, etc.
//
// `setupFusedModeStripping` in the brownfield-setup Gradle plugin strips the matching
// references from the autolinking-generated `ExpoModulesPackageList.kt` when the
// release sibling builds — otherwise the host crashes at startup with
// `NoClassDefFoundError` on the dangling Package class references.
//
// Extend at invocation via `-Pbrownfield.fused.skip=foo,bar` if a specific module
// trips a build (e.g. a new Expo module introduces an external library that needs a
// manual coord override).
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

// Force every sibling Android module to evaluate its build script before we resolve
// `include()` targets and walk their `releaseRuntimeClasspath`/`debugRuntimeClasspath`.
// Without this, the `hasPlugin(...)` check and the classpath resolution both see
// incomplete state.
rootProject.subprojects.forEach {
  // Skip self AND the sibling fused module — both fused siblings declare
  // `evaluationDependsOn(rootProject.subprojects)`, so depending on each other
  // creates a cycle. The siblings are independent (one per build type), so
  // neither needs the other's evaluation.
  if (it.path == project.path) return@forEach
  if (it.name == "${{libraryName}}-fused-release") return@forEach
  if (it.name == "${{libraryName}}-fused-debug") return@forEach
  evaluationDependsOn(it.path)
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
// AndroidX subgroups we DO want fused — these provide the heavy library code Android
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

// Create an aggregator configuration on THIS project that depends on every autolinked
// Android module. Resolving another project's configuration directly fails under
// Gradle 8+ parallel execution with "attempted without an exclusive lock"; resolving
// our own configuration is always safe. `BuildTypeAttr=${{fusedVariant}}` picks the
// matching variant of every Expo / RN community module.
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
  // Two autolinked modules pin different `-android`-suffixed Guava versions which
  // Gradle's version comparator can't reconcile (the suffix throws off SemVer
  // ordering). The conflict cascades and lenient resolution returns ZERO artifacts.
  // Neither `force(...)` nor `eachDependency` resolves it cleanly. Excluding Guava
  // from the aggregator entirely is the pragmatic fix — Guava is foundational and
  // stays external in the POM via the denylist above, so the consumer's host app
  // provides it.
  exclude(group = "com.google.guava", module = "guava")
}

// Heuristic for "this is an autolinked Android module we should fuse in":
// * applies `com.android.library`
// * isn't this fused sibling, isn't the brownfield library itself
// * isn't the host `:app` (com.android.application)
// * isn't the OTHER fused sibling (avoid the debug sibling trying to include the
//   release one or vice versa)
// This catches BOTH Expo modules (via `expo-module-gradle-plugin`) AND React Native
// community modules (which only apply `com.android.library`), fixing the previous
// expo-only filter that silently excluded `react-native-screens` etc.
// `project` inside a `Project` extension function resolves to the RECEIVER (since
// `Project.getProject()` returns `this`), not the script's project. Capture the
// script project's path in an outer `val` so the self-check actually compares the
// iterated subproject against THIS fused module.
val thisProjectPath: String = project.path

// `plugins.hasPlugin("com.android.library")` returns false on Expo modules because
// `expo-module-gradle-plugin` applies AGP via `pluginManager.apply(LibraryPlugin::class.java)`
// (programmatic class apply), which doesn't register the plugin ID in the ID lookup
// table. We match by class FQN instead, catching both apply-by-class and apply-by-id.
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

// Walk the aggregator's resolved artifacts to collect external AAR coordinates the
// fused AAR should `include()`. Auto-discovers ExoPlayer for expo-video, CameraX
// for expo-camera, Glide for expo-image, etc. without hardcoding per-module coord
// lists. Foundational coords from the denylist stay out; sibling Android projects are
// already include()'d as projects below.
//
// Uses the modern `incoming.artifactView { lenient(true) }` API rather than
// `resolvedConfiguration.lenientConfiguration` — the latter throws on any failure
// before you can access the lenient surface, masking the underlying error.
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
    // Drop per-build-type Maven coords (e.g. `com.composables:core-android-debug`).
    // These have variant baked into the artifactId and have no cross-variant
    // counterpart, so AGP fused-library's internal release-hardcoded `fusedRuntime`
    // configuration trips trying to resolve "release" of a "-debug" coord. Leave
    // them external in the POM; the consumer's build resolves the matching variant.
    if (id.module.endsWith("-debug") || id.module.endsWith("-release")) return@forEach
    collected += "${group}:${id.module}:${id.version}"
  }
  logger.lifecycle(
    "brownfield.fused[${fusedVariant}]: collected ${collected.size} external AAR coords"
  )
  collected
}

dependencies {
  // The brownfield library carries the user's BrownfieldActivity / Fragment / Host code.
  include(project(":${{libraryName}}"))

  // Every autolinked Android module (Expo + RN community).
  rootProject.subprojects.forEach { sub ->
    if (!sub.isFusableAndroidLibrary()) return@forEach
    include(project(sub.path))
  }

  // External Maven AARs reachable from each fused module's runtime classpath
  // (ExoPlayer for expo-video, CameraX for expo-camera, Glide for expo-image, etc.).
  // Bringing them in as `include()` targets merges their R.txt + resources into the
  // fused AAR so `rewriteClasses` can resolve the FQNs modules reference.
  transitiveAarIncludes.forEach { coord -> include(coord) }
}

publishing {
  // Mirror the repositories declared on the root project's `expoBrownfieldPublishPlugin`
  // extension onto THIS fused sibling. The publish plugin's `setupRepositories` runs
  // via `setupPublishing`, which is gated by `shouldBeSkipped()` — that returns true
  // for fused modules (no `LibraryExtension`), so the wiring would otherwise stop at
  // the publication and never create the `publishBrownfield<V>PublicationTo<X>Repository`
  // tasks. Re-implement the repo loop here against the SAME `ExpoPublishExtension`
  // config so `--repo <Name>` on the CLI resolves identically for fused and non-fused.
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
      // The Fused Library plugin externalizes every transitive dep it saw (RN, AndroidX,
      // Kotlin, and — relevant here — every skip-list module reachable via
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

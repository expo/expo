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
val fusedVariantCapitalized = fusedVariant.replaceFirstChar { it.uppercase() }

androidFusedLibrary {
  namespace = "${{packageId}}.fused.${{fusedVariant}}"
  minSdk = 24
  aarMetadata { minCompileSdk = 36 }
}

// No hardcoded skip list. Dev tooling (`expo-dev-menu` / `-launcher` / `-client` /
// `-menu-interface`) is included in BOTH variants:
//   - For `-fused-release`, AGP fused-library compiles each module's release source
//     set. `expo-dev-menu` / `expo-dev-launcher` swap their `src/debug` for a tiny
//     `src/disableInRelease` source set in release builds — it provides STUB
//     `DevMenuPackage` / `DevLauncherPackageDelegate` classes so `ExpoModulesPackageList`
//     references resolve at runtime, but with no functional dev tooling. Footprint
//     stays small and no manual entry-stripping is needed.
//   - For `-fused-debug`, our `fusedRuntime` attribute override picks the debug
//     source set → real dev tooling, Metro reload, red-box overlay, etc.
// `expo-dev-client` and `expo-dev-menu-interface` have no Kotlin/Java sources at
// all; including them adds nothing to the AAR.
val extraSkip: Set<String> = (project.findProperty("brownfield.fused.skip") as? String)
  ?.split(',')
  ?.map { it.trim() }
  ?.filter { it.isNotEmpty() }
  ?.toSet()
  ?: emptySet()
val fusedSkipProjects = extraSkip

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
// Groups the user explicitly wants to keep OUT of the fused AAR — extra groups
// beyond the auto-detected KMP libs (see below). Configure via gradle.properties
// or `-P` when auto-detection misses something:
//   brownfield.fused.exclude-transitive=some.kmp.group,another.group
val userExcludedGroups: Set<String> =
  (project.findProperty("brownfield.fused.exclude-transitive") as? String)
    ?.split(',')
    ?.map { it.trim() }
    ?.filter { it.isNotEmpty() }
    ?.toSet()
    ?: emptySet()

// Auto-detected KMP groups that can't safely be fused. Populated by walking the
// aggregator's resolution result (below) and inspecting each component's variants
// for the Kotlin Multiplatform `platform.type` attribute. KMP-published libs trip
// AGP fused-library's "parent dependency not included" validation when the
// `-android` child gets fused because the umbrella parent has no AAR.
val autoExcludedGroups = mutableSetOf<String>()

// Combined view used by configureEach excludes + denylist below. Populated by
// the resolution walk before configureEach gets registered for other configs.
fun effectiveExcludedGroups(): Set<String> = userExcludedGroups + autoExcludedGroups

// True → coord stays external in the POM. AndroidX uses an allowlist, everything
// else uses the denylist (foundational libs + KMP/user-excluded groups).
fun isGroupDenied(group: String): Boolean {
  val denylist = transitiveIncludeDenylistNonAndroidX + effectiveExcludedGroups()
  if (denylist.any { group == it || group.startsWith("$it.") }) return true
  if (group == "androidx" || group.startsWith("androidx.")) {
    return androidxFuseAllowlist.none { group == it || group.startsWith("$it.") }
  }
  return false
}

// Override AGP fused-library's internal `fusedRuntime` BuildTypeAttr=release →
// match the sibling's `fusedVariant`. Makes `-fused-debug` actually fuse debug-
// compiled bytecode (correct `BuildConfig.DEBUG=true`, dev-only code paths active).
configurations.all {
  if (name.startsWith("fusedRuntime")) {
    attributes {
      attribute(
        com.android.build.api.attributes.BuildTypeAttr.ATTRIBUTE,
        project.objects.named(com.android.build.api.attributes.BuildTypeAttr::class.java, fusedVariant)
      )
    }
  }
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

// Recorded by the aggregator walk: coords whose group is in `userExcludedGroups`
// — the consumer-side resolution needs to declare these as transitive deps even
// though we don't fuse them into the AAR. Used by the metadata + POM post-
// processors below.
val externalDepsForConsumer = mutableListOf<Triple<String, String, String>>()

// First pass: walk the aggregator's resolutionResult to AUTO-DETECT KMP libs
// whose umbrella module declares `available-at` redirecting to a different child
// coord (e.g. `com.composables:core` → `core-android-debug`, or
// `io.github.lukmccall:radix-ui-colors` → `radix-ui-colors-android`). The
// umbrella has no content, only the redirect — AGP fused-library's "parent
// dependency not included" validation fires when the child gets fused but the
// umbrella isn't (and the umbrella can't be fused, it has no AAR).
//
// Gradle exposes the redirect via `ResolvedVariantResult.externalVariant`: when
// present, this variant is a stand-in for the variant in another module. The
// umbrella component is the one carrying that link, so its group is what we
// auto-exclude. Other KMP-published libs that publish full content per artifact
// (Compose, Kotlin stdlib, etc.) don't have `available-at` and are unaffected.
expoAggregator.incoming.resolutionResult.allComponents.forEach { component ->
  val id = component.id
  if (id !is org.gradle.api.artifacts.component.ModuleComponentIdentifier) return@forEach
  if (transitiveIncludeDenylistNonAndroidX.any { id.group == it || id.group.startsWith("$it.") }) return@forEach
  val hasAvailableAtRedirect = component.variants.any { variant ->
    variant.externalVariant.isPresent
  }
  if (hasAvailableAtRedirect) autoExcludedGroups.add(id.group)
}
if (autoExcludedGroups.isNotEmpty()) {
  logger.lifecycle(
    "brownfield.fused[${fusedVariant}]: auto-detected ${autoExcludedGroups.size} KMP " +
      "umbrella groups to keep external: " + autoExcludedGroups.sorted().joinToString(", ")
  )
}

// Excludes that must reach EVERY configuration the fused-library plugin walks,
// including the runtime classpaths of `include(project(...))` targets. Scoping
// to just `fusedRuntime` isn't enough — fused-library reads from included
// projects' own configs which a scoped exclude can't touch.
//
// The aggregator is intentionally exempt so the transitive-AAR walk below can
// still record the resolved versions of excluded groups; we inject those into
// the published POM/.module as transitive deps for consumers to resolve.
//
// MUST be registered BEFORE any other config the fused-library plugin will walk
// resolves — otherwise `exclude` throws "Cannot mutate after resolved." We
// resolve the aggregator first (above, for KMP detection) but that's safe
// because the aggregator is exempt from this configureEach.
configurations.matching { it.name != "brownfieldFusedExpoAggregator" }.configureEach {
  // AGP Fused Library rejects any `androidx.databinding:*` dep, including
  // `viewbinding` pulled transitively by `react { autolinkLibrariesWithApp() }`.
  exclude(group = "androidx.databinding", module = "viewbinding")
  exclude(group = "androidx.databinding", module = "databinding-common")
  exclude(group = "androidx.databinding", module = "databinding-runtime")
  exclude(group = "androidx.databinding", module = "databinding-adapters")
  exclude(group = "androidx.databinding", module = "databinding-ktx")

  fusedSkipProjects.forEach { skipName -> exclude(module = skipName) }
  effectiveExcludedGroups().forEach { g -> exclude(group = g) }
}

// Walk the aggregator's resolved artifacts to collect external AAR coords for
// `include()`. Auto-discovers ExoPlayer, CameraX, Glide, etc. Lenient via the
// modern `artifactView` API — the legacy `lenientConfiguration` throws before
// you can read the lenient surface, masking the real failure.
val transitiveAarIncludes: Set<String> = run {
  val collected = mutableSetOf<String>()
  val excludedGroups = effectiveExcludedGroups()
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
    // Record coords from excluded groups so we can inject them as transitive
    // deps in the published POM/.module — must happen before any filter rejects them.
    if (group in excludedGroups) {
      externalDepsForConsumer.add(Triple(group, id.module, id.version))
    }
    if (isGroupDenied(group)) return@forEach
    if (rootProject.findProject(":${id.module}") != null) return@forEach
    // Drop variant-suffixed Maven coords (e.g. `com.composables:core-android-debug`).
    // These coords bake the build type into the artifactId, so they have no
    // cross-variant counterpart and AGP fused-library's internal resolution trips
    // trying to look them up. The consumer's own resolution picks the matching
    // variant naturally via Gradle Module Metadata.
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
      // Fused-library emits skip-list modules into the POM using Gradle project names
      // (`expo-camera`) instead of the real coords (`expo.modules.camera`), so they
      // can't be resolved by consumers. Strip them.
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

// AGP `com.android.fused-library` auto-registers a `maven` publication alongside
// our explicit `brownfield<V>` one at the same coords. `publishToMavenLocal` runs
// both — the `maven` one overwrites our annotated metadata. Disable it.
tasks.matching { it.name.startsWith("publishMavenPublicationTo") }.configureEach {
  enabled = false
}

// Annotate `react-android` / `hermes-android` dependency edges in the published
// Gradle Module Metadata with this sibling's `fusedVariant`, so consumers' variant
// matching resolves the same RN variant the brownfield's codegen `.so` files were
// linked against. Mismatch manifests as either SIGSEGV at component-descriptor
// init (release codegen + debug `libreactnative.so`) or unsatisfied-link to debug-
// only symbols like `ShadowNode::getDebugName` (debug codegen + release runtime).
val metadataTaskName = "generateMetadataFileForBrownfield${fusedVariantCapitalized}Publication"
afterEvaluate {
  tasks.named(metadataTaskName).configure {
    doLast {
      val moduleFile = outputs.files.singleFile
      if (!moduleFile.exists()) return@doLast
      @Suppress("UNCHECKED_CAST")
      val root = groovy.json.JsonSlurper().parseText(moduleFile.readText()) as MutableMap<String, Any?>
      val variants = root["variants"] as? MutableList<MutableMap<String, Any?>> ?: return@doLast
      var annotatedCount = 0
      var strippedCount = 0
      val perVariantAbiCoords = setOf(
        "com.facebook.react" to "react-android",
        "com.facebook.hermes" to "hermes-android",
      )
      variants.forEach { variant ->
        val deps = variant["dependencies"] as? MutableList<MutableMap<String, Any?>> ?: return@forEach
        // Drop natural-emission entries whose group the user excluded — the inject
        // step below adds the variant-specific coord with the actual resolved
        // version, avoiding the KMP-parent-vs-`-android`-child duplication that
        // naturally appears for libs like `io.github.lukmccall:radix-ui-colors`.
        val before = deps.size
        deps.removeAll { dep ->
          val g = dep["group"] as? String ?: return@removeAll false
          g in userExcludedGroups
        }
        strippedCount += before - deps.size
        deps.forEach { dep ->
          val key = (dep["group"] as? String) to (dep["module"] as? String)
          if (key in perVariantAbiCoords && dep["attributes"] == null) {
            dep["attributes"] = mutableMapOf<String, Any?>(
              "com.android.build.api.attributes.BuildTypeAttr" to fusedVariant
            )
            annotatedCount++
          }
        }
      }
      // Inject the user-excluded transitives so the consumer can resolve them.
      if (externalDepsForConsumer.isNotEmpty()) {
        val runtimeVariant = variants.firstOrNull { (it["name"] as? String) == "runtimePublication" }
        if (runtimeVariant != null) {
          @Suppress("UNCHECKED_CAST")
          val deps = (runtimeVariant["dependencies"] as? MutableList<MutableMap<String, Any?>>)
            ?: mutableListOf<MutableMap<String, Any?>>().also { runtimeVariant["dependencies"] = it }
          externalDepsForConsumer.forEach { (group, module, version) ->
            deps.add(mutableMapOf(
              "group" to group,
              "module" to module,
              "version" to mutableMapOf("requires" to version),
            ))
          }
        }
      }
      moduleFile.writeText(groovy.json.JsonOutput.prettyPrint(groovy.json.JsonOutput.toJson(root)))
      logger.lifecycle(
        "brownfield.fused[${fusedVariant}]: annotated $annotatedCount dep edges with " +
          "BuildTypeAttr=${fusedVariant}, stripped $strippedCount user-excluded entries, " +
          "injected ${externalDepsForConsumer.size} user-excluded transitives in module metadata"
      )
    }
  }
  // POM injection at the task-output level (not via `pom.withXml`) because Gradle's
  // `MavenPublication` runs a consistency check AFTER `withXml` that strips entries
  // whose coords aren't in the resolved configurations. Our `configureEach` exclude
  // removes them, so the injection has to happen post-consistency-check.
  val pomTaskName = "generatePomFileForBrownfield${fusedVariantCapitalized}Publication"
  tasks.named(pomTaskName).configure {
    doLast {
      if (externalDepsForConsumer.isEmpty()) return@doLast
      val pomFile = outputs.files.singleFile
      if (!pomFile.exists()) return@doLast
      val depEntries = externalDepsForConsumer.joinToString("\n") { (group, module, version) ->
        """    <dependency>
      <groupId>${group}</groupId>
      <artifactId>${module}</artifactId>
      <version>${version}</version>
      <scope>runtime</scope>
    </dependency>"""
      }
      val xml = pomFile.readText()
      val updated = if (xml.contains("</dependencies>")) {
        xml.replace("</dependencies>", "${depEntries}\n  </dependencies>")
      } else {
        xml.replace("</project>", "  <dependencies>\n${depEntries}\n  </dependencies>\n</project>")
      }
      pomFile.writeText(updated)
    }
  }
}

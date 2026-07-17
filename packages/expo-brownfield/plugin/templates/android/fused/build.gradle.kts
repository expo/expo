// Fuses every autolinked Android module + the brownfield library into a single
// publishable AAR via AGP's `com.android.fused-library` (Preview, AGP 8.13+).
//
// One sibling subproject per variant — `:<libraryName>-fused-release` and
// `-fused-debug` — both rendered from this template; `{{fusedVariant}}` is the
// only delta.
//
// INERT BY DEFAULT: everything below the `brownfield.fused` guard only runs when
// the CLI passes `-Pbrownfield.fused=true` (`expo-brownfield build:android --fused`).
// Without the property this project registers no publications and resolves no
// dependencies, so plain builds (`expo run:android`, IDE sync) pay no configuration
// cost and non-fused `publishBrownfield<V>PublicationTo<X>` invocations can't
// accidentally trigger a fat-AAR build through Gradle's cross-project task-name
// matching.

plugins {
  id("com.android.fused-library")
  id("maven-publish")
}

group = "${{groupId}}"

version = "${{version}}"

androidFusedLibrary {
  namespace = "${{packageId}}.fused.${{fusedVariant}}"
  minSdk = 24
  aarMetadata { minCompileSdk = 36 }
}

// AGP `com.android.fused-library` auto-registers a `maven` publication at the same
// coords as our explicit `brownfield<V>` one. `publishToMavenLocal` runs both — the
// `maven` one overwrites our annotated metadata. Disable it unconditionally so a
// manual `./gradlew publishToMavenLocal` in non-fused mode can't build the fat AAR
// either.
tasks.matching { it.name.startsWith("publishMavenPublicationTo") }.configureEach {
  enabled = false
}

if (findProperty("brownfield.fused") == "true") {
  val fusedVariant = "${{fusedVariant}}"
  val fusedVariantCapitalized = fusedVariant.replaceFirstChar { it.uppercase() }

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
  //
  // Modules skipped via `-Pbrownfield.fused.skip` stay referenced by the autolinking-
  // generated `ExpoModulesPackageList` — pair the skip with
  // `-Pbrownfield.fused.strip-packages=<package prefixes>` so the host doesn't hit
  // `NoClassDefFoundError` at startup.
  val fusedSkipProjects: Set<String> = (project.findProperty("brownfield.fused.skip") as? String)
    ?.split(',')
    ?.map { it.trim() }
    ?.filter { it.isNotEmpty() }
    ?.toSet()
    ?: emptySet()

  // Force sibling evaluation before resolving include() targets and walking their
  // runtime classpaths — without this, plugin detection and classpath resolution
  // see incomplete state. Skip self and the OTHER fused sibling to avoid a cycle.
  rootProject.subprojects.forEach {
    if (it.path == project.path) return@forEach
    if (it.name == "${{libraryName}}-fused-release") return@forEach
    if (it.name == "${{libraryName}}-fused-debug") return@forEach
    evaluationDependsOn(it.path)
  }

  // `androidx.*` allowlist — these must be fused because their transitive chains
  // span non-AndroidX groups (e.g. `androidx.camera:camera-mlkit-vision` depends
  // on `com.google.mlkit:vision-interfaces`; the latter gets pulled into the AAR
  // as a side-effect of fusing an Expo module, and AGP fused-library's "parent
  // dependency not included" validation then demands its AndroidX parent be
  // fused too — which requires the whole `androidx.camera` chain to be fused).
  // Auto-detection can't see these because they're regular Maven parent links,
  // not KMP `available-at` redirects.
  //
  // Extend via `-Pbrownfield.fused.androidx-fuse=androidx.foo,androidx.bar` if
  // another autolinked module pulls a new AndroidX chain with the same pattern.
  val androidxFuseAllowlistDefaults = setOf("androidx.camera", "androidx.media3")
  val androidxFuseAllowlistExtra: Set<String> =
    (project.findProperty("brownfield.fused.androidx-fuse") as? String)
      ?.split(',')
      ?.map { it.trim() }
      ?.filter { it.isNotEmpty() }
      ?.toSet()
      ?: emptySet()
  val androidxFuseAllowlist = androidxFuseAllowlistDefaults + androidxFuseAllowlistExtra

  // Android brownfield host platform baseline — NOT a list of application
  // libraries. These are the foundational pieces that, by definition of being a
  // React Native Android brownfield host, the integrating app already provides
  // on its classpath:
  //
  //   • RN runtime — `react-android`, `hermes-android`, `fbjni`, `soloader`,
  //     `yoga`. The host links variant-specific `.so` files against these;
  //     fusing them either duplicate-classes with the host's copies or pins
  //     the wrong variant's native libs. AGP fused-library's "parent
  //     dependency not included" validation also enforces this transitively
  //     (e.g. `fbjni`'s parent is `hermes-android`).
  //
  //   • Kotlin stdlib — `org.jetbrains.kotlin`, `org.jetbrains.kotlinx`. Every
  //     modern Android app pulls these via its own build.
  //
  //   • Host-provided commons — `com.google.android.material`, `com.google.guava`,
  //     `com.facebook.fresco`, `com.squareup.okhttp3`, `com.squareup.okio`.
  //     Beyond duplication risk, AGP fused-library's class rewriter can't
  //     resolve `android:*` framework-attr references in styleables (Material's
  //     `AppBarLayout_android_background` etc.), so fusing Material Design fails
  //     `rewriteClasses` outright.
  //
  // This list encodes structural facts about the brownfield host — not
  // application-specific library choices. If you're adding a NEW group here,
  // it should be because every brownfield host inherently has it (e.g. AGP
  // raised the minimum platform baseline), not because a specific app uses it.
  val hostPlatformBaseline = setOf(
    "com.facebook.react",
    "com.facebook.hermes",
    "com.facebook.fbjni",
    "com.facebook.soloader",
    "com.facebook.yoga",
    "com.facebook.fresco",
    "org.jetbrains.kotlin",
    "org.jetbrains.kotlinx",
    "com.google.android.material",
    "com.google.guava",
    "com.squareup.okhttp3",
    "com.squareup.okio",
  )

  // Extra groups the user wants kept OUT of the fused AAR — auto-detection below
  // handles the common KMP-umbrella case, this is only for edge cases:
  //   brownfield.fused.exclude-transitive=some.group,another.group
  val excludedGroupsExtra: Set<String> =
    (project.findProperty("brownfield.fused.exclude-transitive") as? String)
      ?.split(',')
      ?.map { it.trim() }
      ?.filter { it.isNotEmpty() }
      ?.toSet()
      ?: emptySet()

  // Populated below by walking the aggregator's resolution and detecting KMP-style
  // pom-only umbrellas that trip AGP fused-library's "parent dependency not
  // included" validation. A function rather than a val: `autoExcludedGroups` keeps
  // growing during the walk and lazy consumers (configureEach) need the live view.
  val autoExcludedGroups = mutableSetOf<String>()
  fun effectiveExcludedGroups(): Set<String> =
    hostPlatformBaseline + excludedGroupsExtra + autoExcludedGroups

  // True → coord stays external in the POM. AndroidX uses an allowlist; the
  // RN runtime baseline + user-excluded + auto-detected KMP umbrellas form the
  // denylist.
  fun isGroupDenied(group: String): Boolean {
    val denylist = effectiveExcludedGroups()
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

  // Coords whose group is excluded from fusing — the consumer-side resolution needs
  // these declared as transitive deps in the published POM/.module even though they
  // aren't fused into the AAR. LinkedHashSet: insertion order for stable output,
  // set semantics so a coord reachable through several modules is recorded once.
  val externalDepsForConsumer = linkedSetOf<Triple<String, String, String>>()

  // Pure-umbrella coords recorded during auto-detection: the umbrella itself has no
  // content (every variant redirects elsewhere), so it must not be re-declared for
  // consumers — its `-android` child is recorded instead.
  val pureUmbrellaComponents = mutableSetOf<Pair<String, String>>()

  // AUTO-DETECT groups that must stay external. Walks the aggregator's resolution
  // graph once and records two cases:
  //
  //   1. Pom-only KMP umbrellas — components where EVERY variant is a redirect
  //      (`available-at`) to another module. The umbrella has no content of its
  //      own, only a pointer; fusing the `-android` child while the umbrella
  //      stays external trips AGP's "parent dependency not included" validation.
  //      Catches `com.composables:core`, `io.github.lukmccall:radix-ui-colors`,
  //      etc. without naming them. Facade umbrellas (Compose, AndroidX) have a
  //      mix of redirect and content variants — they don't match and stay
  //      fusable.
  //
  //   2. Non-allowlisted `androidx.*` groups — `androidx.core` and friends bring
  //      in styleables that reference `android:*` framework attrs (e.g.
  //      `ColorStateListItem` → `android:alpha`). AGP fused-library's class
  //      rewriter can't resolve framework attrs in the merged R, so fusing them
  //      makes `rewriteClasses` fail. Excluding at the configuration level here
  //      stops them from being pulled in via project-dep transitive walks.
  expoAggregator.incoming.resolutionResult.allComponents.forEach { component ->
    val id = component.id
    if (id !is org.gradle.api.artifacts.component.ModuleComponentIdentifier) return@forEach
    val group = id.group
    if (group == "androidx" || group.startsWith("androidx.")) {
      val inAllowlist = androidxFuseAllowlist.any { group == it || group.startsWith("$it.") }
      if (!inAllowlist) autoExcludedGroups.add(group)
      return@forEach
    }
    val variants = component.variants
    if (variants.isEmpty()) return@forEach
    val isPureUmbrella = variants.all { variant -> variant.externalVariant.isPresent }
    if (isPureUmbrella) {
      autoExcludedGroups.add(group)
      pureUmbrellaComponents.add(group to id.module)
    }
  }
  if (autoExcludedGroups.isNotEmpty()) {
    logger.lifecycle(
      "brownfield.fused[${fusedVariant}]: auto-detected ${autoExcludedGroups.size} groups to " +
        "keep external (KMP umbrellas + non-allowlisted androidx.*): " +
        autoExcludedGroups.sorted().joinToString(", ")
    )
  }

  // Second pass, after `autoExcludedGroups` is complete: record every excluded-group
  // coordinate for the POM/.module injection — at the component level so JAR-only
  // modules (okhttp, okio, kotlin-stdlib, annotation artifacts) are captured too;
  // the AAR-filtered artifactView walk below never sees them. Pure umbrellas are
  // skipped (their `-android` children carry the content) and so are BOM/platform
  // modules, which aren't plain runtime dependencies.
  expoAggregator.incoming.resolutionResult.allComponents.forEach { component ->
    val id = component.id
    if (id !is org.gradle.api.artifacts.component.ModuleComponentIdentifier) return@forEach
    if (id.group !in effectiveExcludedGroups()) return@forEach
    if ((id.group to id.module) in pureUmbrellaComponents) return@forEach
    if (id.module.endsWith("-bom")) return@forEach
    externalDepsForConsumer.add(Triple(id.group, id.module, id.version))
  }

  // Excludes that must reach EVERY configuration the fused-library plugin walks,
  // including the runtime classpaths of `include(project(...))` targets. Scoping
  // to just `fusedRuntime` isn't enough — fused-library reads from included
  // projects' own configs which a scoped exclude can't touch. The aggregator is
  // intentionally exempt so the transitive-AAR walk below can still see the
  // resolved artifacts of excluded groups.
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
          // Also drop skip-list modules: fused-library emits them under unresolvable
          // Gradle project names, and Gradle consumers read the .module file over the
          // POM, so the POM-level strip alone isn't enough.
          val before = deps.size
          deps.removeAll { dep ->
            val g = dep["group"] as? String
            val m = dep["module"] as? String
            (g != null && g in effectiveExcludedGroups()) || (m != null && m in fusedSkipProjects)
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
        // Inject the excluded transitives so the consumer can resolve them.
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
          } else {
            logger.warn(
              "brownfield.fused[${fusedVariant}]: 'runtimePublication' variant not found in " +
                "module metadata — skipped injecting ${externalDepsForConsumer.size} external " +
                "dependencies. Consumers may fail to resolve excluded-group transitives; this " +
                "usually means the AGP fused-library plugin changed its published variant names."
            )
          }
        }
        moduleFile.writeText(groovy.json.JsonOutput.prettyPrint(groovy.json.JsonOutput.toJson(root)))
        logger.lifecycle(
          "brownfield.fused[${fusedVariant}]: annotated $annotatedCount dep edges with " +
            "BuildTypeAttr=${fusedVariant}, stripped $strippedCount excluded entries, " +
            "injected ${externalDepsForConsumer.size} external transitives in module metadata"
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
}

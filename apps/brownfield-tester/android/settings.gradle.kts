pluginManagement {
    val reactNativeGradlePlugin = File(
        providers.exec {
            workingDir(rootDir)
            commandLine(
                "node",
                "--print",
                "require.resolve('@react-native/gradle-plugin/package.json', { paths: [require.resolve('react-native/package.json')] })"
            )
        }.standardOutput.asText.get().trim()
    ).parentFile.absolutePath
    includeBuild(reactNativeGradlePlugin)

    val expoPluginsPath = File(
        providers.exec {
            workingDir(rootDir)
            commandLine(
                "node",
                "--print",
                "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })"
            )
        }.standardOutput.asText.get().trim(),
        "../android/expo-gradle-plugin"
    ).absolutePath
    includeBuild(expoPluginsPath)

    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id("com.facebook.react.settings")
    id("expo-autolinking-settings")
}

expoAutolinking {
    projectRoot = File(rootDir, "../expo-app")
}

extensions.configure<com.facebook.react.ReactSettingsExtension> {
    autolinkLibrariesFromCommand(
        expoAutolinking.rnConfigCommand,
        rootDir,
        files("../../../yarn.lock")
    )
}

expoAutolinking.useExpoModules()

rootProject.name = "Brownfield"

expoAutolinking.useExpoVersionCatalog()

includeBuild(expoAutolinking.reactNativeGradlePlugin)
include(":app")

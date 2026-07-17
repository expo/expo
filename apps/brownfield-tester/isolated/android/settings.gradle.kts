pluginManagement {
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
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        mavenLocal()
        maven { url = uri("https://www.jitpack.io") }
        // maven {
        //     url = uri("https://maven.pkg.github.com/gabrieldonadel/brownfield-fused-test")
        //     credentials {
        //         username = System.getenv("GITHUB_ACTOR") ?: "gabrieldonadel"
        //         password = System.getenv("GITHUB_TOKEN") ?: ""
        //     }
        // }

    }
}

rootProject.name = "BrownfieldIntegratedTester"
include(":app")

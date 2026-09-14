plugins {
  `kotlin-dsl`
}

repositories {
  mavenCentral()
}

gradlePlugin {
  plugins {
    create("prebuiltNatives") {
      id = "expo-prebuilt-natives"
      implementationClass = "expo.prebuilt.PrebuiltNativesPlugin"
    }
  }
}

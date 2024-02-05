plugins {
    id("org.jetbrains.kotlin.jvm") version "1.8.20"
    application
}

dependencies {
    implementation("org.ow2.asm:asm:9.6")
}

application {
    mainClass.set("dev.expo.kotlinmetadatastripper.AppKt")
}

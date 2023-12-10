plugins {
    application
}

repositories {
    google()
    mavenCentral()
}

dependencies {
    implementation("com.android.tools.build:manifest-merger:31.2.0")
}

application {
    mainClass.set("com.android.manifmerger.Merger")
}

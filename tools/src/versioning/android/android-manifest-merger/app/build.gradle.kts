plugins {
    application
}

repositories {
    google()
    mavenCentral()
}

dependencies {
    implementation("com.android.tools.build:manifest-merger:31.0.2")
}

application {
    mainClass.set("com.android.manifmerger.Merger")
}

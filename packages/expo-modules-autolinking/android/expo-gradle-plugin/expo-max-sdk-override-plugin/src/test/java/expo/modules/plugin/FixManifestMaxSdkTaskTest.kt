package expo.modules.plugin

import com.google.common.truth.Truth.assertThat
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

class FixManifestMaxSdkTaskTest {
  @get:Rule
  val tempFolder = TemporaryFolder()

  private lateinit var blameReportFile: File
  private lateinit var mergedManifestIn: File
  private lateinit var modifiedManifestOut: File

  private lateinit var manifest1: File
  private lateinit var manifest2: File

  @Before
  fun setup() {
    val projectDir = tempFolder.root
    blameReportFile = File(projectDir, "blame-report.txt")
    mergedManifestIn = File(projectDir, "merged-manifest-in.xml")
    modifiedManifestOut = File(projectDir, "modified-manifest-out.xml")

    val manifestDir1 = File(projectDir, "lib1/src/main").apply { mkdirs() }
    val manifestDir2 = File(projectDir, "app/src/main").apply { mkdirs() }

    manifest1 = File(manifestDir1, "AndroidManifest.xml")
    manifest1.writeText("""
            <manifest xmlns:android="http://schemas.android.com/apk/res/android">
                <uses-permission android:name="android.permission.READ_CONTACTS" android:maxSdkVersion="28" />
            </manifest>
        """.trimIndent())

    manifest2 = File(manifestDir2, "AndroidManifest.xml")
    manifest2.writeText("""
            <manifest xmlns:android="http://schemas.android.com/apk/res/android">
                <uses-permission android:name="android.permission.READ_CONTACTS" />
            </manifest>
        """.trimIndent())

    blameReportFile.writeText("""
            uses-permission#android.permission.READ_CONTACTS
              MERGED from ${manifest2.absolutePath}:5:3-33
              MERGED from ${manifest1.absolutePath}:3:3-83
            	android:maxSdkVersion
            		ADDED from ${manifest1.absolutePath}:4:7-34
        """.trimIndent())

    mergedManifestIn.writeText("""
            <?xml version="1.0" encoding="utf-8"?>
            <manifest xmlns:android="http://schemas.android.com/apk/res/android"
                package="com.example.app">
            
                <uses-permission android:name="android.permission.READ_CONTACTS" android:maxSdkVersion="28" />
                <uses-permission android:name="android.permission.INTERNET" />
            
            </manifest>
        """.trimIndent())
  }

  @Test
  fun `task removes maxSdkVersion from conflicting permission`() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val task = project.tasks.register("testFixTask", FixManifestMaxSdkTask::class.java).get()

    task.blameReportFile.set(blameReportFile)
    task.mergedManifestIn.set(mergedManifestIn)
    task.modifiedManifestOut.set(modifiedManifestOut)

    task.taskAction()

    val outputContent = modifiedManifestOut.readText()

    assertThat(outputContent).contains("<uses-permission android:name=\"android.permission.READ_CONTACTS\"/>")
    assertThat(outputContent).doesNotContain("maxSdkVersion")
    assertThat(outputContent).contains("<uses-permission android:name=\"android.permission.INTERNET\"/>")
  }

  @Test
  fun `task copies file directly if no conflicts are found`() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val task = project.tasks.register("testFixTask", FixManifestMaxSdkTask::class.java).get()

    blameReportFile.writeText("""
            uses-permission#android.permission.READ_CONTACTS
              MERGED from /app/src/main/AndroidManifest.xml:5:3-33
        """.trimIndent())

    val originalContent = mergedManifestIn.readText()

    task.blameReportFile.set(blameReportFile)
    task.mergedManifestIn.set(mergedManifestIn)
    task.modifiedManifestOut.set(modifiedManifestOut)

    task.taskAction()

    val outputContent = modifiedManifestOut.readText()

    assertThat(outputContent).isEqualTo(originalContent)
    assertThat(outputContent).contains("maxSdkVersion=\"28\"")
  }
}

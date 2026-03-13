package expo.modules.plugin

import com.google.common.truth.Truth.assertThat
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

class FindPermissionsToOverrideTest {

  @get:Rule
  val tempFolder = TemporaryFolder()

  private lateinit var manifestWithMaxSdk: File
  private lateinit var manifestWithoutMaxSdk: File

  @Before
  fun setup() {
    manifestWithMaxSdk = File(tempFolder.root, "max_sdk_manifest.xml")
    manifestWithMaxSdk.writeText("""
            <manifest xmlns:android="http://schemas.android.com/apk/res/android">
                <uses-permission 
                    android:name="android.permission.READ_CONTACTS" 
                    android:maxSdkVersion="28" />
            </manifest>
        """.trimIndent())

    manifestWithoutMaxSdk = File(tempFolder.root, "no_max_sdk_manifest.xml")
    manifestWithoutMaxSdk.writeText("""
            <manifest xmlns:android="http://schemas.android.com/apk/res/android">
                <uses-permission android:name="android.permission.READ_CONTACTS" />
                <uses-permission android:name="android.permission.WRITE_CALENDAR" />
            </manifest>
        """.trimIndent())
  }

  @Test
  fun `finds permission that needs to be overridden`() {
    val permissionInfo = PermissionInfo(
      maxSdkSources = mutableSetOf(manifestWithMaxSdk.absolutePath),
      manifestPaths = mutableSetOf(
        manifestWithMaxSdk.absolutePath,
        manifestWithoutMaxSdk.absolutePath
      )
    )
    val problems = mapOf("android.permission.READ_CONTACTS" to permissionInfo)
    val overrides = findPermissionsToOverride(problems)

    assertThat(overrides).hasSize(1)
    assertThat(overrides).containsKey("android.permission.READ_CONTACTS")
  }

  @Test
  fun `does not find override if no conflict exists`() {
    val manifestWithMaxSdk2 = File(tempFolder.root, "max_sdk_manifest_2.xml")
    manifestWithMaxSdk2.writeText("""
            <manifest xmlns:android="http://schemas.android.com/apk/res/android">
                <uses-permission android:name="android.permission.READ_CONTACTS" android:maxSdkVersion="28" />
            </manifest>
        """.trimIndent())

    val permissionInfo = PermissionInfo(
      maxSdkSources = mutableSetOf(manifestWithMaxSdk.absolutePath, manifestWithMaxSdk2.absolutePath),
      manifestPaths = mutableSetOf(
        manifestWithMaxSdk.absolutePath,
        manifestWithMaxSdk2.absolutePath
      )
    )
    val problems = mapOf("android.permission.READ_CONTACTS" to permissionInfo)
    val overrides = findPermissionsToOverride(problems)

    assertThat(overrides).isEmpty()
  }

  @Test
  fun `ignores permission if file does not exist`() {
    val nonExistentPath = "/path/to/nothing.xml"
    val permissionInfo = PermissionInfo(
      maxSdkSources = mutableSetOf(manifestWithMaxSdk.absolutePath),
      manifestPaths = mutableSetOf(
        manifestWithMaxSdk.absolutePath,
        nonExistentPath
      )
    )
    val problems = mapOf("android.permission.READ_CONTACTS" to permissionInfo)
    val overrides = findPermissionsToOverride(problems)

    assertThat(overrides).isEmpty()
  }
}

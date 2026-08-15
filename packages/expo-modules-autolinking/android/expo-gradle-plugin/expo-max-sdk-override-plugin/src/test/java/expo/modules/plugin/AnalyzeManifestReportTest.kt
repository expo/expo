package expo.modules.plugin

import com.google.common.truth.Truth.assertThat
import org.junit.Test

class AnalyzeManifestReportTest {

  @Test
  fun `finds permission with conflict`() {
    val reportContent = """
            uses-permission#android.permission.READ_CONTACTS
              MERGED from /Users/user/project/app/src/main/AndroidManifest.xml:11:3-33
              MERGED from /Users/user/project/library/src/main/AndroidManifest.xml:15:3-83
            	android:maxSdkVersion
            		ADDED from /Users/user/project/library/src/main/AndroidManifest.xml:16:7-34
        """.trimIndent()

    val problems = analyzeManifestReport(reportContent)

    assertThat(problems).hasSize(1)
    assertThat(problems).containsKey("android.permission.READ_CONTACTS")

    val info = problems["android.permission.READ_CONTACTS"]
    assertThat(info).isNotNull()

    info?.let {
      assertThat(info.manifestPaths).containsExactly(
        "/Users/user/project/app/src/main/AndroidManifest.xml",
        "/Users/user/project/library/src/main/AndroidManifest.xml"
      )
      assertThat(info.maxSdkSources).containsExactly(
        "/Users/user/project/library/src/main/AndroidManifest.xml"
      )
    }
  }

  @Test
  fun `ignores permission with no conflict`() {
    val reportContent = """
            uses-permission#android.permission.READ_CONTACTS
              MERGED from /Users/user/project/app/src/main/AndroidManifest.xml:11:3-33
              MERGED from /Users/user/project/library/src/main/AndroidManifest.xml:15:3-83
        """.trimIndent()

    val problems = analyzeManifestReport(reportContent)
    assertThat(problems).isEmpty()
  }

  @Test
  fun `ignores permission with only one source`() {
    val reportContent = """
            uses-permission#android.permission.READ_CONTACTS
              MERGED from /Users/user/project/app/src/main/AndroidManifest.xml:11:3-33
            	android:maxSdkVersion
            		ADDED from /Users/user/project/app/src/main/AndroidManifest.xml:12:7-34
        """.trimIndent()

    val problems = analyzeManifestReport(reportContent)

    assertThat(problems).isEmpty()
  }

  @Test
  fun `handles multiple permissions`() {
    val reportContent = """
            uses-permission#android.permission.READ_CONTACTS
              MERGED from /Users/user/project/app/src/main/AndroidManifest.xml:11:3-33
              MERGED from /Users/user/project/library/src/main/AndroidManifest.xml:15:3-83
            	android:maxSdkVersion
            		ADDED from /Users/user/project/library/src/main/AndroidManifest.xml:16:7-34
            
            uses-permission#android.permission.WRITE_EXTERNAL_STORAGE
              MERGED from /Users/user/project/app/src/main/AndroidManifest.xml:13:3-33
            
            uses-permission#android.permission.READ_EXTERNAL_STORAGE
              MERGED from /Users/user/project/app/src/main/AndroidManifest.xml:14:3-33
              MERGED from /Users/user/project/otherlib/src/main/AndroidManifest.xml:9:3-83
            	android:maxSdkVersion
            		ADDED from /Users/user/project/app/src/main/AndroidManifest.xml:15:7-34
        """.trimIndent()

    val problems = analyzeManifestReport(reportContent)

    assertThat(problems).hasSize(2)
    assertThat(problems).containsKey("android.permission.READ_CONTACTS")
    assertThat(problems).containsKey("android.permission.READ_EXTERNAL_STORAGE")

    val readContactsInfo = problems["android.permission.READ_CONTACTS"]!!
    assertThat(readContactsInfo.maxSdkSources).containsExactly(
      "/Users/user/project/library/src/main/AndroidManifest.xml"
    )

    val readStorageInfo = problems["android.permission.READ_EXTERNAL_STORAGE"]!!
    assertThat(readStorageInfo.manifestPaths).containsExactly(
      "/Users/user/project/app/src/main/AndroidManifest.xml",
      "/Users/user/project/otherlib/src/main/AndroidManifest.xml"
    )
    assertThat(readStorageInfo.maxSdkSources).containsExactly(
      "/Users/user/project/app/src/main/AndroidManifest.xml"
    )
  }
}

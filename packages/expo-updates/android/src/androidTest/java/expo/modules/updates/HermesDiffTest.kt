package expo.modules.updates

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import org.junit.Assert
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import java.nio.file.Files
import java.nio.file.StandardCopyOption

@RunWith(AndroidJUnit4ClassRunner::class)
class HermesDiffTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  @Test
  fun testApplyPatchWithRealHermesFiles() {
    val oldHbcStream = javaClass.classLoader?.getResourceAsStream("old.hbc")
    val newHbcStream = javaClass.classLoader?.getResourceAsStream("new.hbc")
    val patchStream = javaClass.classLoader?.getResourceAsStream("test.patch")

    if (oldHbcStream == null || newHbcStream == null || patchStream == null) {
      return
    }

    val oldFile = temporaryFolder.newFile("old.hbc")
    val expectedFile = temporaryFolder.newFile("expected.hbc")
    val patchFile = temporaryFolder.newFile("test.patch")
    val resultFile = temporaryFolder.newFile("result.hbc")

    Files.copy(oldHbcStream, oldFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
    Files.copy(newHbcStream, expectedFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
    Files.copy(patchStream, patchFile.toPath(), StandardCopyOption.REPLACE_EXISTING)

    val result = BSPatch.applyPatch(
      oldFile.absolutePath,
      resultFile.absolutePath,
      patchFile.absolutePath
    )

    Assert.assertEquals("BSPatch should succeed", 0, result)

    val expectedData = expectedFile.readBytes()
    val resultData = resultFile.readBytes()

    Assert.assertArrayEquals("Patched file should match expected file", expectedData, resultData)
  }

  @Test
  fun testApplyPatchFailsWithInvalidPatch() {
    val oldFile = temporaryFolder.newFile("old_invalid.hbc")
    val resultFile = temporaryFolder.newFile("result_invalid.hbc")
    val invalidPatchFile = temporaryFolder.newFile("invalid.patch")

    oldFile.writeText("Hermes bytecode content")
    invalidPatchFile.writeText("This is not a valid bsdiff patch")

    val result = BSPatch.applyPatch(
      oldFile.absolutePath,
      resultFile.absolutePath,
      invalidPatchFile.absolutePath
    )

    Assert.assertNotEquals("BSPatch should fail with invalid patch", 0, result)
  }
}

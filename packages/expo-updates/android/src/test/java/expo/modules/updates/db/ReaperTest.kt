package expo.modules.updates.db

import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.selectionpolicy.SelectionPolicy
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.shadows.ShadowLog
import java.io.File

@RunWith(RobolectricTestRunner::class)
class ReaperTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  private fun asset(relativePath: String?) = AssetEntity("key-$relativePath", "png").apply {
    this.relativePath = relativePath
    markedForDeletion = true
  }

  private fun reap(updatesDirectory: File, assetsToDelete: List<AssetEntity>) {
    val database = mockk<UpdatesDatabase>(relaxed = true)
    every { database.assetDao().deleteUnusedAssets() } returns assetsToDelete
    every { database.updateDao().loadAllUpdates() } returns listOf()

    val selectionPolicy = mockk<SelectionPolicy>(relaxed = true)
    every { selectionPolicy.selectUpdatesToDelete(any(), any(), any()) } returns listOf()

    Reaper.reapUnusedUpdates(
      mockk<UpdatesConfiguration>(relaxed = true),
      database,
      updatesDirectory,
      mockk<UpdateEntity>(relaxed = true),
      selectionPolicy
    )
  }

  @Test
  fun testReap_deletesAssetInsideUpdatesDirectory() {
    val updatesDirectory = temporaryFolder.newFolder(".expo-internal")
    val target = File(updatesDirectory, "abc.png").apply { writeText("asset") }

    reap(updatesDirectory, listOf(asset("abc.png")))

    Assert.assertFalse(target.exists())
  }

  @Test
  fun testReap_refusesToDeleteOutsideUpdatesDirectory() {
    // A row written before asset filenames were validated can still point outside the directory.
    val root = temporaryFolder.newFolder()
    val updatesDirectory = File(root, ".expo-internal").apply { mkdirs() }
    val outside = File(root, "keep-me.xml").apply { writeText("not the reaper's to delete") }

    reap(updatesDirectory, listOf(asset("../keep-me.xml")))

    Assert.assertTrue(outside.exists())
  }

  @Test
  fun testReap_skipsEmbeddedAssetsServedFromTheApk() {
    // Embedded assets store a resource URL rather than a filename, and there is nothing on disk to
    // delete. Their slashes must not be reported as an unsafe path, which is only visible in the
    // log because the delete is a no-op either way.
    val updatesDirectory = temporaryFolder.newFolder(".expo-internal")
    ShadowLog.clear()

    reap(
      updatesDirectory,
      listOf(
        asset("file:///android_asset/app.bundle"),
        asset("file:///android_res/drawable-xxhdpi/icon.png")
      )
    )

    val unsafePathErrors = ShadowLog.getLogs()
      .filter { it.type == Log.ERROR && it.msg.contains("unsafe path") }
    Assert.assertEquals(
      "embedded assets reported as unsafe: ${unsafePathErrors.map { it.msg }}",
      0,
      unsafePathErrors.size
    )
  }
}

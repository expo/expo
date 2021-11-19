package expo.modules.updates.manifest

import android.net.Uri
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.manifests.core.NewManifest
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import io.mockk.every
import io.mockk.mockk
import org.json.JSONException
import org.json.JSONObject
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class UpdateManifestMetadataTest {
  private lateinit var db: UpdatesDatabase
  private lateinit var config: UpdatesConfiguration
  private lateinit var manifest: NewManifest

  @Before
  @Throws(JSONException::class)
  fun setupManifest() {
    val manifestString =
      "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
    manifest = NewManifest(JSONObject(manifestString))
    config = createConfig()
  }

  @Before
  fun createDb() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase::class.java).build()
  }

  @After
  fun closeDb() {
    db.close()
  }

  @Test
  @Throws(JSONException::class)
  fun testManifestFilters_OverwriteAllFields() {
    val response1 = mockk<ManifestResponse>(relaxed = true)
    every { response1.header("expo-manifest-filters") } returns "branch-name=\"rollout-1\",test=\"value\""

    val updateManifest1: UpdateManifest = NewUpdateManifest.fromNewManifest(manifest, response1, config)
    ManifestMetadata.saveMetadata(updateManifest1, db, config)

    val response2 = mockk<ManifestResponse>(relaxed = true)
    every { response2.header("expo-manifest-filters") } returns "branch-name=\"rollout-2\""

    val updateManifest2: UpdateManifest = NewUpdateManifest.fromNewManifest(manifest, response2, config)
    ManifestMetadata.saveMetadata(updateManifest2, db, config)

    val actual = ManifestMetadata.getManifestFilters(db, config)
    Assert.assertNotNull(actual)
    Assert.assertEquals(1, actual!!.length().toLong())
    Assert.assertEquals("rollout-2", actual.getString("branch-name"))
  }

  @Test
  @Throws(JSONException::class)
  fun testManifestFilters_OverwriteEmpty() {
    val response1 = mockk<ManifestResponse>(relaxed = true)
    every { response1.header("expo-manifest-filters") } returns "branch-name=\"rollout-1\""

    val updateManifest1: UpdateManifest = NewUpdateManifest.fromNewManifest(manifest, response1, config)
    ManifestMetadata.saveMetadata(updateManifest1, db, config)

    val response2 = mockk<ManifestResponse>(relaxed = true)
    every { response2.header("expo-manifest-filters") } returns ""

    val updateManifest2: UpdateManifest = NewUpdateManifest.fromNewManifest(manifest, response2, config)
    ManifestMetadata.saveMetadata(updateManifest2, db, config)

    val actual = ManifestMetadata.getManifestFilters(db, config)
    Assert.assertNotNull(actual)
    Assert.assertEquals(0, actual!!.length().toLong())
  }

  @Test
  @Throws(JSONException::class)
  fun testManifestFilters_OverwriteNull() {
    val response1 = mockk<ManifestResponse>(relaxed = true)
    every { response1.header("expo-manifest-filters") } returns "branch-name=\"rollout-1\""

    val updateManifest1: UpdateManifest = NewUpdateManifest.fromNewManifest(manifest, response1, config)
    ManifestMetadata.saveMetadata(updateManifest1, db, config)

    val response2 = mockk<ManifestResponse>(relaxed = true)
    every { response2.header("expo-manifest-filters") } returns null

    val updateManifest2: UpdateManifest = NewUpdateManifest.fromNewManifest(manifest, response2, config)
    ManifestMetadata.saveMetadata(updateManifest2, db, config)

    val actual = ManifestMetadata.getManifestFilters(db, config)
    Assert.assertNotNull(actual)
    Assert.assertEquals(1, actual!!.length().toLong())
    Assert.assertEquals("rollout-1", actual.getString("branch-name"))
  }

  private fun createConfig(): UpdatesConfiguration {
    return UpdatesConfiguration().loadValuesFromMap(
      mapOf(
        "updateUrl" to Uri.parse("https://exp.host/@test/test")
      )
    )
  }
}

package expo.modules.updates.manifest

import android.net.Uri
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.manifests.core.ExpoUpdatesManifest
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import org.json.JSONException
import org.json.JSONObject
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

@RunWith(AndroidJUnit4ClassRunner::class)
class UpdateMetadataTest {
  private lateinit var db: UpdatesDatabase
  private lateinit var config: UpdatesConfiguration
  private lateinit var manifest: ExpoUpdatesManifest

  @Before
  @Throws(JSONException::class)
  fun setupManifest() {
    val manifestString =
      "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
    manifest = ExpoUpdatesManifest(JSONObject(manifestString))
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
    val headers1 = ResponseHeaderData(manifestFiltersRaw = "branch-name=\"rollout-1\",test=\"value\"")
    ManifestMetadata.saveMetadata(headers1, db, config)

    val headers2 = ResponseHeaderData(manifestFiltersRaw = "branch-name=\"rollout-2\"")
    ManifestMetadata.saveMetadata(headers2, db, config)

    val actual = ManifestMetadata.getManifestFilters(db, config)
    Assert.assertNotNull(actual)
    Assert.assertEquals(1, actual!!.length().toLong())
    Assert.assertEquals("rollout-2", actual.getString("branch-name"))
  }

  @Test
  @Throws(JSONException::class)
  fun testManifestFilters_OverwriteEmpty() {
    val headers1 = ResponseHeaderData(manifestFiltersRaw = "branch-name=\"rollout-1\"")
    ManifestMetadata.saveMetadata(headers1, db, config)

    val headers2 = ResponseHeaderData(manifestFiltersRaw = "")
    ManifestMetadata.saveMetadata(headers2, db, config)

    val actual = ManifestMetadata.getManifestFilters(db, config)
    Assert.assertNotNull(actual)
    Assert.assertEquals(0, actual!!.length().toLong())
  }

  @Test
  @Throws(JSONException::class)
  fun testManifestFilters_OverwriteNull() {
    val headers1 = ResponseHeaderData(manifestFiltersRaw = "branch-name=\"rollout-1\"")
    ManifestMetadata.saveMetadata(headers1, db, config)

    val headers2 = ResponseHeaderData()
    ManifestMetadata.saveMetadata(headers2, db, config)

    val actual = ManifestMetadata.getManifestFilters(db, config)
    Assert.assertNotNull(actual)
    Assert.assertEquals(1, actual!!.length().toLong())
    Assert.assertEquals("rollout-1", actual.getString("branch-name"))
  }

  @Test
  fun testExtraClientParams() {
    val beforeSave = ManifestMetadata.getExtraParams(db, config)
    assertNull(beforeSave)

    ManifestMetadata.setExtraParam(db, config, "wat", "hello")

    val afterSave = ManifestMetadata.getExtraParams(db, config)
    assertEquals(mapOf("wat" to "hello"), afterSave)

    ManifestMetadata.setExtraParam(db, config, "wat", null)

    val afterRemove = ManifestMetadata.getExtraParams(db, config)
    assertEquals(mapOf(), afterRemove)
  }

  @Test
  fun testExtraClientParamsValidation() {
    assertFailsWith(
      exceptionClass = IllegalArgumentException::class,
      block = {
        ManifestMetadata.setExtraParam(db, config, "Hello", "World")
      }
    )
  }

  private fun createConfig(): UpdatesConfiguration {
    return UpdatesConfiguration(
      null,
      mapOf(
        "updateUrl" to Uri.parse("https://exp.host/@test/test")
      )
    )
  }
}

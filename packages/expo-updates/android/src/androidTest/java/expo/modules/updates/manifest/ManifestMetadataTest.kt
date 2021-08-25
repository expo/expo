package expo.modules.updates.manifest

import android.net.Uri
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.rawmanifests.NewRawManifest
import org.json.JSONException
import org.json.JSONObject
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class ManifestMetadataTest {
  private var db: UpdatesDatabase? = null
  private var config: UpdatesConfiguration? = null
  private var rawManifest: NewRawManifest? = null

  @Before
  @Throws(JSONException::class)
  fun setupManifest() {
    val manifestString =
      "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
    rawManifest = NewRawManifest(JSONObject(manifestString))
    config = createConfig()
  }

  @Before
  fun createDb() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase::class.java).build()
  }

  @After
  fun closeDb() {
    db!!.close()
  }

  @Test
  @Throws(JSONException::class)
  fun testManifestFilters_OverwriteAllFields() {
    val response1 = Mockito.mock(ManifestResponse::class.java)
    Mockito.`when`(response1.header("expo-manifest-filters"))
      .thenReturn("branch-name=\"rollout-1\",test=\"value\"")
    val manifest1: Manifest = NewManifest.fromRawManifest(rawManifest!!, response1, config!!)
    ManifestMetadata.saveMetadata(manifest1, db, config)
    val response2 = Mockito.mock(ManifestResponse::class.java)
    Mockito.`when`(response2.header("expo-manifest-filters"))
      .thenReturn("branch-name=\"rollout-2\"")
    val manifest2: Manifest = NewManifest.fromRawManifest(rawManifest!!, response2, config!!)
    ManifestMetadata.saveMetadata(manifest2, db, config)
    val actual = ManifestMetadata.getManifestFilters(db, config)
    Assert.assertNotNull(actual)
    Assert.assertEquals(1, actual!!.length().toLong())
    Assert.assertEquals("rollout-2", actual.getString("branch-name"))
  }

  @Test
  @Throws(JSONException::class)
  fun testManifestFilters_OverwriteEmpty() {
    val response1 = Mockito.mock(ManifestResponse::class.java)
    Mockito.`when`(response1.header("expo-manifest-filters"))
      .thenReturn("branch-name=\"rollout-1\"")
    val manifest1: Manifest = NewManifest.fromRawManifest(rawManifest!!, response1, config!!)
    ManifestMetadata.saveMetadata(manifest1, db, config)
    val response2 = Mockito.mock(ManifestResponse::class.java)
    Mockito.`when`(response2.header("expo-manifest-filters")).thenReturn("")
    val manifest2: Manifest = NewManifest.fromRawManifest(rawManifest!!, response2, config!!)
    ManifestMetadata.saveMetadata(manifest2, db, config)
    val actual = ManifestMetadata.getManifestFilters(db, config)
    Assert.assertNotNull(actual)
    Assert.assertEquals(0, actual!!.length().toLong())
  }

  @Test
  @Throws(JSONException::class)
  fun testManifestFilters_OverwriteNull() {
    val response1 = Mockito.mock(ManifestResponse::class.java)
    Mockito.`when`(response1.header("expo-manifest-filters"))
      .thenReturn("branch-name=\"rollout-1\"")
    val manifest1: Manifest = NewManifest.fromRawManifest(rawManifest!!, response1, config!!)
    ManifestMetadata.saveMetadata(manifest1, db, config)
    val response2 = Mockito.mock(ManifestResponse::class.java)
    Mockito.`when`(response2.header("expo-manifest-filters")).thenReturn(null)
    val manifest2: Manifest = NewManifest.fromRawManifest(rawManifest!!, response2, config!!)
    ManifestMetadata.saveMetadata(manifest2, db, config)
    val actual = ManifestMetadata.getManifestFilters(db, config)
    Assert.assertNotNull(actual)
    Assert.assertEquals(1, actual!!.length().toLong())
    Assert.assertEquals("rollout-1", actual.getString("branch-name"))
  }

  private fun createConfig(): UpdatesConfiguration {
    val configMap = HashMap<String, Any>()
    configMap["updateUrl"] = Uri.parse("https://exp.host/@test/test")
    return UpdatesConfiguration().loadValuesFromMap(configMap)
  }
}

package expo.modules.ota

import io.mockk.*
import io.mockk.impl.annotations.MockK
import junit.framework.TestCase
import org.json.JSONObject
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class ExpoOTAPersistenceTest: TestCase() {

    @MockK
    private lateinit var storage: KeyValueStorage

    private lateinit var otaPersistence: ExpoOTAPersistence

    @BeforeEach
    fun beforeEach() {
        MockKAnnotations.init(this)
        otaPersistence = ExpoOTAPersistence(storage)
    }

    @Test
    fun testDefaultValues() {
        whenStorageEmpty()

        assertFalse(otaPersistence.enqueuedReorderAtNextBoot)
        assertEquals(emptyJsonString(), otaPersistence.manifest.toString())
        assertNull(otaPersistence.bundlePath)
        assertNull(otaPersistence.downloadedBundlePath)
        assertNull(otaPersistence.outdatedBundlePath)
        assertNull(otaPersistence.downloadedManifest)
    }

    @Test
    fun testAllKeysAreDifferent() {
        whenStorageEmpty()

        val keysSlot = ArrayList<String>()
        every { storage.writeString(capture(keysSlot), any()) } just Runs
        every { storage.writeBoolean(capture(keysSlot), any()) } just Runs

        otaPersistence.enqueuedReorderAtNextBoot = true
        otaPersistence.bundlePath = "bundlePath"
        otaPersistence.manifest = JSONObject("{\"a\": 2}")
        otaPersistence.downloadedBundlePath = "downloadedBundlePath"
        otaPersistence.downloadedManifest = JSONObject("{\"a\": 2}")
        otaPersistence.outdatedBundlePath = "outdatedBundle"

        assertEquals(6, keysSlot.size)
    }

    @Test
    fun testWhenDownloadedManifestStoredThenItIsReturnedAsNewest() {
        val manifest = jsonWithOneValue("manifest", "actual")
        val downloadedManifest = jsonWithOneValue("manifest", "downloaded")

        whenStorageEmptyExcept(manifest = manifest.toString(), downloadedManifest = downloadedManifest.toString())
        assertEquals(downloadedManifest.toString(), otaPersistence.newestManifest.toString())
    }

    @Test
    fun testWhenDownloadedManifestAbsentThenItSavedReturnedAsNewest() {
        val manifest = jsonWithOneValue("manifest", "actual")
        whenStorageEmptyExcept(manifest = manifest.toString())

        assertEquals(manifest.toString(), otaPersistence.newestManifest.toString())
    }

    @Test
    fun testMarkDownloadedAsCurrentAndCurrentAsOutdated() {
        whenStorageEmpty()

        every { storage.readString(KEY_BUNDLE_PATH, any()) } returns "bundle"
        every { storage.readString(KEY_MANIFEST, any()) } returns jsonWithOneValue("value", "manifest").toString()
        every { storage.readString(KEY_DOWNLOADED_MANIFEST, any()) } returns jsonWithOneValue("value", "downloadedManifest").toString()
        every { storage.readString(KEY_DOWNLOADED_BUNDLE_PATH, any()) } returns "downloadedPath"

        otaPersistence.markDownloadedCurrentAndCurrentOutdated()

        verify { storage.writeString(KEY_BUNDLE_PATH, "downloadedPath") }
        verify { storage.writeString(KEY_MANIFEST, jsonWithOneValue("value", "downloadedManifest").toString()) }
        verify { storage.writeString(KEY_DOWNLOADED_BUNDLE_PATH, null) }
        verify { storage.writeString(KEY_DOWNLOADED_MANIFEST, null) }
        verify { storage.writeString(KEY_BUNDLE_OUTDATED, "bundle") }
        verify(exactly = 0) { storage.writeBoolean(any(), any()) }
    }

    private fun whenStorageEmpty() {
        storage = object: KeyValueStorage {
            override fun readString(key: String, defaultValue: String?): String? {
                return defaultValue
            }

            override fun writeString(key: String, value: String?) {}

            override fun commit() {}

            override fun readBoolean(key: String, default: Boolean): Boolean {
                return default
            }

            override fun writeBoolean(key: String, value: Boolean) {}
        }
        mockkObject(storage)
        otaPersistence = ExpoOTAPersistence(storage)
    }

    private fun whenStorageEmptyExcept(
            bundlePath: String? = null,
            downloadedBundlePath: String? = null,
            outdatedBundle: String? = null,
            manifest: String? = null,
            downloadedManifest: String? = null,
            enqueuedAtNextBoot: Boolean? = null
    ) {
        whenStorageEmpty()
        bundlePath?.let(isReturnedFromStorageForKey(KEY_BUNDLE_PATH))
        downloadedBundlePath?.let(isReturnedFromStorageForKey(KEY_DOWNLOADED_BUNDLE_PATH))
        outdatedBundle?.let(isReturnedFromStorageForKey(KEY_BUNDLE_OUTDATED))
        manifest?.let(isReturnedFromStorageForKey(KEY_MANIFEST))
        downloadedManifest?.let(isReturnedFromStorageForKey(KEY_DOWNLOADED_MANIFEST))
        enqueuedAtNextBoot?.let {
            every { storage.readBoolean(eq(KEY_REORDER_ENQUEUED)) } returns it
            every { storage.readBoolean(eq(KEY_REORDER_ENQUEUED), any()) } returns it
        }
    }

    private fun isReturnedFromStorageForKey(key: String): (String) -> MockKAdditionalAnswerScope<String?, String?> {
        return {
            every { storage.readString(eq(key)) } returns it
            every { storage.readString(eq(key), any()) } returns it
        }
    }

}
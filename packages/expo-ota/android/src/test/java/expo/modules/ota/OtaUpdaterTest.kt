package expo.modules.ota

import io.mockk.*
import io.mockk.impl.annotations.MockK
import junit.framework.TestCase
import org.json.JSONObject
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.io.File
import java.io.InputStream

class OtaUpdaterTest : TestCase() {

    lateinit var persistence: ExpoOTAPersistence

    @MockK
    lateinit var embeddedManifestAndBundle: EmbeddedManifestAndBundle

    @MockK
    lateinit var fileOperator: FileOperator

    @MockK
    lateinit var api: OtaApi

    @MockK
    lateinit var manifestComparator: ManifestComparator

    @MockK
    lateinit var manifestValidator: ManifestResponseValidator

    lateinit var updater: OtaUpdater

    private val exampleFilePath = "/path/to/file"
    private val exampleLocalDir = "/localDir/"

    @BeforeEach
    fun initMocks() {
        MockKAnnotations.init(this)
        persistence = mockOtaPersistence()
        embeddedManifestAndBundle = mockEmbeddedManifest(manifest = emptyJson())

        val slot = slot<String>()
        val validatorSlot = slot<(String) -> Unit>()

        every { fileOperator.dirPath(capture(slot)) } answers { File(exampleLocalDir + slot.captured) }
        every { fileOperator.saveResponseToFile(any(), any()) } returns { _, success, _ -> success(exampleFilePath) }
        every { fileOperator.removeFile(any()) } returns true
        every { manifestComparator.shouldReplaceBundle(any(), any()) } returns false
        every { manifestValidator.validate(any(), capture(validatorSlot), any()) } answers { validatorSlot.captured(jsonWithOneValue("manifest", "verified").toString()) }
        every { embeddedManifestAndBundle.isEmbeddedManifestCompatibleWith(any()) } returns true
        updater = createOtaUpdater()
    }

    private fun createOtaUpdater(): OtaUpdater {
        return OtaUpdater(
                persistence,
                api,
                manifestValidator,
                manifestComparator,
                "id",
                "channelId",
                embeddedManifestAndBundle,
                fileOperator)
    }

    @Test
    fun `when embedded manifest is newest it is stored as current`() {
        every { manifestComparator.shouldReplaceBundle(any(), any()) } returns true
        updater.initialize()

        verify(exactly = 0) { persistence.enqueuedReorderAtNextBoot = any() }
        verify(exactly = 0) { persistence.bundlePath = any() }
        verify(exactly = 0) { persistence.manifest = any() }
        verify(exactly = 1) { persistence.markDownloadedCurrentAndCurrentOutdated() }
        verify(exactly = 1) { persistence.downloadedManifest = match { it.toString() == emptyJson().toString() } }
        verify(exactly = 1) { persistence.downloadedBundlePath = "/path/to/file" }
        verify(exactly = 0) { persistence.outdatedBundlePath = any() }
        verify(exactly = 0) { fileOperator.removeFile(any()) }
        verify(exactly = 1) { fileOperator.saveResponseToFile(any(), any()) }
    }

    @Test
    fun `when downloaded is newest or equal nothing happens`() {
        every { persistence.manifest } returns emptyJson()
        every { persistence.bundlePath } returns exampleFilePath

        updater.initialize()

        verify(exactly = 0) { persistence.enqueuedReorderAtNextBoot = any() }
        verify(exactly = 0) { persistence.bundlePath = any() }
        verify(exactly = 0) { persistence.manifest = any() }
        verify(exactly = 0) { persistence.markDownloadedCurrentAndCurrentOutdated() }
        verify(exactly = 0) { persistence.downloadedManifest = match { it.toString() == emptyJson().toString() } }
        verify(exactly = 0) { persistence.downloadedBundlePath = any() }
        verify(exactly = 0) { persistence.outdatedBundlePath = any() }
        verify(exactly = 0) { fileOperator.removeFile(any()) }
        verify(exactly = 0) { fileOperator.saveResponseToFile(any(), any()) }
    }

    @Test
    fun `outdated bundle is deleted at initialization when embedded is newer`() {
        every { manifestComparator.shouldReplaceBundle(any(), any()) } returns true
        every { persistence.outdatedBundlePath } returns exampleFilePath

        updater.initialize()

        verify { fileOperator.removeFile(exampleFilePath) }
    }

    @Test
    fun `test embedded and stored manifests compared`() {
        every { embeddedManifestAndBundle.readManifest() } returns jsonWithOneValue("value", "embedded")
        every { persistence.newestManifest } returns jsonWithOneValue("value", "downloaded")

        updater.initialize()

        verify {
            manifestComparator.shouldReplaceBundle(
                    match { it.toString() == jsonWithOneValue("value", "downloaded").toString() },
                    match { it.toString() == jsonWithOneValue("value", "embedded").toString() }
            )
        }
    }

    @Test
    fun `outdated bundle is not deleted at initialization when embedded is older`() {
        every { persistence.outdatedBundlePath } returns exampleFilePath

        updater.initialize()

        verify(exactly = 0) { fileOperator.removeFile(any()) }
    }

    @Test
    fun `embedded is older but not compatible`() {
        every { manifestComparator.shouldReplaceBundle(any(), any()) } returns true
    }


    @Test
    fun `when reorder enqueued and downloaded manifest is newest`() {
        every { persistence.enqueuedReorderAtNextBoot } returns true

        updater.initialize()

        verify { persistence.markDownloadedCurrentAndCurrentOutdated() }
        verify(exactly = 0) { fileOperator.removeFile(any()) }
    }


    @Test
    fun `when reorder enqueued already outdated is removed`() {
        every { persistence.enqueuedReorderAtNextBoot } returns true
        every { persistence.outdatedBundlePath } returns exampleFilePath

        updater.initialize()

        verify { fileOperator.removeFile(exampleFilePath) }
    }

    @Test
    fun `test downloaded manifest returned when newer than stored`() {
        val successSlot = slot<(JSONObject) -> Unit>()

        every { manifestComparator.shouldReplaceBundle(any(), any()) } returns true
        every { api.manifest(capture(successSlot), any()) } answers { successSlot.captured(emptyJson()) }

        val successMock = mockk<(JSONObject) -> Unit>(relaxed = true)
        val error = mockk<(Exception?) -> Unit>()
        updater.downloadAndVerifyManifest(successMock, error)

        verify(exactly = 1) { successMock.invoke(any()) }
        verify(exactly = 0) { error.invoke(any()) }
    }

    @Test
    fun `when manifest not verified there is error`() {
        val successSlot = slot<(JSONObject) -> Unit>()
        val errorSlot = slot<(Exception?) -> Unit>()

        every { manifestValidator.validate(any(), any(), capture(errorSlot)) } answers { errorSlot.captured(Exception("Invalid")) }
        every { api.manifest(capture(successSlot), any()) } answers { successSlot.captured(emptyJson()) }

        val successMock = mockk<(JSONObject) -> Unit>(relaxed = true)
        val error = mockk<(Exception?) -> Unit>(relaxed = true)
        updater.downloadAndVerifyManifest(successMock, error)

        verify(exactly = 0) { successMock.invoke(any()) }
        verify(exactly = 1) { error.invoke(any()) }
    }

    @Test
    fun `test error when manifest comparison fails it is still returned`() {
        val successSlot = slot<(JSONObject) -> Unit>()

        every { manifestComparator.shouldReplaceBundle(any(), any()) } returns false
        every { api.manifest(capture(successSlot), any()) } answers { successSlot.captured(emptyJson()) }

        val successMock = mockk<(JSONObject) -> Unit>(relaxed = true)
        val error = mockk<(Exception?) -> Unit>()
        updater.downloadAndVerifyManifest(successMock, error)

        verify(exactly = 1) { successMock.invoke(any()) }
        verify(exactly = 0) { error.invoke(any()) }
    }

    @Test
    fun `test bundle downloaded and saved`() {
        val inputStreamMock = mockkClass(InputStream::class)

        val successManifestSlot = slot<(JSONObject) -> Unit>()
        every { api.manifest(capture(successManifestSlot), any()) } answers { successManifestSlot.captured(emptyJson()) }

        val successValidatorSlot = slot<(String) -> Unit>()
        every { manifestValidator.validate(any(), capture(successValidatorSlot), any()) } answers
                { successValidatorSlot.captured(jsonWithOneValue(KEY_MANIFEST_BUNDLE_URL, "bundleUrl").toString()) }

        val successBundleSlot = slot<(InputStream) -> Unit>()
        every { api.bundle("bundleUrl", capture(successBundleSlot), any()) } answers { successBundleSlot.captured(inputStreamMock) }

        every { manifestComparator.shouldReplaceBundle(any(), any()) } returns true

        val successMock = mockk<(JSONObject, String) -> Unit>(relaxed = true)
        val unavailableMock = mockk<(JSONObject) -> Unit>()
        val error = mockk<(Exception?) -> Unit>()

        updater.checkAndDownloadUpdate(successMock, unavailableMock, error)

        verify { fileOperator.saveResponseToFile(any(), any()) }
        verify {
            successMock.invoke(
                    match { it.toString() == jsonWithOneValue(KEY_MANIFEST_BUNDLE_URL, "bundleUrl").toString() },
                    exampleFilePath)
        }
        verify(exactly = 0) { persistence.downloadedBundlePath = any() }
        verify(exactly = 0) { persistence.downloadedManifest = any() }
        verify(exactly = 0) { persistence.manifest = any() }
        verify(exactly = 0) { persistence.bundlePath = any() }
    }

    @Test
    fun `test bundle not downloaded and saved when manifest not verified`() {
        val inputStreamMock = mockkClass(InputStream::class)

        val successManifestSlot = slot<(JSONObject) -> Unit>()
        every { api.manifest(capture(successManifestSlot), any()) } answers { successManifestSlot.captured(emptyJson()) }

        val errorValidatorSlot = slot<(Exception?) -> Unit>()
        every { manifestValidator.validate(any(), any(), capture(errorValidatorSlot)) } answers
                { errorValidatorSlot.captured(Exception("Invalid")) }

        val successBundleSlot = slot<(InputStream) -> Unit>()
        every { api.bundle("bundleUrl", capture(successBundleSlot), any()) } answers { successBundleSlot.captured(inputStreamMock) }

        every { manifestComparator.shouldReplaceBundle(any(), any()) } returns true

        val successMock = mockk<(JSONObject, String) -> Unit>(relaxed = true)
        val unavailableMock = mockk<(JSONObject) -> Unit>(relaxed = true)
        val errorMock = mockk<(Exception?) -> Unit>(relaxed = true)

        updater.checkAndDownloadUpdate(successMock, unavailableMock, errorMock)

        verify(exactly = 0) { fileOperator.saveResponseToFile(any(), any()) }
        verify { errorMock.invoke(match { it.message == "Invalid" }) }
        verify(exactly = 0) { persistence.downloadedBundlePath = any() }
        verify(exactly = 0) { persistence.downloadedManifest = any() }
        verify(exactly = 0) { persistence.manifest = any() }
        verify(exactly = 0) { persistence.bundlePath = any() }
    }

    @Test
    fun `test unavailable callback called when comparison fails`() {
        val inputStreamMock = mockkClass(InputStream::class)

        val successManifestSlot = slot<(JSONObject) -> Unit>()
        every { api.manifest(capture(successManifestSlot), any()) } answers { successManifestSlot.captured(emptyJson()) }

        val successValidatorSlot = slot<(String) -> Unit>()
        every { manifestValidator.validate(any(), capture(successValidatorSlot), any()) } answers
                { successValidatorSlot.captured(jsonWithOneValue(KEY_MANIFEST_BUNDLE_URL, "bundleUrl").toString()) }

        val successBundleSlot = slot<(InputStream) -> Unit>()
        every { api.bundle("bundleUrl", capture(successBundleSlot), any()) } answers { successBundleSlot.captured(inputStreamMock) }

        every { manifestComparator.shouldReplaceBundle(any(), any()) } returns false

        val successMock = mockk<(JSONObject, String) -> Unit>(relaxed = true)
        val unavailableMock = mockk<(JSONObject) -> Unit>(relaxed = true)
        val errorMock = mockk<(Exception?) -> Unit>(relaxed = true)

        updater.checkAndDownloadUpdate(successMock, unavailableMock, errorMock)

        verify(exactly = 0) { fileOperator.saveResponseToFile(any(), any()) }
        verify { unavailableMock.invoke(any()) }
        verify { unavailableMock.invoke(match { it.toString() == jsonWithOneValue(KEY_MANIFEST_BUNDLE_URL, "bundleUrl").toString() }) }
        verify(exactly = 0) { persistence.downloadedBundlePath = any() }
        verify(exactly = 0) { persistence.downloadedManifest = any() }
        verify(exactly = 0) { persistence.manifest = any() }
        verify(exactly = 0) { persistence.bundlePath = any() }
    }

    @Test
    fun `test remove outdated bundle`() {
        every { persistence.outdatedBundlePath } returns null
        updater.removeOutdatedBundle()
        verify(exactly = 0) { fileOperator.removeFile(any()) }

        every { persistence.outdatedBundlePath } returns "outdated"
        updater.removeOutdatedBundle()
        verify(exactly = 1) { fileOperator.removeFile(any()) }
    }

    @Test
    fun `test saving new bundle deletes old`() {
        every { persistence.downloadedBundlePath } returns "oldBundle"
        every { persistence.downloadedManifest } returns emptyJson()

        updater.saveDownloadedManifestAndBundlePath(jsonWithOneValue("new", "manifest"), "newBundle")

        verify { fileOperator.removeFile("oldBundle") }
        verify { persistence.downloadedManifest = match { it.toString() == jsonWithOneValue("new", "manifest").toString() } }
        verify { persistence.downloadedBundlePath = "newBundle" }
        verify(exactly = 0) { persistence.manifest }
        verify(exactly = 0) { persistence.bundlePath }
        verify(exactly = 0) { persistence.outdatedBundlePath }
    }

    @Test
    fun `test reload only sets flag`() {
        updater.prepareToReload()

        verify { persistence.enqueuedReorderAtNextBoot = true }
        verify { persistence.synchronize() }
        verify(exactly = 0) { persistence.manifest }
        verify(exactly = 0) { persistence.downloadedManifest }
        verify(exactly = 0) { persistence.bundlePath }
        verify(exactly = 0) { persistence.downloadedBundlePath }
        verify(exactly = 0) { persistence.outdatedBundlePath }
        verify(exactly = 0) {
            persistence.markDownloadedCurrentAndCurrentOutdated()
        }
    }

}
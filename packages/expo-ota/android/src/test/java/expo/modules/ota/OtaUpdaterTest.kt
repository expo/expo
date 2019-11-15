package expo.modules.ota

import io.mockk.*
import io.mockk.impl.annotations.MockK
import junit.framework.TestCase
import org.json.JSONObject
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestReporter
import java.io.File
import java.io.InputStream

class OtaUpdaterTest : TestCase() {

    lateinit var persistence: ExpoOTAPersistence

    @MockK
    lateinit var config: ExpoOTAConfig

    @MockK
    lateinit var embeddedManifestAndBundle: EmbeddedManifestAndBundle

    @MockK
    lateinit var fileOperator: FileOperator

    @MockK
    lateinit var bundleLoader: BundleLoader

    lateinit var updater: OtaUpdater

    @BeforeEach
    fun initMocks(reporter: TestReporter) {
        reporter.publishEntry("BeforeEach")
        MockKAnnotations.init(this)
    }

    @Test
    fun `test nothing happens on storage when boot is not enqueued and embedded manifest is newest`(reporter: TestReporter) {
        persistence = mockOtaPersistence()
        embeddedManifestAndBundle = mockEmbeddedManifest(manifest = emptyJson())

        val slot = slot<String>()
        val successSlot = slot<(BundleLoader.BundleLoadParams, InputStream) -> Unit>()
        val bundleParamsSlot = slot<BundleLoader.BundleLoadParams>()
        every { fileOperator.dirPath(capture(slot)) } answers  { File("/localDir/" + slot.captured) }
        every { config.channelIdentifier } returns ""
        every { fileOperator.saveResponseToFile(any(), any()) } returns  { _, success, _ -> success("/path/to/file") }
        every { bundleLoader.loadJsBundle(capture(bundleParamsSlot), capture(successSlot), any()) } answers {
            successSlot.captured(bundleParamsSlot.captured, mockkClass(InputStream::class))
            true
        }
        updater = OtaUpdater(persistence, config, "id", embeddedManifestAndBundle, bundleLoader, fileOperator)

        verify(exactly = 0) { persistence.setProperty("enqueuedReorderAtNextBoot") }
        verify(exactly = 0) { persistence.setProperty("bundlePath") }
        verify(exactly = 0) { persistence.setProperty("manifest") }
        verify(exactly = 1) { persistence.downloadedManifest = emptyJson() }
        verify(exactly = 0) { persistence.setProperty("downloadedManifest") }
        verify(exactly = 0) { persistence.setProperty("outdatedBundlePath") }
    }

    @Test
    fun testSecond() {
    }

}
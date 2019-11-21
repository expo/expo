package expo.modules.ota

import io.mockk.Runs
import io.mockk.every
import io.mockk.just
import io.mockk.mockkClass
import org.json.JSONObject
import java.io.InputStream

fun emptyJson() = JSONObject("{}")

fun emptyJsonString() = emptyJson().toString()

fun jsonWithOneValue(key: String, value: String): JSONObject {
    return JSONObject("{ \"$key\":\"$value\" }")
}

fun mockOtaPersistence(
        enqueuedReorderAtNextBoot: Boolean = false,
        bundlePath: String? = null,
        downloadedBundlePath: String? = null,
        outdatedBundlePath: String? = null,
        manifest: JSONObject = emptyJson(),
        downloadedManifest: JSONObject = emptyJson(),
        newestManifest: JSONObject = emptyJson()
): ExpoOTAPersistence {
    val otaPersistence: ExpoOTAPersistence = mockkClass(ExpoOTAPersistence::class)
    every { otaPersistence.bundlePath } answers { bundlePath }
    every { otaPersistence.bundlePath = any() } just Runs
    every { otaPersistence.downloadedBundlePath } answers { downloadedBundlePath }
    every { otaPersistence.downloadedBundlePath = any() } just Runs
    every { otaPersistence.outdatedBundlePath } answers { outdatedBundlePath }
    every { otaPersistence.outdatedBundlePath = any() } just Runs
    every { otaPersistence.manifest } answers { manifest }
    every { otaPersistence.manifest = any() } just Runs
    every { otaPersistence.downloadedManifest } answers { downloadedManifest }
    every { otaPersistence.downloadedManifest = any() } just Runs
    every { otaPersistence.newestManifest } answers { newestManifest }
    every { otaPersistence.enqueuedReorderAtNextBoot } answers { enqueuedReorderAtNextBoot }
    every { otaPersistence.enqueuedReorderAtNextBoot = any() } just Runs
    every { otaPersistence.markDownloadedCurrentAndCurrentOutdated() } just Runs
    every { otaPersistence.synchronize() } just Runs
    return otaPersistence
}

fun mockEmbeddedManifest(manifest: JSONObject = emptyJson(), bundle: InputStream = mockkClass(InputStream::class), manifestCompatible: Boolean = true): EmbeddedManifestAndBundle {
    val embeddedManifestAndBundle = mockkClass(EmbeddedManifestAndBundle::class)
    every { embeddedManifestAndBundle.readManifest() } returns manifest
    every { embeddedManifestAndBundle.readBundle() } returns bundle
    every { embeddedManifestAndBundle.isEmbeddedManifestCompatibleWith(any()) } returns manifestCompatible
            return embeddedManifestAndBundle
}
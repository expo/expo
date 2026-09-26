package expo.modules.medialibrary.next.objects.album.factories

import android.content.Context
import android.os.Build
import expo.modules.kotlin.exception.CodedException
import expo.modules.medialibrary.next.objects.asset.deleters.AssetDeleter
import expo.modules.medialibrary.next.objects.asset.factories.AssetFactory
import expo.modules.medialibrary.next.objects.asset.movers.AssetMover
import io.mockk.mockk
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * `Album.create(name, refs)` accepts an array, and the JS layer forwards an empty one unchanged
 * (`AssetAlbum.ts` treats a zero-length array as `string[]`). Both factories must therefore reject
 * an empty list with a `CodedException` that JS can surface, rather than letting an
 * `IndexOutOfBoundsException` escape.
 */
@RunWith(RobolectricTestRunner::class)
internal class AlbumFactoryEmptyInputTests {
  private val context = mockk<Context>(relaxed = true)
  private val assetFactory = mockk<AssetFactory>(relaxed = true)
  private val assetDeleter = mockk<AssetDeleter>(relaxed = true)
  private val assetMover = mockk<AssetMover>(relaxed = true)

  @Test
  @Config(sdk = [Build.VERSION_CODES.P])
  fun `legacy factory rejects an empty asset list`() {
    // given
    val factory = AlbumLegacyFactory(assetFactory, assetDeleter, assetMover, context)

    // then
    assertThrows(CodedException::class.java) {
      runBlocking { factory.createFromAssets("My Album", emptyList(), false) }
    }
  }

  @Test
  @Config(sdk = [Build.VERSION_CODES.P])
  fun `legacy factory rejects an empty file path list`() {
    // given
    val factory = AlbumLegacyFactory(assetFactory, assetDeleter, assetMover, context)

    // then
    assertThrows(CodedException::class.java) {
      runBlocking { factory.createFromFilePaths("My Album", emptyList()) }
    }
  }
}

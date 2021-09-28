package expo.modules.medialibrary.assets

import android.os.Bundle
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.mockCursor
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.unmockkStatic
import io.mockk.verify
import io.mockk.verifyOrder
import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

@RunWith(RobolectricTestRunner::class)
internal class AssetUtilsTests {
  @After
  fun tearDown() {
    clearAllMocks()
  }

  @Test
  fun `putAssetsInfo returns correct response when fullInfo=false`() {
    // arrange
    val cursor = mockCursor(
      arrayOf(
        MockData.mockVideo.toColumnArray(),
        MockData.mockAudio.toColumnArray()
      )
    )

    val contentResolver = mockContentResolver(cursor)

    mockkStatic(MediaLibraryUtils::class)
    every {
      MediaLibraryUtils.getSizeFromCursor(contentResolver, any(), cursor, any(), any())
    } returns intArrayOf(0, 0) andThen intArrayOf(100, 200)

    // act
    val result = mutableListOf<Bundle>()
    putAssetsInfo(contentResolver, cursor, result, limit = 5, offset = 0, resolveWithFullInfo = false)

    // assert
    verify(exactly = 0) {
      MediaLibraryUtils.getExifLocation(any(), any())
      MediaLibraryUtils.getExifLocation(any(), any())
    }

    assertEquals(2, result.size)

    assertEquals(MockData.mockVideo.id.toString(), result[0].getString("id"))
    assertEquals("file://${MockData.mockVideo.path}", result[0].getString("uri"))

    assertNull(result[0].getString("localUri"))
  }
}

package expo.modules.medialibrary

import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.verifyOrder
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

@RunWith(RobolectricTestRunner::class)
internal class MediaLibraryUtilsTests {
  @After
  fun tearDown() {
    clearAllMocks()
  }

  @Test
  fun `getInPart() should return correct result`() {
    // arrange
    val assetIds = arrayOf("aaa", "bbb", "ccc")

    // act
    val result = MediaLibraryUtils.queryPlaceholdersFor(assetIds)

    // assert
    assertEquals("?,?,?", result)
  }

  @Test
  fun `getFileNameAndExtension should return correct values`() {
    // arrange
    val filename = "example.dat"

    // act
    val result = MediaLibraryUtils.getFileNameAndExtension(filename)

    // assert
    assertEquals("example", result.first)
    assertEquals(".dat", result.second)
  }

  @Test
  fun `safeMoveFile should copy and delete`() {
    // arrange
    mockkObject(MediaLibraryUtils)
    val src = mockk<File>(relaxed = true)
    val dir = mockk<File>(relaxed = true)
    every { MediaLibraryUtils.safeCopyFile(src, dir) } returns src

    // act
    MediaLibraryUtils.safeMoveFile(src, dir)

    // assert
    verifyOrder {
      MediaLibraryUtils.safeCopyFile(src, dir)
      src.delete()
    }
  }
}

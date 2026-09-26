package expo.modules.medialibrary.next.records

import android.provider.MediaStore
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * `AssetField` is the only place that ties the public JS field names to MediaStore columns.
 * A wrong column name surfaces as an opaque `IllegalArgumentException: Invalid column` from the
 * content resolver at query time, so it is worth pinning here.
 */
@RunWith(RobolectricTestRunner::class)
internal class AssetFieldTests {
  @Test
  fun `exposes the api names used by the JS AssetField enum`() {
    // then
    assertEquals("creationTime", AssetField.CREATION_TIME.key)
    assertEquals("modificationTime", AssetField.MODIFICATION_TIME.key)
    assertEquals("mediaType", AssetField.MEDIA_TYPE.key)
    assertEquals("width", AssetField.WIDTH.key)
    assertEquals("height", AssetField.HEIGHT.key)
    assertEquals("duration", AssetField.DURATION.key)
    assertEquals("isFavorite", AssetField.IS_FAVORITE.key)
  }

  @Test
  fun `maps every field to a MediaStore column`() {
    // then
    assertEquals(
      MediaStore.Images.Media.DATE_TAKEN,
      AssetField.CREATION_TIME.toMediaStoreColumn()
    )
    assertEquals(
      MediaStore.Images.Media.DATE_MODIFIED,
      AssetField.MODIFICATION_TIME.toMediaStoreColumn()
    )
    assertEquals(
      MediaStore.Files.FileColumns.MEDIA_TYPE,
      AssetField.MEDIA_TYPE.toMediaStoreColumn()
    )
    assertEquals(MediaStore.MediaColumns.WIDTH, AssetField.WIDTH.toMediaStoreColumn())
    assertEquals(MediaStore.MediaColumns.HEIGHT, AssetField.HEIGHT.toMediaStoreColumn())
    assertEquals(
      MediaStore.Video.VideoColumns.DURATION,
      AssetField.DURATION.toMediaStoreColumn()
    )
    assertEquals(
      MediaStore.MediaColumns.IS_FAVORITE,
      AssetField.IS_FAVORITE.toMediaStoreColumn()
    )
  }

  @Test
  fun `resolves a column for every declared field`() {
    // given a new field must not be added without a column mapping
    // then
    for (field in AssetField.entries) {
      assertEquals(true, field.toMediaStoreColumn().isNotEmpty())
    }
  }
}

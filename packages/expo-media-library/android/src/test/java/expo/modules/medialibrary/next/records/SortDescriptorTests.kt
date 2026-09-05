package expo.modules.medialibrary.next.records

import android.provider.MediaStore
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class SortDescriptorTests {
  @Test
  fun `sorts ascending by default`() {
    // given `ascending` is optional in the JS SortDescriptor
    val descriptor = SortDescriptor(key = AssetField.CREATION_TIME)

    // then
    assertEquals(
      "${MediaStore.Images.Media.DATE_TAKEN} ASC",
      descriptor.toMediaStoreQueryString()
    )
  }

  @Test
  fun `sorts ascending when ascending is explicitly null`() {
    // given the JS caller passed `{ key }` without `ascending`
    val descriptor = SortDescriptor(key = AssetField.HEIGHT, ascending = null)

    // then
    assertEquals("${MediaStore.MediaColumns.HEIGHT} ASC", descriptor.toMediaStoreQueryString())
  }

  @Test
  fun `sorts descending when ascending is false`() {
    // given
    val descriptor = SortDescriptor(key = AssetField.MODIFICATION_TIME, ascending = false)

    // then
    assertEquals(
      "${MediaStore.Images.Media.DATE_MODIFIED} DESC",
      descriptor.toMediaStoreQueryString()
    )
  }

  @Test
  fun `builds a query string for every field`() {
    // then
    for (field in AssetField.entries) {
      val descriptor = SortDescriptor(key = field, ascending = true)
      assertEquals("${field.toMediaStoreColumn()} ASC", descriptor.toMediaStoreQueryString())
    }
  }
}

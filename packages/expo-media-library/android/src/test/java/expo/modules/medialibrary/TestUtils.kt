package expo.modules.medialibrary

import android.content.ContentResolver
import android.database.Cursor
import io.mockk.every
import io.mockk.mockk
import org.robolectric.fakes.RoboCursor

fun mockCursor(cursorResults: Array<Array<out Any?>>): Cursor {
  val cursor = RoboCursor()
  cursor.setColumnNames(MediaLibraryConstants.ASSET_PROJECTION.toMutableList())
  cursor.setResults(cursorResults)
  return cursor
}

fun mockContentResolver(cursor: Cursor): ContentResolver {
  val contentResolver = mockk<ContentResolver>()
  every { contentResolver.query(MediaLibraryConstants.EXTERNAL_CONTENT, MediaLibraryConstants.ASSET_PROJECTION, any(), any(), any()) } returns cursor
  return contentResolver
}
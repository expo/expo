package expo.modules.calendar.next.domain.repositories.extendedproperty

import android.content.ContentResolver
import android.content.ContentValues
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.dto.extendedproperty.ExtendedPropertyInput
import expo.modules.calendar.next.domain.model.calendar.CalendarAccount
import expo.modules.calendar.next.domain.model.extendedproperty.ExtendedPropertyEntity
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ExtendedPropertyId
import expo.modules.calendar.next.exceptions.CouldNotExecuteQueryException
import expo.modules.calendar.next.exceptions.PermissionException
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ExtendedPropertyRepositoryTest {
  private val contentResolver = mockk<ContentResolver>()
  private val repository = ExtendedPropertyRepository(contentResolver)
  private val account = CalendarAccount(name = "user@example.com", type = "com.google")

  // region findAllByEventId

  @Test
  fun `given cursor has no rows, when findAllByEventId, then returns empty list`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns emptyCursor()

    // When
    val result = repository.findAllByEventId(EventId(1L))

    // Then
    Assert.assertEquals(emptyList<ExtendedPropertyEntity>(), result)
  }

  @Test
  fun `given cursor with data, when findAllByEventId, then maps cursor rows to ExtendedPropertyEntity`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        CalendarContract.ExtendedProperties._ID to 5L,
        CalendarContract.ExtendedProperties.NAME to "private:x-owner",
        CalendarContract.ExtendedProperties.VALUE to "mirror-42"
      ),
      mapOf(
        CalendarContract.ExtendedProperties._ID to 6L,
        CalendarContract.ExtendedProperties.NAME to "shared:x-topic",
        CalendarContract.ExtendedProperties.VALUE to "standup"
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAllByEventId(EventId(99L))

    // Then
    Assert.assertEquals(2, result.size)
    Assert.assertEquals(ExtendedPropertyId(5L), result[0].id)
    Assert.assertEquals(EventId(99L), result[0].eventId)
    Assert.assertEquals("private:x-owner", result[0].name)
    Assert.assertEquals("mirror-42", result[0].value)
    Assert.assertEquals(ExtendedPropertyId(6L), result[1].id)
    Assert.assertEquals("shared:x-topic", result[1].name)
    Assert.assertEquals("standup", result[1].value)
  }

  @Test
  fun `given event id, when findAllByEventId, then reads through the plain URI selecting on EVENT_ID`() = runTest {
    // Given
    val uriSlot = slot<Uri>()
    val selectionSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()
    every {
      contentResolver.query(capture(uriSlot), any(), capture(selectionSlot), capture(selectionArgsSlot), any())
    } returns emptyCursor()

    // When
    repository.findAllByEventId(EventId(42L))

    // Then
    // Reading is allowed for ordinary callers, so the sync adapter parameters must not be added here.
    Assert.assertEquals(CalendarContract.ExtendedProperties.CONTENT_URI, uriSlot.captured)
    Assert.assertNull(uriSlot.captured.getQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER))
    Assert.assertEquals("${CalendarContract.ExtendedProperties.EVENT_ID} = ?", selectionSlot.captured)
    Assert.assertArrayEquals(arrayOf("42"), selectionArgsSlot.captured)
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when findAllByEventId, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.findAllByEventId(EventId(1L))
  }

  @Test(expected = CouldNotExecuteQueryException::class)
  fun `given null cursor, when findAllByEventId, then throws CouldNotExecuteQueryException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns null

    // When / Then
    repository.findAllByEventId(EventId(1L))
  }

  // endregion

  // region findAllByName

  @Test
  fun `given a name, when findAllByName, then selects on both EVENT_ID and NAME`() = runTest {
    // Given
    val selectionSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()
    every {
      contentResolver.query(any(), any(), capture(selectionSlot), capture(selectionArgsSlot), any())
    } returns emptyCursor()

    // When
    val result = repository.findAllByName(EventId(42L), "private:x-owner")

    // Then
    Assert.assertEquals(emptyList<ExtendedPropertyEntity>(), result)
    Assert.assertEquals(
      "${CalendarContract.ExtendedProperties.EVENT_ID} = ? AND ${CalendarContract.ExtendedProperties.NAME} = ?",
      selectionSlot.captured
    )
    Assert.assertArrayEquals(arrayOf("42", "private:x-owner"), selectionArgsSlot.captured)
  }

  // endregion

  // region upsert

  @Test
  fun `given no existing property, when upsert, then inserts through the sync adapter URI`() = runTest {
    // Given
    val uriSlot = slot<Uri>()
    val valuesSlot = slot<ContentValues>()
    val insertedUri = mockk<Uri>()
    every { insertedUri.lastPathSegment } returns "7"
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns emptyCursor()
    every { contentResolver.insert(capture(uriSlot), capture(valuesSlot)) } returns insertedUri

    // When
    val result = repository.upsert(
      EventId(42L),
      account,
      ExtendedPropertyInput(name = "private:x-owner", value = "mirror-42")
    )

    // Then
    // CalendarProvider2 refuses writes to this table unless the caller declares itself
    // the sync adapter of the owning account.
    Assert.assertEquals(ExtendedPropertyId(7L), result)
    Assert.assertEquals("true", uriSlot.captured.getQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER))
    Assert.assertEquals("user@example.com", uriSlot.captured.getQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME))
    Assert.assertEquals("com.google", uriSlot.captured.getQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE))
    Assert.assertEquals(42L, valuesSlot.captured.getAsLong(CalendarContract.ExtendedProperties.EVENT_ID).toLong())
    Assert.assertEquals("private:x-owner", valuesSlot.captured.getAsString(CalendarContract.ExtendedProperties.NAME))
    Assert.assertEquals("mirror-42", valuesSlot.captured.getAsString(CalendarContract.ExtendedProperties.VALUE))
  }

  @Test
  fun `given an existing property, when upsert, then updates that row instead of inserting a duplicate`() = runTest {
    // Given
    val uriSlot = slot<Uri>()
    val valuesSlot = slot<ContentValues>()
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursorWithRows(
      mapOf(
        CalendarContract.ExtendedProperties._ID to 5L,
        CalendarContract.ExtendedProperties.NAME to "private:x-owner",
        CalendarContract.ExtendedProperties.VALUE to "mirror-1"
      )
    )
    every { contentResolver.update(capture(uriSlot), capture(valuesSlot), any(), any()) } returns 1

    // When
    val result = repository.upsert(
      EventId(42L),
      account,
      ExtendedPropertyInput(name = "private:x-owner", value = "mirror-2")
    )

    // Then
    // The provider only understands updates addressed to a single row, hence the id in the path.
    Assert.assertEquals(ExtendedPropertyId(5L), result)
    Assert.assertEquals("5", uriSlot.captured.lastPathSegment)
    Assert.assertEquals("true", uriSlot.captured.getQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER))
    Assert.assertEquals("mirror-2", valuesSlot.captured.getAsString(CalendarContract.ExtendedProperties.VALUE))
    verify(exactly = 0) { contentResolver.insert(any(), any()) }
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when upsert, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns emptyCursor()
    every { contentResolver.insert(any(), any()) } throws SecurityException()

    // When / Then
    repository.upsert(EventId(42L), account, ExtendedPropertyInput("private:x-owner", "mirror-42"))
  }

  @Test
  fun `given duplicate rows under one name, when upsert, then updates the first and removes the rest`() = runTest {
    // Given
    // The table has no unique constraint on (EVENT_ID, NAME), so a name can carry several rows.
    val updatedUriSlot = slot<Uri>()
    val deletedUris = mutableListOf<Uri>()
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursorWithRows(
      mapOf(
        CalendarContract.ExtendedProperties._ID to 5L,
        CalendarContract.ExtendedProperties.NAME to "private:x-owner",
        CalendarContract.ExtendedProperties.VALUE to "mirror-1"
      ),
      mapOf(
        CalendarContract.ExtendedProperties._ID to 6L,
        CalendarContract.ExtendedProperties.NAME to "private:x-owner",
        CalendarContract.ExtendedProperties.VALUE to "mirror-1-duplicate"
      )
    )
    every { contentResolver.update(capture(updatedUriSlot), any(), any(), any()) } returns 1
    every { contentResolver.delete(capture(deletedUris), any(), any()) } returns 1

    // When
    val result = repository.upsert(
      EventId(42L),
      account,
      ExtendedPropertyInput(name = "private:x-owner", value = "mirror-2")
    )

    // Then
    Assert.assertEquals(ExtendedPropertyId(5L), result)
    Assert.assertEquals("5", updatedUriSlot.captured.lastPathSegment)
    Assert.assertEquals(listOf("6"), deletedUris.map { it.lastPathSegment })
    verify(exactly = 0) { contentResolver.insert(any(), any()) }
  }

  // endregion

  // region deleteByName

  @Test
  fun `given an existing property, when deleteByName, then deletes that row through the sync adapter URI`() = runTest {
    // Given
    val uriSlot = slot<Uri>()
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursorWithRows(
      mapOf(
        CalendarContract.ExtendedProperties._ID to 5L,
        CalendarContract.ExtendedProperties.NAME to "private:x-owner",
        CalendarContract.ExtendedProperties.VALUE to "mirror-42"
      )
    )
    every { contentResolver.delete(capture(uriSlot), any(), any()) } returns 1

    // When
    val result = repository.deleteByName(EventId(42L), account, "private:x-owner")

    // Then
    Assert.assertTrue(result)
    Assert.assertEquals("5", uriSlot.captured.lastPathSegment)
    Assert.assertEquals("true", uriSlot.captured.getQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER))
  }

  @Test
  fun `given no such property, when deleteByName, then returns false without touching the provider`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns emptyCursor()

    // When
    val result = repository.deleteByName(EventId(42L), account, "private:x-owner")

    // Then
    Assert.assertFalse(result)
    verify(exactly = 0) { contentResolver.delete(any(), any(), any()) }
  }

  @Test
  fun `given duplicate rows under one name, when deleteByName, then removes every row`() = runTest {
    // Given
    val deletedUris = mutableListOf<Uri>()
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursorWithRows(
      mapOf(
        CalendarContract.ExtendedProperties._ID to 5L,
        CalendarContract.ExtendedProperties.NAME to "private:x-owner",
        CalendarContract.ExtendedProperties.VALUE to "mirror-42"
      ),
      mapOf(
        CalendarContract.ExtendedProperties._ID to 6L,
        CalendarContract.ExtendedProperties.NAME to "private:x-owner",
        CalendarContract.ExtendedProperties.VALUE to "mirror-42-duplicate"
      )
    )
    every { contentResolver.delete(capture(deletedUris), any(), any()) } returns 1

    // When
    val result = repository.deleteByName(EventId(42L), account, "private:x-owner")

    // Then
    // Leaving a duplicate behind would make the delete report a success it did not deliver.
    Assert.assertTrue(result)
    Assert.assertEquals(listOf("5", "6"), deletedUris.map { it.lastPathSegment })
  }

  // endregion

  // region helpers

  private fun emptyCursor(): Cursor {
    // Empty cursor requires at least one column for MatrixCursor
    return MatrixCursor(arrayOf(CalendarContract.ExtendedProperties._ID))
  }

  private fun cursorWithRows(vararg rows: Map<String, Any?>): Cursor {
    if (rows.isEmpty()) {
      return emptyCursor()
    }

    val columnNames = rows.first().keys.toTypedArray()
    val cursor = MatrixCursor(columnNames)

    for (row in rows) {
      val rowValues = columnNames.map { columnName -> row[columnName] }.toTypedArray()
      cursor.addRow(rowValues)
    }

    return cursor
  }

  // endregion
}

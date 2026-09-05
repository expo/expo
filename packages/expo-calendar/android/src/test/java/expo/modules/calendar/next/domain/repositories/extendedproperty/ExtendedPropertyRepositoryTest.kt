package expo.modules.calendar.next.domain.repositories.extendedproperty

import android.content.ContentProviderOperation
import android.content.ContentProviderResult
import android.content.ContentResolver
import android.content.OperationApplicationException
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
  fun `given a row without a name or a value, when findAllByEventId, then keeps the nulls`() = runTest {
    // Given
    // No database constraint forbids either column being null, so the entity has to carry what is
    // there rather than refuse to map the row.
    val cursor = cursorWithRows(
      mapOf(
        CalendarContract.ExtendedProperties._ID to 5L,
        CalendarContract.ExtendedProperties.NAME to null,
        CalendarContract.ExtendedProperties.VALUE to null
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAllByEventId(EventId(99L))

    // Then
    Assert.assertEquals(1, result.size)
    Assert.assertNull(result[0].name)
    Assert.assertNull(result[0].value)
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

  // region upsert

  @Test
  fun `given a name and a value, when upsert, then deletes and inserts in one batch through the sync adapter URI`() = runTest {
    // Given
    val authoritySlot = slot<String>()
    val operationsSlot = slot<ArrayList<ContentProviderOperation>>()
    every { contentResolver.applyBatch(capture(authoritySlot), capture(operationsSlot)) } returns arrayOf(
      ContentProviderResult(1),
      ContentProviderResult(Uri.parse("content://com.android.calendar/extendedproperties/7"))
    )

    // When
    val result = repository.upsert(
      EventId(42L),
      account,
      ExtendedPropertyInput(name = "private:x-owner", value = "mirror-42")
    )

    // Then
    // The provider applies a batch as one transaction, so the row a concurrent write could have
    // left behind is gone and the new one is in place without a window between the two.
    Assert.assertEquals(ExtendedPropertyId(7L), result)
    Assert.assertEquals(CalendarContract.AUTHORITY, authoritySlot.captured)
    Assert.assertEquals(2, operationsSlot.captured.size)
    Assert.assertTrue(operationsSlot.captured[0].isDelete)
    Assert.assertTrue(operationsSlot.captured[1].isInsert)
    operationsSlot.captured.forEach { operation ->
      Assert.assertEquals("true", operation.uri.getQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER))
      Assert.assertEquals("user@example.com", operation.uri.getQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME))
      Assert.assertEquals("com.google", operation.uri.getQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE))
    }
  }

  @Test(expected = IllegalStateException::class)
  fun `given a batch result without a URI, when upsert, then throws IllegalStateException`() = runTest {
    // Given
    every { contentResolver.applyBatch(any(), any()) } returns arrayOf(ContentProviderResult(1))

    // When / Then
    repository.upsert(EventId(42L), account, ExtendedPropertyInput("private:x-owner", "mirror-42"))
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when upsert, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.applyBatch(any(), any()) } throws SecurityException()

    // When / Then
    repository.upsert(EventId(42L), account, ExtendedPropertyInput("private:x-owner", "mirror-42"))
  }

  @Test(expected = CouldNotExecuteQueryException::class)
  fun `given a rejected batch, when upsert, then throws CouldNotExecuteQueryException`() = runTest {
    // Given
    every { contentResolver.applyBatch(any(), any()) } throws OperationApplicationException()

    // When / Then
    repository.upsert(EventId(42L), account, ExtendedPropertyInput("private:x-owner", "mirror-42"))
  }

  // endregion

  // region deleteByName

  @Test
  fun `given a name, when deleteByName, then removes every matching row through the sync adapter URI`() = runTest {
    // Given
    val uriSlot = slot<Uri>()
    val whereSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()
    every {
      contentResolver.delete(capture(uriSlot), capture(whereSlot), capture(selectionArgsSlot))
    } returns 2

    // When
    val result = repository.deleteByName(EventId(42L), account, "private:x-owner")

    // Then
    // Selecting on the name rather than on a row id removes the duplicates the table allows.
    Assert.assertTrue(result)
    Assert.assertEquals("true", uriSlot.captured.getQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER))
    Assert.assertEquals(
      "${CalendarContract.ExtendedProperties.EVENT_ID} = ? AND ${CalendarContract.ExtendedProperties.NAME} = ?",
      whereSlot.captured
    )
    Assert.assertArrayEquals(arrayOf("42", "private:x-owner"), selectionArgsSlot.captured)
  }

  @Test
  fun `given no matching row, when deleteByName, then returns false`() = runTest {
    // Given
    every { contentResolver.delete(any(), any(), any()) } returns 0

    // When
    val result = repository.deleteByName(EventId(42L), account, "private:x-owner")

    // Then
    Assert.assertFalse(result)
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

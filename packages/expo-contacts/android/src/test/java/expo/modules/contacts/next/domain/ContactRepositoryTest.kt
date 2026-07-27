package expo.modules.contacts.next.domain

import android.content.ContentResolver
import android.database.Cursor
import android.database.MatrixCursor
import android.provider.ContactsContract.CommonDataKinds.Phone
import expo.modules.contacts.next.domain.model.phone.PhoneField
import expo.modules.contacts.next.domain.model.phone.PhoneLabel
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.domain.wrappers.DataId
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ContactRepositoryTest {
  private val contentResolver = mockk<ContentResolver>()
  private val repository = ContactRepository(contentResolver)

  @Test
  fun `given phone row with custom type and null label, when getFieldFromData, then maps to malformed custom`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        DataId.COLUMN_IN_DATA_TABLE to 10L,
        Phone.NUMBER to "123456789",
        Phone.TYPE to Phone.TYPE_CUSTOM,
        Phone.LABEL to null
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.getFieldFromData(PhoneField, ContactId("1"))

    // Then
    Assert.assertEquals(1, result.size)
    Assert.assertEquals(DataId("10"), result.first().dataId)
    Assert.assertEquals("123456789", result.first().number)
    Assert.assertTrue(result.first().label is PhoneLabel.MalformedCustom)
  }

  @Test
  fun `given phone row with null type and non-null label, when getFieldFromData, then maps to malformed type with label`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        DataId.COLUMN_IN_DATA_TABLE to 10L,
        Phone.NUMBER to "123456789",
        Phone.TYPE to null,
        Phone.LABEL to "SomeLabel"
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.getFieldFromData(PhoneField, ContactId("1"))

    // Then
    Assert.assertEquals(1, result.size)
    Assert.assertTrue(result.first().label is PhoneLabel.MalformedType)
    Assert.assertEquals("SomeLabel", (result.first().label as PhoneLabel.MalformedType).label)
  }

  private fun cursorWithRows(vararg rows: Map<String, Any?>): Cursor {
    val columnNames = rows.first().keys.toTypedArray()
    val cursor = MatrixCursor(columnNames)

    for (row in rows) {
      val rowValues = columnNames.map { columnName -> row[columnName] }.toTypedArray()
      cursor.addRow(rowValues)
    }

    return cursor
  }
}

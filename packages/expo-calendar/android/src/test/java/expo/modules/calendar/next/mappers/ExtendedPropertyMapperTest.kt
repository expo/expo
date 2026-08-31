package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.model.extendedproperty.ExtendedPropertyEntity
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ExtendedPropertyId
import org.junit.Assert
import org.junit.Test

class ExtendedPropertyMapperTest {
  private val mapper = ExtendedPropertyMapper()

  @Test
  fun `given ExtendedPropertyEntity, when toRecord, then maps name and value`() {
    // Given
    val entity = ExtendedPropertyEntity(
      id = ExtendedPropertyId(5L),
      eventId = EventId(9L),
      name = "private:x-owner",
      value = "mirror-42"
    )

    // When
    val result = mapper.toRecord(entity)

    // Then
    Assert.assertEquals("private:x-owner", result?.name)
    Assert.assertEquals("mirror-42", result?.value)
  }

  @Test
  fun `given an entity without a name, when toRecord, then returns null`() {
    // Given
    // Nothing constrains the column, so the provider can hand back a row with no name.
    val entity = ExtendedPropertyEntity(
      id = ExtendedPropertyId(5L),
      eventId = EventId(9L),
      name = null,
      value = "mirror-42"
    )

    // When / Then
    Assert.assertNull(mapper.toRecord(entity))
  }

  @Test
  fun `given an entity without a value, when toRecord, then returns null`() {
    // Given
    val entity = ExtendedPropertyEntity(
      id = ExtendedPropertyId(5L),
      eventId = EventId(9L),
      name = "private:x-owner",
      value = null
    )

    // When / Then
    Assert.assertNull(mapper.toRecord(entity))
  }

  @Test
  fun `given a name and a value, when toInput, then keeps the name verbatim`() {
    // Given / When
    val result = mapper.toInput("shared:x-owner", "mirror-42")

    // Then
    // The prefix is part of the name the provider stores, so nothing is stripped or added here.
    Assert.assertEquals("shared:x-owner", result.name)
    Assert.assertEquals("mirror-42", result.value)
  }
}

package expo.modules.contacts.next.mappers

import expo.modules.contacts.next.records.fields.ContactField
import expo.modules.contacts.next.services.ImageByteArrayConverter
import io.mockk.mockk
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ContactRecordDomainMapperTest {
  private val imageByteArrayConverter = mockk<ImageByteArrayConverter>()
  private val mapper = ContactRecordDomainMapper(imageByteArrayConverter)

  @Test
  fun `iOS-only fields are filtered out`() {
    val iosOnlyFields = listOf(
      ContactField.NICKNAME,
      ContactField.MAIDEN_NAME,
      ContactField.IM_ADDRESS,
      ContactField.SOCIAL_PROFILES,
      ContactField.BIRTHDAY,
      ContactField.NON_GREGORIAN_BIRTHDAY
    )

    iosOnlyFields.forEach { field ->
      val extractableFields = mapper.toExtractableFields(listOf(field))

      Assert.assertTrue("$field should be filtered out", extractableFields.isEmpty())
    }
  }
}

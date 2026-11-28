package expo.modules.contacts.next.intents

import android.net.Uri
import android.provider.ContactsContract.CommonDataKinds.Email
import android.provider.ContactsContract.CommonDataKinds.Phone
import android.provider.ContactsContract.CommonDataKinds.StructuredName
import android.provider.ContactsContract.CommonDataKinds.StructuredPostal
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.email.EmailField
import expo.modules.contacts.next.domain.model.event.EventField
import expo.modules.contacts.next.domain.model.headers.DisplayNameField
import expo.modules.contacts.next.domain.model.headers.starred.StarredField
import expo.modules.contacts.next.domain.model.nickname.NicknameField
import expo.modules.contacts.next.domain.model.organization.OrganizationField
import expo.modules.contacts.next.domain.model.phone.PhoneField
import expo.modules.contacts.next.domain.model.relationship.RelationField
import expo.modules.contacts.next.domain.model.structuredname.StructuredNameField
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalField
import expo.modules.contacts.next.domain.model.website.WebsiteField

class ContactDetailsPickerRequest(extractableFields: Set<ExtractableField<*>>) {
  val sharedFields = extractableFields.intersect(FIELDS_SHARED_BY_PICKER)

  private val sharedDataFields = sharedFields.filterIsInstance<ExtractableField.Data<*>>()

  val mimeTypes: List<String> =
    sharedDataFields
      .map { it.mimeType }
      .distinct()
      .ifEmpty { listOf(StructuredName.CONTENT_ITEM_TYPE) }

  val singleDataKindUri: Uri? =
    when (sharedDataFields.singleOrNull()) {
      PhoneField -> Phone.CONTENT_URI
      EmailField -> Email.CONTENT_URI
      StructuredPostalField -> StructuredPostal.CONTENT_URI
      else -> null
    }

  companion object {
    private val FIELDS_SHARED_BY_PICKER: Set<ExtractableField<*>> = setOf(
      DisplayNameField,
      StarredField,
      StructuredNameField,
      OrganizationField,
      EmailField,
      PhoneField,
      StructuredPostalField,
      EventField,
      RelationField,
      WebsiteField,
      NicknameField
    )
  }
}

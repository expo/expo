package expo.modules.contacts.next.domain.query

import android.database.Cursor
import android.provider.ContactsContract
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.contact.ExistingContact
import expo.modules.contacts.next.domain.model.email.operations.ExistingEmail
import expo.modules.contacts.next.domain.model.event.operations.ExistingEvent
import expo.modules.contacts.next.domain.model.headers.DisplayName
import expo.modules.contacts.next.domain.model.headers.PhotoThumbnailUri
import expo.modules.contacts.next.domain.model.headers.PhotoUri
import expo.modules.contacts.next.domain.model.headers.starred.Starred
import expo.modules.contacts.next.domain.model.nickname.operations.ExistingNickname
import expo.modules.contacts.next.domain.model.note.operations.ExistingNote
import expo.modules.contacts.next.domain.model.organization.operations.ExistingOrganization
import expo.modules.contacts.next.domain.model.phone.operations.ExistingPhone
import expo.modules.contacts.next.domain.model.photo.operations.ExistingPhoto
import expo.modules.contacts.next.domain.model.relationship.operations.ExistingRelation
import expo.modules.contacts.next.domain.model.structuredname.operations.ExistingStructuredName
import expo.modules.contacts.next.domain.model.structuredpostal.operations.ExistingStructuredPostal
import expo.modules.contacts.next.domain.model.website.operations.ExistingWebsite
import expo.modules.contacts.next.domain.wrappers.ContactId

class QueryAggregator() {
  companion object {
    fun aggregate(
      cursor: Cursor,
      extractors: Set<ExtractableField<*>>,
    ): List<ExistingContact> {
      val contactsExtractors = mutableListOf<ExtractableField.Contacts<*>>()
      val dataExtractorsByMimeType = mutableMapOf<String, ExtractableField.Data<*>>()

      extractors.forEach { field ->
        when (field) {
          is ExtractableField.Contacts -> contactsExtractors.add(field)
          is ExtractableField.Data -> dataExtractorsByMimeType[field.mimeType] = field
        }
      }

      val contactBuildersByContactId = mutableMapOf<String, ContactModelBuilder>()
      while (cursor.moveToNext()) {
        val contactId = cursor.getString(cursor.getColumnIndexOrThrow(ContactId.COLUMN_IN_DATA_TABLE))
        val mime = cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.Data.MIMETYPE))
        val builder = contactBuildersByContactId.getOrPut(contactId) {
          val newBuilder = ContactModelBuilder(ContactId(contactId))
          contactsExtractors.forEach {
            newBuilder.addModel(it.extract(cursor))
          }
          newBuilder
        }
        val model = dataExtractorsByMimeType[mime]?.extract(cursor)
        model?.let {
          builder.addModel(model)
        }
      }
      return contactBuildersByContactId.values.map { it.build() }
    }

    fun <T : Extractable.Data> aggregateOneField(cursor: Cursor, extractor: ExtractableField.Data<T>) = buildList {
      while (cursor.moveToNext()) {
        add(extractor.extract(cursor))
      }
    }

    fun <T : Extractable> aggregateOneFieldFromContacts(cursor: Cursor, extractor: ExtractableField.Contacts<T>): T? {
      if (!cursor.moveToFirst()) {
        return null
      }
      return extractor.extract(cursor)
    }
  }
  class ContactModelBuilder(val contactId: ContactId) {
    var displayName: DisplayName? = null
    var starred: Starred? = null
    var photoUri: PhotoUri? = null
    var photoThumbnailUri: PhotoThumbnailUri? = null
    var structuredName: ExistingStructuredName? = null
    var organization: ExistingOrganization? = null
    var note: ExistingNote? = null
    var photo: ExistingPhoto? = null
    val emails = mutableListOf<ExistingEmail>()
    val events = mutableListOf<ExistingEvent>()
    val nicknames = mutableListOf<ExistingNickname>()
    val phones = mutableListOf<ExistingPhone>()
    val relations = mutableListOf<ExistingRelation>()
    val structuredPostals = mutableListOf<ExistingStructuredPostal>()
    val websites = mutableListOf<ExistingWebsite>()

    fun addModel(extractable: Extractable?) {
      when (extractable) {
        is Starred -> starred = extractable
        is DisplayName -> displayName = extractable
        is PhotoUri -> photoUri = extractable
        is PhotoThumbnailUri -> photoThumbnailUri = extractable
        is ExistingStructuredName -> structuredName = extractable
        is ExistingOrganization -> organization = extractable
        is ExistingNote -> note = extractable
        is ExistingPhoto -> photo = extractable
        is ExistingEmail -> emails.add(extractable)
        is ExistingEvent -> events.add(extractable)
        is ExistingNickname -> nicknames.add(extractable)
        is ExistingPhone -> phones.add(extractable)
        is ExistingRelation -> relations.add(extractable)
        is ExistingStructuredPostal -> structuredPostals.add(extractable)
        is ExistingWebsite -> websites.add(extractable)
      }
    }

    fun build() = ExistingContact(
      contactId = contactId,
      displayName = displayName,
      starred = starred,
      photoUri = photoUri,
      photoThumbnailUri = photoThumbnailUri,
      structuredName = structuredName,
      organization = organization,
      note = note,
      photo = photo,
      emails = emails,
      events = events,
      nicknames = nicknames,
      phones = phones,
      relations = relations,
      structuredPostals = structuredPostals,
      websites = websites
    )
  }

}
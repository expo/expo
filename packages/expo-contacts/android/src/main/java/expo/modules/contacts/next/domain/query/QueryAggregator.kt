package expo.modules.contacts.next.domain.query

import android.database.Cursor
import android.provider.ContactsContract
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.contact.ExistingContact
import expo.modules.contacts.next.domain.model.email.operations.ExistingEmail
import expo.modules.contacts.next.domain.model.event.operations.ExistingEvent
import expo.modules.contacts.next.domain.model.nickname.operations.ExistingNickname
import expo.modules.contacts.next.domain.model.note.operations.ExistingNote
import expo.modules.contacts.next.domain.model.organization.operations.ExistingOrganization
import expo.modules.contacts.next.domain.model.phone.operations.ExistingPhone
import expo.modules.contacts.next.domain.model.relationship.operations.ExistingRelation
import expo.modules.contacts.next.domain.model.structuredname.operations.ExistingStructuredName
import expo.modules.contacts.next.domain.model.structuredpostal.operations.ExistingStructuredPostal
import expo.modules.contacts.next.domain.model.website.operations.ExistingWebsite
import expo.modules.contacts.next.domain.wrappers.ContactId

class QueryAggregator() {
  companion object {
    fun aggregate(cursor: Cursor, extractors: Set<ExtractableField<*>>): List<ExistingContact> {
      val extractorsByMimeType = extractors.associateBy { it.mimeType }
      val contactsMap = mutableMapOf<String, ContactModelBuilder>()
      while (cursor.moveToNext()) {
        val contactId = cursor.getString(cursor.getColumnIndexOrThrow(ContactId.COLUMN_IN_DATA_TABLE))
        val mime = cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.Data.MIMETYPE))
        val builder = contactsMap.getOrPut(contactId) { ContactModelBuilder(ContactId(contactId)) }
        val model = extractorsByMimeType[mime]?.extract(cursor)
        model?.let {
          builder.addModel(model)
        }
      }
      return contactsMap.values.map { it.build() }
    }

    fun <T : Extractable> aggregateOneField(cursor: Cursor, extractor: ExtractableField<T>): List<T> {
      val foundItems = mutableListOf<T>()
      while (cursor.moveToNext()) {
        foundItems.add(extractor.extract(cursor))
      }
      return foundItems
    }

    fun aggregateOne(cursor: Cursor, extractors: Set<ExtractableField<*>>, contactId: ContactId): ExistingContact {
      val extractorsByMimeType = extractors.associateBy { it.mimeType }
      val builder = ContactModelBuilder(contactId)
      while (cursor.moveToNext()) {
        val mime = cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.Data.MIMETYPE))
        val model = extractorsByMimeType[mime]?.extract(cursor)
        model?.let {
          builder.addModel(model)
        }
      }
      return builder.build()
    }
  }

  class ContactModelBuilder(val contactId: ContactId) {
    var structuredName: ExistingStructuredName? = null
    var organization: ExistingOrganization? = null
    var note: ExistingNote? = null
    val emails = mutableListOf<ExistingEmail>()
    val events = mutableListOf<ExistingEvent>()
    val nicknames = mutableListOf<ExistingNickname>()
    val phones = mutableListOf<ExistingPhone>()
    val relations = mutableListOf<ExistingRelation>()
    val structuredPostals = mutableListOf<ExistingStructuredPostal>()
    val websites = mutableListOf<ExistingWebsite>()

    fun addModel(extractable: Extractable) {
      when (extractable) {
        is ExistingStructuredName -> structuredName = extractable
        is ExistingOrganization -> organization = extractable
        is ExistingNote -> note = extractable
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
      structuredName = structuredName,
      organization = organization,
      note = note,
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

package expo.modules.contacts.next.domain.model.contact

import expo.modules.contacts.next.domain.model.email.operations.ExistingEmail
import expo.modules.contacts.next.domain.model.event.operations.ExistingEvent
import expo.modules.contacts.next.domain.model.headers.DisplayName
import expo.modules.contacts.next.domain.model.headers.PhotoThumbnailUri
import expo.modules.contacts.next.domain.model.headers.PhotoUri
import expo.modules.contacts.next.domain.model.headers.isfavourite.Starred
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

data class ExistingContact(
  // Contacts table fields
  val contactId: ContactId,
  val displayName: DisplayName? = null,
  val starred: Starred? = null,
  val photoUri: PhotoUri? = null,
  val photoThumbnailUri: PhotoThumbnailUri? = null,
  // Data table fields
  val structuredName: ExistingStructuredName? = null,
  val organization: ExistingOrganization? = null,
  val photo: ExistingPhoto? = null,
  val note: ExistingNote? = null,
  val emails: List<ExistingEmail> = listOf(),
  val events: List<ExistingEvent> = listOf(),
  val nicknames: List<ExistingNickname> = listOf(),
  val phones: List<ExistingPhone> = listOf(),
  val relations: List<ExistingRelation> = listOf(),
  val structuredPostals: List<ExistingStructuredPostal> = listOf(),
  val websites: List<ExistingWebsite> = listOf()
)

package expo.modules.contacts.next.domain.model.contact

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.headers.starred.ExistingStarred
import expo.modules.contacts.next.domain.wrappers.RawContactId

class UpdateContact(
  val rawContactId: RawContactId,
  val starred: ExistingStarred,
  val toAppend: List<Appendable>
)
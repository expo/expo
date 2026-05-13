package expo.modules.contacts.next.domain.model.relationship.operations

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.relationship.RelationLabel
import expo.modules.contacts.next.domain.model.relationship.RelationModel
import expo.modules.contacts.next.domain.wrappers.RawContactId

class AppendableRelation(
  override val rawContactId: RawContactId,
  name: String?,
  label: RelationLabel
) : RelationModel(name, label), Appendable

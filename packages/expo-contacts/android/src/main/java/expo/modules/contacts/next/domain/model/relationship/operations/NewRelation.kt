package expo.modules.contacts.next.domain.model.relationship.operations

import expo.modules.contacts.next.domain.model.Insertable
import expo.modules.contacts.next.domain.model.relationship.RelationLabel
import expo.modules.contacts.next.domain.model.relationship.RelationModel

class NewRelation(
  name: String?,
  label: RelationLabel
) : RelationModel(name, label), Insertable

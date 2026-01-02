package expo.modules.contacts.next.domain.model.relationship.operations

import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.relationship.RelationLabel
import expo.modules.contacts.next.domain.model.relationship.RelationModel
import expo.modules.contacts.next.domain.wrappers.DataId

class ExistingRelation(
  override val dataId: DataId,
  name: String?,
  label: RelationLabel
) : RelationModel(name, label), Updatable.Data, Extractable.Data

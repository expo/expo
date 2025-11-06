package expo.modules.contacts.next.domain.model.nickname.operations

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.nickname.NicknameLabel
import expo.modules.contacts.next.domain.model.nickname.NicknameModel
import expo.modules.contacts.next.domain.wrappers.RawContactId

class AppendableNickname(
  override val rawContactId: RawContactId,
  name: String?,
  label: NicknameLabel
) : NicknameModel(name, label), Appendable

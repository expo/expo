package expo.modules.contacts.next.domain.model.nickname.operations

import expo.modules.contacts.next.domain.model.Insertable
import expo.modules.contacts.next.domain.model.nickname.NicknameLabel
import expo.modules.contacts.next.domain.model.nickname.NicknameModel

class NewNickname(
  name: String?,
  label: NicknameLabel
) : NicknameModel(name, label), Insertable

package expo.modules.contacts.next.domain.model.nickname

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Nickname
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.nickname.operations.ExistingNickname
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.extensions.getNullableInt
import expo.modules.contacts.next.extensions.getNullableString
import expo.modules.contacts.next.extensions.getRequiredString

object NicknameField : ExtractableField.Data<ExistingNickname> {
  override val mimeType = Nickname.CONTENT_ITEM_TYPE

  override val projection = arrayOf(
    DataId.COLUMN_IN_DATA_TABLE,
    Nickname.NAME,
    Nickname.TYPE,
    Nickname.LABEL
  )

  override fun extract(cursor: Cursor): ExistingNickname = with(cursor) {
    return ExistingNickname(
      dataId = DataId(getRequiredString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      name = getNullableString(getColumnIndexOrThrow(Nickname.NAME)),
      label = extractLabel()
    )
  }

  private fun Cursor.extractLabel(): NicknameLabel =
    when (getNullableInt(Nickname.TYPE)) {
      Nickname.TYPE_DEFAULT -> NicknameLabel.Default
      Nickname.TYPE_OTHER_NAME -> NicknameLabel.OtherName
      Nickname.TYPE_MAIDEN_NAME -> NicknameLabel.MaidenName
      Nickname.TYPE_SHORT_NAME -> NicknameLabel.ShortName
      Nickname.TYPE_INITIALS -> NicknameLabel.Initials
      null -> {
        val customLabel = getNullableString(getColumnIndexOrThrow(Nickname.LABEL))
        NicknameLabel.MalformedType(customLabel)
      }
      else -> {
        val customLabel = getNullableString(getColumnIndexOrThrow(Nickname.LABEL))
        customLabel?.let { NicknameLabel.Custom(it) } ?: NicknameLabel.MalformedCustom
      }
    }
}

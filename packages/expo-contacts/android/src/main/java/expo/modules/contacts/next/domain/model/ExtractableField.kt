package expo.modules.contacts.next.domain.model

import android.database.Cursor
import expo.modules.contacts.next.domain.model.email.EmailField
import expo.modules.contacts.next.domain.model.event.EventField
import expo.modules.contacts.next.domain.model.headers.starred.StarredField
import expo.modules.contacts.next.domain.model.nickname.NicknameField
import expo.modules.contacts.next.domain.model.organization.OrganizationField
import expo.modules.contacts.next.domain.model.phone.PhoneField
import expo.modules.contacts.next.domain.model.relationship.RelationField
import expo.modules.contacts.next.domain.model.structuredname.StructuredNameField
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalField
import expo.modules.contacts.next.domain.model.website.WebsiteField
import expo.modules.contacts.next.domain.wrappers.DataId
import kotlin.collections.setOf

interface Extractable {
  interface Data: Extractable {
    val dataId: DataId
  }
}

sealed interface ExtractableField<T: Extractable> {
  val projection: Array<String>
  fun extract(cursor: Cursor): T

  interface Data<T: Extractable.Data>: ExtractableField<T> {
    val mimeType: String
  }

  interface Contacts<T: Extractable>: ExtractableField<T>

  companion object {
    fun getAll(): Set<ExtractableField<*>> = setOf(
      StarredField,
      StructuredNameField,
      OrganizationField,
      EmailField,
      PhoneField,
      StructuredPostalField,
      EventField,
      RelationField,
      WebsiteField,
      NicknameField,
    )
  }
}


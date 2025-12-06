package expo.modules.contacts.next.domain.model.structuredpostal

import android.provider.ContactsContract.CommonDataKinds.StructuredPostal

sealed class StructuredPostalLabel {
  abstract val type: Int
  open val label: String? = null

  object Home : StructuredPostalLabel() {
    override val type = StructuredPostal.TYPE_HOME
  }

  object Work : StructuredPostalLabel() {
    override val type = StructuredPostal.TYPE_WORK
  }

  object Other : StructuredPostalLabel() {
    override val type = StructuredPostal.TYPE_OTHER
  }

  data class Custom(override val label: String) : StructuredPostalLabel() {
    override val type = StructuredPostal.TYPE_CUSTOM
  }
}

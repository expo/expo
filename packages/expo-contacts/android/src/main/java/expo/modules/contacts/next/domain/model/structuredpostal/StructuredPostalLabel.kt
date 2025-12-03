package expo.modules.contacts.next.domain.model.structuredpostal

import android.provider.ContactsContract.CommonDataKinds.StructuredPostal

sealed class StructuredPostalLabel {
  abstract val type: Int
  abstract val label: String

  object Home : StructuredPostalLabel() {
    override val type = StructuredPostal.TYPE_HOME
    override val label = "home"
  }

  object Work : StructuredPostalLabel() {
    override val type = StructuredPostal.TYPE_WORK
    override val label = "work"
  }

  object Other : StructuredPostalLabel() {
    override val type = StructuredPostal.TYPE_OTHER
    override val label = "other"
  }

  data class Custom(override val label: String) : StructuredPostalLabel() {
    override val type = StructuredPostal.TYPE_CUSTOM
  }

  object Unknown : StructuredPostalLabel() {
    override val type = StructuredPostal.TYPE_CUSTOM
    override val label = "unknown"
  }
}

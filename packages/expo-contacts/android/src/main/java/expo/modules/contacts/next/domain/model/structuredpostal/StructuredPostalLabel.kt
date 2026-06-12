package expo.modules.contacts.next.domain.model.structuredpostal

import android.provider.ContactsContract.CommonDataKinds.StructuredPostal

sealed class StructuredPostalLabel(val type: Int?, val label: String? = null) {
  object Home : StructuredPostalLabel(StructuredPostal.TYPE_HOME)
  object Work : StructuredPostalLabel(StructuredPostal.TYPE_WORK)
  object Other : StructuredPostalLabel(StructuredPostal.TYPE_OTHER)
  class Custom(label: String) : StructuredPostalLabel(StructuredPostal.TYPE_CUSTOM, label)

  // Ideally these states would not be necessary, but Android does not enforce
  // type and label columns as non-null, so malformed label data can exist there.
  class MalformedType(label: String?) : StructuredPostalLabel(null, label)
  object MalformedCustom : StructuredPostalLabel(StructuredPostal.TYPE_CUSTOM)
}

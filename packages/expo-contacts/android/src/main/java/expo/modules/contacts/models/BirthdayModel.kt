package expo.modules.contacts.models

class BirthdayModel : DateModel() {
  override fun fromMap(readableMap: Map<String, Any?>) {
    super.fromMap(readableMap)
    map.putString("label", BIRTHDAY)
  }
}

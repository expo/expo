package expo.modules.contacts

interface CommonProvider {
  // String getLabelFromCursor(android.content.res.Resources resources, int index, String label);
  val contentType: String?
  val dataAlias: String?
  val labelAlias: String?
  val idAlias: String?
}

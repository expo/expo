package host.exp.exponent.notifications

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Ignore
import androidx.room.PrimaryKey

@Entity(tableName = "ActionObject")
class ActionObject() {
  @ColumnInfo var categoryId: String? = null

  @PrimaryKey @ColumnInfo
  var actionId: String = ""

  @ColumnInfo var buttonTitle: String? = null

  @ColumnInfo var isDestructive: Boolean? = null

  @ColumnInfo var isAuthenticationRequired: Boolean? = null

  @ColumnInfo var submitButtonTitle: String? = null

  @ColumnInfo var placeholder: String? = null

  @ColumnInfo var isShouldShowTextInput: Boolean = false

  @ColumnInfo var position: Int = 0

  @Ignore
  constructor(map: Map<String?, Any?>, position: Int) : this() {
    categoryId = map["categoryId"] as String?
    actionId = map["actionId"] as String? ?: ""
    buttonTitle = map["buttonTitle"] as String?
    isDestructive = map["isDestructive"] as Boolean?
    isAuthenticationRequired = map["isAuthenticationRequired"] as Boolean?
    isShouldShowTextInput = map["textInput"] != null
    if (isShouldShowTextInput && map["textInput"] is Map<*, *>) {
      val subMap = map["textInput"] as Map<String, Any>?
      placeholder = subMap!!["placeholder"] as String?
      submitButtonTitle = subMap["submitButtonTitle"] as String?
    }
    this.position = position
  }
}

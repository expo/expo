package host.exp.exponent.notifications

import com.raizlabs.android.dbflow.annotation.Column
import com.raizlabs.android.dbflow.annotation.PrimaryKey
import com.raizlabs.android.dbflow.annotation.Table
import com.raizlabs.android.dbflow.structure.BaseModel

@Table(database = ActionDatabase::class)
class ActionObject : BaseModel {
  @Column var categoryId: String? = null

  @PrimaryKey @Column
  var actionId: String? = null

  @Column var buttonTitle: String? = null

  @Column var isDestructive: Boolean? = null

  @Column var isAuthenticationRequired: Boolean? = null

  @Column var submitButtonTitle: String? = null

  @Column var placeholder: String? = null

  @Column var isShouldShowTextInput: Boolean = false

  @Column var position: Int

  constructor() {
    position = 0
  }

  constructor(map: Map<String?, Any?>, position: Int) {
    categoryId = map["categoryId"] as String?
    actionId = map["actionId"] as String?
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

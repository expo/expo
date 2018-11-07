package versioned.host.exp.exponent.modules.api.notifications;


import com.raizlabs.android.dbflow.annotation.Column;
import com.raizlabs.android.dbflow.annotation.PrimaryKey;
import com.raizlabs.android.dbflow.annotation.Table;
import com.raizlabs.android.dbflow.structure.BaseModel;

import java.util.HashMap;

@Table(databaseName = ActionDatabase.NAME)
public class ActionObject extends BaseModel {
  @Column
  private String categoryId;

  @PrimaryKey
  @Column
  private String actionId;

  @Column
  private String buttonTitle;

  @Column
  private Boolean isDestructive = false;

  @Column
  private Boolean isAuthenticationRequired = false;

  @Column
  private String submitButtonTitle = "go";

  @Column
  private String placeholder = "...";

  @Column
  private Boolean containTextInput = false;
  
  public Boolean getContainTextInput() {
    return containTextInput;
  }

  public String getActionId() {
    return actionId;
  }

  public void setActionId(String actionId) {
    this.actionId = actionId;
  }

  public void setContainTextInput(Boolean containTextInput) {
    this.containTextInput = containTextInput;
  }

  public String getSubmitButtonTitle() {
    return submitButtonTitle;
  }

  public void setSubmitButtonTitle(String submitButtonTitle) {
    this.submitButtonTitle = submitButtonTitle;
  }

  public String getPlaceholder() {
    return placeholder;
  }

  public void setPlaceholder(String placeholder) {
    this.placeholder = placeholder;
  }

  public String getCategoryId() {
    return categoryId;
  }

  public void setCategoryId(String categoryId) {
    this.categoryId = categoryId;
  }

  public String getButtonTitle() {
    return buttonTitle;
  }

  public void setButtonTitle(String buttonTitle) {
    this.buttonTitle = buttonTitle;
  }

  public Boolean getIsDestructive() {
    return isDestructive;
  }

  public void setIsDestructive(Boolean destructive) {
    isDestructive = destructive;
  }

  public Boolean getIsAuthenticationRequired() {
    return isAuthenticationRequired;
  }

  public void setIsAuthenticationRequired(Boolean authenticationRequired) {
    isAuthenticationRequired = authenticationRequired;
  }

  public void populateObjectWithDataFromMap(HashMap<String, Object> map) {
    this.categoryId = (String)map.get("categoryId");
    this.actionId = (String)map.get("actionId");
    this.buttonTitle = (String)map.get("buttonTitle");
    this.isDestructive = (Boolean)map.get("isDestructive");
    this.isAuthenticationRequired = (Boolean)map.get("isAuthenticationRequired");
    this.containTextInput = (map.get("textInput") != null);
    if (this.containTextInput) {
      HashMap<String, Object> subMap = (HashMap<String, Object>) map.get("textInput");
      this.placeholder = (String)subMap.get("placeholder");
      this.submitButtonTitle = (String)subMap.get("submitButtonTitle");
    }
  }
}

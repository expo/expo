package host.exp.exponent.notifications;

import com.raizlabs.android.dbflow.annotation.Column;
import com.raizlabs.android.dbflow.annotation.PrimaryKey;
import com.raizlabs.android.dbflow.annotation.Table;
import com.raizlabs.android.dbflow.structure.BaseModel;

import java.util.Map;

@Table(database = ActionDatabase.class)
public class ActionObject extends BaseModel {
  @Column
  private String categoryId;

  @PrimaryKey
  @Column
  private String actionId;

  @Column
  private String buttonTitle;

  @Column
  private Boolean isDestructive;

  @Column
  private Boolean isAuthenticationRequired;

  @Column
  private String submitButtonTitle;

  @Column
  private String placeholder;

  @Column
  private Boolean shouldShowTextInput;

  @Column
  private int position;

  public ActionObject() {
    this.position = 0;
  }

  public ActionObject(Map<String, Object> map, int position) {
    this.categoryId = (String) map.get("categoryId");
    this.actionId = (String) map.get("actionId");
    this.buttonTitle = (String) map.get("buttonTitle");
    this.isDestructive = (Boolean) map.get("isDestructive");
    this.isAuthenticationRequired = (Boolean) map.get("isAuthenticationRequired");
    this.shouldShowTextInput = (map.get("textInput") != null);
    if (this.shouldShowTextInput && map.get("textInput") instanceof Map) {
      Map<String, Object> subMap = (Map<String, Object>) map.get("textInput");
      this.placeholder = (String) subMap.get("placeholder");
      this.submitButtonTitle = (String) subMap.get("submitButtonTitle");
    }
    this.position = position;
  }

  public String getActionId() {
    return actionId;
  }

  public String getButtonTitle() {
    return buttonTitle;
  }

  public Boolean isShouldShowTextInput() {
    return shouldShowTextInput;
  }

  public int getPosition() {
    return position;
  }

  public void setPosition(int position) {
    this.position = position;
  }

  public void setShouldShowTextInput(Boolean shouldShowTextInput) {
    this.shouldShowTextInput = shouldShowTextInput;
  }

  public void setActionId(String actionId) {
    this.actionId = actionId;
  }

  public String getSubmitButtonTitle() {
    return submitButtonTitle;
  }

  public void setSubmitButtonTitle(String submitButtonTitle) {
    this.submitButtonTitle = submitButtonTitle;
  }

  public String getCategoryId() {
    return categoryId;
  }

  public void setCategoryId(String categoryId) {
    this.categoryId = categoryId;
  }

  public void setButtonTitle(String buttonTitle) {
    this.buttonTitle = buttonTitle;
  }

  public Boolean isDestructive() {
    return isDestructive;
  }

  public void setDestructive(Boolean destructive) {
    isDestructive = destructive;
  }

  public Boolean isAuthenticationRequired() {
    return isAuthenticationRequired;
  }

  public void setAuthenticationRequired(Boolean authenticationRequired) {
    isAuthenticationRequired = authenticationRequired;
  }

  public String getPlaceholder() {
    return placeholder;
  }

  public void setPlaceholder(String placeholder) {
    this.placeholder = placeholder;
  }
}

package expo.modules.notifications.action;

import com.raizlabs.android.dbflow.annotation.Column;
import com.raizlabs.android.dbflow.annotation.PrimaryKey;
import com.raizlabs.android.dbflow.annotation.Table;
import com.raizlabs.android.dbflow.structure.BaseModel;

import java.util.Map;

import static expo.modules.notifications.NotificationConstants.ACTION_BUTTON_TITLE;
import static expo.modules.notifications.NotificationConstants.ACTION_ID;
import static expo.modules.notifications.NotificationConstants.ACTION_IS_AUTHENTICATION_REQUIRED;
import static expo.modules.notifications.NotificationConstants.ACTION_IS_DESTRUCTIVE;
import static expo.modules.notifications.NotificationConstants.ACTION_PLACEHOLDER;
import static expo.modules.notifications.NotificationConstants.ACTION_SUBMIT_BUTTON_TITLE;
import static expo.modules.notifications.NotificationConstants.ACTION_TEXT_INPUT;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CATEGORY;

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
    this.categoryId = (String) map.get(NOTIFICATION_CATEGORY);
    this.actionId = (String) map.get(ACTION_ID);
    this.buttonTitle = (String) map.get(ACTION_BUTTON_TITLE);
    this.isDestructive = (Boolean) map.get(ACTION_IS_DESTRUCTIVE);
    this.isAuthenticationRequired = (Boolean) map.get(ACTION_IS_AUTHENTICATION_REQUIRED);
    this.shouldShowTextInput = (map.get(ACTION_TEXT_INPUT) != null);
    if (this.shouldShowTextInput && map.get(ACTION_TEXT_INPUT) instanceof Map) {
      Map<String, Object> subMap = (Map<String, Object>) map.get(ACTION_TEXT_INPUT);
      this.placeholder = (String) subMap.get(ACTION_PLACEHOLDER);
      this.submitButtonTitle = (String) subMap.get(ACTION_SUBMIT_BUTTON_TITLE);
    }
    this.position = position;
  }

  public String getActionId() {
    return actionId;
  }

  public String getButtonTitle() {
    return buttonTitle;
  }

  public boolean getShouldShowTextInput() {
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

  public String getPlaceholder() {
    return placeholder;
  }

  public void setPlaceholder(String placeholder) {
    this.placeholder = placeholder;
  }
}

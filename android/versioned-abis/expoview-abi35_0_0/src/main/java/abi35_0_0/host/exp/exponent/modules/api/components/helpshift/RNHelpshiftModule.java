package abi35_0_0.host.exp.exponent.modules.api.components.helpshift;

import abi35_0_0.com.facebook.react.bridge.Arguments;
import abi35_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi35_0_0.com.facebook.react.bridge.ReactContext;
import abi35_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi35_0_0.com.facebook.react.bridge.ReactMethod;
import abi35_0_0.com.facebook.react.bridge.ReadableMap;
import abi35_0_0.com.facebook.react.bridge.ReadableArray;
import abi35_0_0.com.facebook.react.bridge.ReadableMapKeySetIterator;

import java.util.Map;
import java.util.HashMap;

import abi35_0_0.com.facebook.react.bridge.WritableMap;
import abi35_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;
import com.helpshift.Core;
import com.helpshift.exceptions.InstallException;
import com.helpshift.support.Support;
import com.helpshift.HelpshiftUser;
import com.helpshift.support.ApiConfig;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;

import android.support.annotation.Nullable;

public class RNHelpshiftModule extends ReactContextBaseJavaModule {

  private final Application app;
  private ReactApplicationContext mReactContext;
  private Handler countSuccessHandler;
  private Handler countErrorHandler;
  
  public RNHelpshiftModule(ReactApplicationContext reactContext) {
    super(reactContext);

    mReactContext= reactContext;

    this.app = (Application)reactContext.getApplicationContext();
  }

  @ReactMethod
  public void init(String key, String domain, String appid) throws InstallException {
      Core.init(Support.getInstance());
      Core.install(this.app, key, domain, appid);
  }

  @ReactMethod
  public void login(ReadableMap user){
      HelpshiftUser userBuilder;
      String email = user.hasKey("email") ? user.getString("email") : null;
      String indentifier = user.hasKey("indentifier") ? user.getString("indentifier") : null;
      if(user.hasKey("name") && user.hasKey("authToken")) {
           userBuilder = new HelpshiftUser.Builder(indentifier, email)
                   .setName(user.getString("name"))
                   .setAuthToken(user.getString("authToken"))
                   .build();
      } else if (user.hasKey("name")) {
          userBuilder = new HelpshiftUser.Builder(indentifier, email)
                  .setName(user.getString("name"))
                  .build();
      } else if (user.hasKey("authToken")) {
          userBuilder = new HelpshiftUser.Builder(indentifier, email)
                  .setAuthToken(user.getString("authToken"))
                  .build();
      } else {
          userBuilder = new HelpshiftUser.Builder(indentifier, email).build();
      }

      Core.login(userBuilder);
  }

  @ReactMethod
  public void logout(){
      Core.logout();
  }

  @ReactMethod
  public void showConversation(){
    final Activity activity = getCurrentActivity();
    Support.showConversation(activity);
  }

  @ReactMethod
  public void showConversationWithCIFs(ReadableMap cifs){
      final Activity activity = getCurrentActivity();
      ApiConfig apiConfig = new ApiConfig.Builder().setCustomIssueFields(getCustomIssueFields(cifs)).build();
      Support.showConversation(activity, apiConfig);
  }

  @ReactMethod
  public void showFAQs(){
    final Activity activity = getCurrentActivity();
    Support.showFAQs(activity);
  }

  @ReactMethod
  public void showFAQsWithCIFs(ReadableMap cifs){
      final Activity activity = getCurrentActivity();
      ApiConfig apiConfig = new ApiConfig.Builder().setCustomIssueFields(getCustomIssueFields(cifs)).build();
      Support.showFAQs(activity, apiConfig);
  }

  @ReactMethod
  public void requestUnreadMessagesCount(){

      // TODO: Is the correct place to create these?
      countErrorHandler = new Handler() {
          public void handleMessage(Message msg) {
              super.handleMessage(msg);
          }
      };

      countSuccessHandler = new Handler() {
          public void handleMessage(Message msg) {
              super.handleMessage(msg);
              Bundle countData = (Bundle) msg.obj;
              Integer count = countData.getInt("value");
              WritableMap params = Arguments.createMap();
              params.putInt("count", count);
              sendEvent(mReactContext, "didReceiveUnreadMessagesCount", params);
          }
      };

      Support.getNotificationCount(countSuccessHandler, countErrorHandler);
  }

  private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
      reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
              .emit(eventName, params);
  }



  private Map<String, String[]> getCustomIssueFields(ReadableMap cifs) {
      ReadableMapKeySetIterator iterator = cifs.keySetIterator();
      Map<String, String[]> customIssueFields = new HashMap<>();

      while (iterator.hasNextKey()) {
        String key = iterator.nextKey();
        ReadableArray array = cifs.getArray(key);
        customIssueFields.put(key, new String[]{array.getString(0), array.getString(1)});
      }

      return customIssueFields;
  }

  @Override
  public String getName() {
    return "RNHelpshift";
  }
}
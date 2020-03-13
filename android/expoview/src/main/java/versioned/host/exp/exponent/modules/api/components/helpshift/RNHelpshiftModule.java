
package versioned.host.exp.exponent.modules.api.components.helpshift;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

import java.io.File;
import java.util.Map;
import java.util.HashMap;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.helpshift.Core;
import com.helpshift.delegate.AuthenticationFailureReason;
import com.helpshift.exceptions.InstallException;
import com.helpshift.support.Support;
import com.helpshift.HelpshiftUser;
import com.helpshift.support.ApiConfig;

import android.app.Activity;
import android.app.Application;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.util.Log;

import androidx.annotation.Nullable;

public class RNHelpshiftModule extends ReactContextBaseJavaModule implements Support.Delegate {

    private final Application app;
    private ReactApplicationContext mReactContext;
    private Handler countSuccessHandler;
    private Handler countErrorHandler;

    public RNHelpshiftModule(ReactApplicationContext reactContext)  {
        super(reactContext);

        mReactContext= reactContext;

        this.app = (Application)reactContext.getApplicationContext();
    }
    @Override
    public String getName() {
        return "RNHelpshift";
    }

    @ReactMethod
    public void init(String key, String domain, String appid) throws InstallException {
        Support.setDelegate(this);
        Core.init(Support.getInstance());
        Core.install(this.app, key, domain, appid);
    }

    @ReactMethod
    public void login(ReadableMap user){
        HelpshiftUser userBuilder;
        String email = user.hasKey("email") ? user.getString("email") : null;
        String identifier = user.hasKey("identifier") ? user.getString("identifier") : null;
        if(user.hasKey("name") && user.hasKey("authToken")) {
            userBuilder = new HelpshiftUser.Builder(identifier, email)
                    .setName(user.getString("name"))
                    .setAuthToken(user.getString("authToken"))
                    .build();
        } else if (user.hasKey("name")) {
            userBuilder = new HelpshiftUser.Builder(identifier, email)
                    .setName(user.getString("name"))
                    .build();
        } else if (user.hasKey("authToken")) {
            userBuilder = new HelpshiftUser.Builder(identifier, email)
                    .setAuthToken(user.getString("authToken"))
                    .build();
        } else {
            userBuilder = new HelpshiftUser.Builder(identifier, email).build();
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
                sendEvent(mReactContext, "Helpshift/DidReceiveUnreadMessagesCount", params);
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
    public void sessionBegan() {
        Log.d("Helpshift", "sessionBegan");
        sendEvent(mReactContext, "Helpshift/SessionBegan", Arguments.createMap());
    }

    @Override
    public void sessionEnded() {
        Log.d("Helpshift", "sessionEnded");
        sendEvent(mReactContext, "Helpshift/SessionEnded", Arguments.createMap());
    }

    @Override
    public void newConversationStarted(String newConversationMessage) {
        Log.d("Helpshift", "newConversationStarted");
        WritableMap params = Arguments.createMap();
        params.putString("newConversationMessage", newConversationMessage);
        sendEvent(mReactContext, "Helpshift/NewConversationStarted", params);
    }

    @Override
    public void conversationEnded() {
        Log.d("Helpshift", "conversationEnded");
        sendEvent(mReactContext, "Helpshift/ConversationEnded", Arguments.createMap());
    }

    @Override
    public void userRepliedToConversation(String newMessage) {
        Log.d("Helpshift", "userRepliedToConversation");
        WritableMap params = Arguments.createMap();
        params.putString("newMessage", newMessage);
        sendEvent(mReactContext, "Helpshift/UserRepliedToConversation", params);
    }

    @Override
    public void userCompletedCustomerSatisfactionSurvey(int rating, String feedback) {
        Log.d("Helpshift", "userCompletedCustomerSatisfactionSurvey");
        WritableMap params = Arguments.createMap();
        params.putInt("rating", rating);
        params.putString("feedback", feedback);
        sendEvent(mReactContext, "Helpshift/UserCompletedCustomerSatisfactionSurvey", params);
    }


    //TODO: determine if File can be sent by React Native bridge
    @Override
    public void displayAttachmentFile(Uri attachmentFile) { }

    // TODO: determine if File can be sent by React Native bridge
    @Override
    public void displayAttachmentFile(File attachmentFile) {}

    @Override
    public void didReceiveNotification(int newMessagesCount) {
        Log.d("Helpshift", "didReceiveNotification");
        WritableMap params = Arguments.createMap();
        params.putInt("newMessagesCount", newMessagesCount);
        sendEvent(mReactContext, "Helpshift/DidReceiveNotification", params);
    }

    @Override
    public void authenticationFailed(HelpshiftUser user, AuthenticationFailureReason reason) {
        Log.d("Helpshift", "authenticationFailed");
        WritableMap params = Arguments.createMap();
        params.putString("user", user.toString());
        params.putString("reason", reason.toString());
        sendEvent(mReactContext, "Helpshift/AuthenticationFailed", params);
    }
}
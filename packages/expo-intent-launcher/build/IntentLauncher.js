import { UnavailabilityError } from 'expo-modules-core';
import ExpoIntentLauncher from './ExpoIntentLauncher';
// @needsAudit
/**
 * Constants are from the source code of [Settings provider](https://developer.android.com/reference/android/provider/Settings).
 */
export var ActivityAction;
(function (ActivityAction) {
    ActivityAction["ACCESSIBILITY_SETTINGS"] = "android.settings.ACCESSIBILITY_SETTINGS";
    ActivityAction["ADD_ACCOUNT_SETTINGS"] = "android.settings.ADD_ACCOUNT_SETTINGS";
    ActivityAction["AIRPLANE_MODE_SETTINGS"] = "android.settings.AIRPLANE_MODE_SETTINGS";
    ActivityAction["APN_SETTINGS"] = "android.settings.APN_SETTINGS";
    ActivityAction["APP_NOTIFICATION_REDACTION"] = "android.settings.ACTION_APP_NOTIFICATION_REDACTION";
    ActivityAction["APP_NOTIFICATION_SETTINGS"] = "android.settings.APP_NOTIFICATION_SETTINGS";
    ActivityAction["APP_OPS_SETTINGS"] = "android.settings.APP_OPS_SETTINGS";
    ActivityAction["APPLICATION_DETAILS_SETTINGS"] = "android.settings.APPLICATION_DETAILS_SETTINGS";
    ActivityAction["APPLICATION_DEVELOPMENT_SETTINGS"] = "android.settings.APPLICATION_DEVELOPMENT_SETTINGS";
    ActivityAction["APPLICATION_SETTINGS"] = "android.settings.APPLICATION_SETTINGS";
    ActivityAction["BATTERY_SAVER_SETTINGS"] = "android.settings.BATTERY_SAVER_SETTINGS";
    ActivityAction["BLUETOOTH_SETTINGS"] = "android.settings.BLUETOOTH_SETTINGS";
    ActivityAction["CAPTIONING_SETTINGS"] = "android.settings.CAPTIONING_SETTINGS";
    ActivityAction["CAST_SETTINGS"] = "android.settings.CAST_SETTINGS";
    ActivityAction["CONDITION_PROVIDER_SETTINGS"] = "android.settings.ACTION_CONDITION_PROVIDER_SETTINGS";
    ActivityAction["DATA_ROAMING_SETTINGS"] = "android.settings.DATA_ROAMING_SETTINGS";
    ActivityAction["DATE_SETTINGS"] = "android.settings.DATE_SETTINGS";
    ActivityAction["DEVICE_INFO_SETTINGS"] = "android.settings.DEVICE_INFO_SETTINGS";
    ActivityAction["DEVICE_NAME"] = "android.settings.DEVICE_NAME";
    ActivityAction["DISPLAY_SETTINGS"] = "android.settings.DISPLAY_SETTINGS";
    ActivityAction["DREAM_SETTINGS"] = "android.settings.DREAM_SETTINGS";
    ActivityAction["HARD_KEYBOARD_SETTINGS"] = "android.settings.HARD_KEYBOARD_SETTINGS";
    ActivityAction["HOME_SETTINGS"] = "android.settings.HOME_SETTINGS";
    ActivityAction["IGNORE_BACKGROUND_DATA_RESTRICTIONS_SETTINGS"] = "android.settings.IGNORE_BACKGROUND_DATA_RESTRICTIONS_SETTINGS";
    ActivityAction["IGNORE_BATTERY_OPTIMIZATION_SETTINGS"] = "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS";
    ActivityAction["INPUT_METHOD_SETTINGS"] = "android.settings.INPUT_METHOD_SETTINGS";
    ActivityAction["INPUT_METHOD_SUBTYPE_SETTINGS"] = "android.settings.INPUT_METHOD_SUBTYPE_SETTINGS";
    ActivityAction["INTERNAL_STORAGE_SETTINGS"] = "android.settings.INTERNAL_STORAGE_SETTINGS";
    ActivityAction["LOCALE_SETTINGS"] = "android.settings.LOCALE_SETTINGS";
    ActivityAction["LOCATION_SOURCE_SETTINGS"] = "android.settings.LOCATION_SOURCE_SETTINGS";
    ActivityAction["MANAGE_ALL_APPLICATIONS_SETTINGS"] = "android.settings.MANAGE_ALL_APPLICATIONS_SETTINGS";
    ActivityAction["MANAGE_APPLICATIONS_SETTINGS"] = "android.settings.MANAGE_APPLICATIONS_SETTINGS";
    ActivityAction["MANAGE_DEFAULT_APPS_SETTINGS"] = "android.settings.MANAGE_DEFAULT_APPS_SETTINGS";
    ActivityAction["MEMORY_CARD_SETTINGS"] = "android.settings.MEMORY_CARD_SETTINGS";
    ActivityAction["MONITORING_CERT_INFO"] = "android.settings.MONITORING_CERT_INFO";
    ActivityAction["NETWORK_OPERATOR_SETTINGS"] = "android.settings.NETWORK_OPERATOR_SETTINGS";
    ActivityAction["NFC_PAYMENT_SETTINGS"] = "android.settings.NFC_PAYMENT_SETTINGS";
    ActivityAction["NFC_SETTINGS"] = "android.settings.NFC_SETTINGS";
    ActivityAction["NFCSHARING_SETTINGS"] = "android.settings.NFCSHARING_SETTINGS";
    ActivityAction["NIGHT_DISPLAY_SETTINGS"] = "android.settings.NIGHT_DISPLAY_SETTINGS";
    ActivityAction["NOTIFICATION_LISTENER_SETTINGS"] = "android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS";
    ActivityAction["NOTIFICATION_POLICY_ACCESS_SETTINGS"] = "android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS";
    ActivityAction["NOTIFICATION_SETTINGS"] = "android.settings.NOTIFICATION_SETTINGS";
    ActivityAction["PAIRING_SETTINGS"] = "android.settings.PAIRING_SETTINGS";
    ActivityAction["PRINT_SETTINGS"] = "android.settings.ACTION_PRINT_SETTINGS";
    ActivityAction["PRIVACY_SETTINGS"] = "android.settings.PRIVACY_SETTINGS";
    ActivityAction["QUICK_LAUNCH_SETTINGS"] = "android.settings.QUICK_LAUNCH_SETTINGS";
    ActivityAction["REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"] = "android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS";
    ActivityAction["SECURITY_SETTINGS"] = "android.settings.SECURITY_SETTINGS";
    ActivityAction["SETTINGS"] = "android.settings.SETTINGS";
    ActivityAction["SHOW_ADMIN_SUPPORT_DETAILS"] = "android.settings.SHOW_ADMIN_SUPPORT_DETAILS";
    ActivityAction["SHOW_INPUT_METHOD_PICKER"] = "android.settings.SHOW_INPUT_METHOD_PICKER";
    ActivityAction["SHOW_REGULATORY_INFO"] = "android.settings.SHOW_REGULATORY_INFO";
    ActivityAction["SHOW_REMOTE_BUGREPORT_DIALOG"] = "android.settings.SHOW_REMOTE_BUGREPORT_DIALOG";
    ActivityAction["SOUND_SETTINGS"] = "android.settings.SOUND_SETTINGS";
    ActivityAction["STORAGE_MANAGER_SETTINGS"] = "android.settings.STORAGE_MANAGER_SETTINGS";
    ActivityAction["SYNC_SETTINGS"] = "android.settings.SYNC_SETTINGS";
    ActivityAction["SYSTEM_UPDATE_SETTINGS"] = "android.settings.SYSTEM_UPDATE_SETTINGS";
    ActivityAction["TETHER_PROVISIONING_UI"] = "android.settings.TETHER_PROVISIONING_UI";
    ActivityAction["TRUSTED_CREDENTIALS_USER"] = "android.settings.TRUSTED_CREDENTIALS_USER";
    ActivityAction["USAGE_ACCESS_SETTINGS"] = "android.settings.USAGE_ACCESS_SETTINGS";
    ActivityAction["USER_DICTIONARY_INSERT"] = "android.settings.USER_DICTIONARY_INSERT";
    ActivityAction["USER_DICTIONARY_SETTINGS"] = "android.settings.USER_DICTIONARY_SETTINGS";
    ActivityAction["USER_SETTINGS"] = "android.settings.USER_SETTINGS";
    ActivityAction["VOICE_CONTROL_AIRPLANE_MODE"] = "android.settings.VOICE_CONTROL_AIRPLANE_MODE";
    ActivityAction["VOICE_CONTROL_BATTERY_SAVER_MODE"] = "android.settings.VOICE_CONTROL_BATTERY_SAVER_MODE";
    ActivityAction["VOICE_CONTROL_DO_NOT_DISTURB_MODE"] = "android.settings.VOICE_CONTROL_DO_NOT_DISTURB_MODE";
    ActivityAction["VOICE_INPUT_SETTINGS"] = "android.settings.VOICE_INPUT_SETTINGS";
    ActivityAction["VPN_SETTINGS"] = "android.settings.VPN_SETTINGS";
    ActivityAction["VR_LISTENER_SETTINGS"] = "android.settings.VR_LISTENER_SETTINGS";
    ActivityAction["WEBVIEW_SETTINGS"] = "android.settings.WEBVIEW_SETTINGS";
    ActivityAction["WIFI_IP_SETTINGS"] = "android.settings.WIFI_IP_SETTINGS";
    ActivityAction["WIFI_SETTINGS"] = "android.settings.WIFI_SETTINGS";
    ActivityAction["WIRELESS_SETTINGS"] = "android.settings.WIRELESS_SETTINGS";
    ActivityAction["ZEN_MODE_AUTOMATION_SETTINGS"] = "android.settings.ZEN_MODE_AUTOMATION_SETTINGS";
    ActivityAction["ZEN_MODE_EVENT_RULE_SETTINGS"] = "android.settings.ZEN_MODE_EVENT_RULE_SETTINGS";
    ActivityAction["ZEN_MODE_EXTERNAL_RULE_SETTINGS"] = "android.settings.ZEN_MODE_EXTERNAL_RULE_SETTINGS";
    ActivityAction["ZEN_MODE_PRIORITY_SETTINGS"] = "android.settings.ZEN_MODE_PRIORITY_SETTINGS";
    ActivityAction["ZEN_MODE_SCHEDULE_RULE_SETTINGS"] = "android.settings.ZEN_MODE_SCHEDULE_RULE_SETTINGS";
    ActivityAction["ZEN_MODE_SETTINGS"] = "android.settings.ZEN_MODE_SETTINGS";
})(ActivityAction || (ActivityAction = {}));
// @needsAudit
export var ResultCode;
(function (ResultCode) {
    /**
     * Indicates that the activity operation succeeded.
     */
    ResultCode[ResultCode["Success"] = -1] = "Success";
    /**
     * Means that the activity was canceled, e.g. by tapping on the back button.
     */
    ResultCode[ResultCode["Canceled"] = 0] = "Canceled";
    /**
     * First custom, user-defined value that can be returned by the activity.
     */
    ResultCode[ResultCode["FirstUser"] = 1] = "FirstUser";
})(ResultCode || (ResultCode = {}));
// @needsAudit
/**
 * Starts the specified activity. The method will return a promise which resolves when the user
 * returns to the app.
 * @param activityAction The action to be performed, e.g. `IntentLauncher.ActivityAction.WIRELESS_SETTINGS`.
 * There are a few pre-defined constants you can use for this parameter.
 * You can find them at [expo-intent-launcher/src/IntentLauncher.ts](https://github.com/expo/expo/blob/main/packages/expo-intent-launcher/src/IntentLauncher.ts).
 * @param params An object of intent parameters.
 * @return A promise which fulfils with `IntentLauncherResult` object.
 */
export async function startActivityAsync(activityAction, params = {}) {
    if (!ExpoIntentLauncher.startActivity) {
        throw new UnavailabilityError('IntentLauncher', 'startActivityAsync');
    }
    if (!activityAction || typeof activityAction !== 'string') {
        throw new TypeError(`'activityAction' argument must be a non-empty string!`);
    }
    return ExpoIntentLauncher.startActivity(activityAction, params);
}
//# sourceMappingURL=IntentLauncher.js.map
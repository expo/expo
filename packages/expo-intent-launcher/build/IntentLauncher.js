import { UnavailabilityError } from 'expo-modules-core';
import ExpoIntentLauncher from './ExpoIntentLauncher';
// @needsAudit
/**
 * Constants are from the source code of [Settings provider](https://developer.android.com/reference/android/provider/Settings).
 */
export var ActivityAction;
(function (ActivityAction) {
    ActivityAction["ACCESSIBILITY_COLOR_CONTRAST_SETTINGS"] = "android.settings.ACCESSIBILITY_COLOR_CONTRAST_SETTINGS";
    ActivityAction["ACCESSIBILITY_COLOR_MOTION_SETTINGS"] = "android.settings.ACCESSIBILITY_COLOR_MOTION_SETTINGS";
    ActivityAction["ACCESSIBILITY_COLOR_SPACE_SETTINGS"] = "com.android.settings.ACCESSIBILITY_COLOR_SPACE_SETTINGS";
    ActivityAction["ACCESSIBILITY_DETAILS_SETTINGS"] = "android.settings.ACCESSIBILITY_DETAILS_SETTINGS";
    ActivityAction["ACCESSIBILITY_SETTINGS"] = "android.settings.ACCESSIBILITY_SETTINGS";
    ActivityAction["ACCESSIBILITY_SETTINGS_FOR_SUW"] = "android.settings.ACCESSIBILITY_SETTINGS_FOR_SUW";
    ActivityAction["ACCESSIBILITY_SHORTCUT_SETTINGS"] = "android.settings.ACCESSIBILITY_SHORTCUT_SETTINGS";
    ActivityAction["ACCOUNT_SYNC_SETTINGS"] = "android.settings.ACCOUNT_SYNC_SETTINGS";
    ActivityAction["ADAPTIVE_BRIGHTNESS_SETTINGS"] = "android.settings.ADAPTIVE_BRIGHTNESS_SETTINGS";
    ActivityAction["ADD_ACCOUNT_SETTINGS"] = "android.settings.ADD_ACCOUNT_SETTINGS";
    ActivityAction["ADVANCED_CONNECTED_DEVICE_SETTINGS"] = "com.android.settings.ADVANCED_CONNECTED_DEVICE_SETTINGS";
    ActivityAction["ADVANCED_MEMORY_PROTECTION_SETTINGS"] = "android.settings.ADVANCED_MEMORY_PROTECTION_SETTINGS";
    ActivityAction["AIRPLANE_MODE_SETTINGS"] = "android.settings.AIRPLANE_MODE_SETTINGS";
    ActivityAction["ALL_APPS_NOTIFICATION_SETTINGS"] = "android.settings.ALL_APPS_NOTIFICATION_SETTINGS";
    ActivityAction["ALL_APPS_NOTIFICATION_SETTINGS_FOR_REVIEW"] = "android.settings.ALL_APPS_NOTIFICATION_SETTINGS_FOR_REVIEW";
    ActivityAction["APN_SETTINGS"] = "android.settings.APN_SETTINGS";
    ActivityAction["APP_LOCALE_SETTINGS"] = "android.settings.APP_LOCALE_SETTINGS";
    ActivityAction["APP_MEMORY_USAGE"] = "android.settings.APP_MEMORY_USAGE";
    ActivityAction["APP_NOTIFICATION_BUBBLE_SETTINGS"] = "android.settings.APP_NOTIFICATION_BUBBLE_SETTINGS";
    ActivityAction["APP_NOTIFICATION_REDACTION"] = "android.settings.ACTION_APP_NOTIFICATION_REDACTION";
    ActivityAction["APP_NOTIFICATION_SETTINGS"] = "android.settings.APP_NOTIFICATION_SETTINGS";
    ActivityAction["APP_OPEN_BY_DEFAULT_SETTINGS"] = "android.settings.APP_OPEN_BY_DEFAULT_SETTINGS";
    ActivityAction["APP_STORAGE_SETTINGS"] = "com.android.settings.APP_STORAGE_SETTINGS";
    ActivityAction["APPLICATION_DETAILS_SETTINGS"] = "android.settings.APPLICATION_DETAILS_SETTINGS";
    ActivityAction["APPLICATION_DEVELOPMENT_SETTINGS"] = "android.settings.APPLICATION_DEVELOPMENT_SETTINGS";
    ActivityAction["APPLICATION_SETTINGS"] = "android.settings.APPLICATION_SETTINGS";
    ActivityAction["AUDIO_STREAM_DIALOG"] = "android.settings.AUDIO_STREAM_DIALOG";
    ActivityAction["AUTO_ROTATE_SETTINGS"] = "android.settings.AUTO_ROTATE_SETTINGS";
    ActivityAction["AUTOMATIC_ZEN_RULE_SETTINGS"] = "android.settings.AUTOMATIC_ZEN_RULE_SETTINGS";
    ActivityAction["BACKUP_SETTINGS"] = "com.android.settings.BACKUP_SETTINGS";
    ActivityAction["BATTERY_POWER_USAGE_ADVANCED"] = "com.android.settings.battery.action.POWER_USAGE_ADVANCED";
    ActivityAction["BATTERY_SAVER_SCHEDULE_SETTINGS"] = "com.android.settings.BATTERY_SAVER_SCHEDULE_SETTINGS";
    ActivityAction["BATTERY_SAVER_SETTINGS"] = "android.settings.BATTERY_SAVER_SETTINGS";
    ActivityAction["BIOMETRIC_ENROLL"] = "android.settings.BIOMETRIC_ENROLL";
    ActivityAction["BIOMETRIC_SETTINGS_PROVIDER"] = "com.android.settings.biometrics.BIOMETRIC_SETTINGS_PROVIDER";
    ActivityAction["BLUETOOTH_AUDIO_SHARING_SETTINGS"] = "com.android.settings.BLUETOOTH_AUDIO_SHARING_SETTINGS";
    ActivityAction["BLUETOOTH_DASHBOARD_SETTINGS"] = "android.settings.BLUETOOTH_DASHBOARD_SETTINGS";
    ActivityAction["BLUETOOTH_DEVICE_DETAIL_SETTINGS"] = "com.android.settings.BLUETOOTH_DEVICE_DETAIL_SETTINGS";
    ActivityAction["BLUETOOTH_LE_AUDIO_QR_CODE_SCANNER"] = "android.settings.BLUETOOTH_LE_AUDIO_QR_CODE_SCANNER";
    ActivityAction["BLUETOOTH_PAIRING_SETTINGS"] = "android.settings.BLUETOOTH_PAIRING_SETTINGS";
    ActivityAction["BLUETOOTH_SETTINGS"] = "android.settings.BLUETOOTH_SETTINGS";
    ActivityAction["BLUTOOTH_FIND_BROADCASTS_ACTIVITY"] = "android.settings.BLUTOOTH_FIND_BROADCASTS_ACTIVITY";
    ActivityAction["BUGREPORT_HANDLER_SETTINGS"] = "android.settings.BUGREPORT_HANDLER_SETTINGS";
    ActivityAction["BUTTON_NAVIGATION_SETTINGS"] = "com.android.settings.BUTTON_NAVIGATION_SETTINGS";
    ActivityAction["CAPTIONING_SETTINGS"] = "android.settings.CAPTIONING_SETTINGS";
    ActivityAction["CAST_SETTINGS"] = "android.settings.CAST_SETTINGS";
    ActivityAction["CELLULAR_NETWORK_SECURITY"] = "android.settings.CELLULAR_NETWORK_SECURITY";
    ActivityAction["CHANNEL_NOTIFICATION_SETTINGS"] = "android.settings.CHANNEL_NOTIFICATION_SETTINGS";
    ActivityAction["COLOR_INVERSION_SETTINGS"] = "android.settings.COLOR_INVERSION_SETTINGS";
    ActivityAction["COMBINED_BIOMETRICS_SETTINGS"] = "android.settings.COMBINED_BIOMETRICS_SETTINGS";
    ActivityAction["COMMUNAL_SETTINGS"] = "android.settings.COMMUNAL_SETTINGS";
    ActivityAction["CONDITION_PROVIDER_SETTINGS"] = "android.settings.ACTION_CONDITION_PROVIDER_SETTINGS";
    ActivityAction["CONVERSATION_SETTINGS"] = "android.settings.CONVERSATION_SETTINGS";
    ActivityAction["CREDENTIAL_PROVIDER"] = "android.settings.CREDENTIAL_PROVIDER";
    ActivityAction["DARK_THEME_SETTINGS"] = "android.settings.DARK_THEME_SETTINGS";
    ActivityAction["DATA_ROAMING_SETTINGS"] = "android.settings.DATA_ROAMING_SETTINGS";
    ActivityAction["DATA_SAVER_SETTINGS"] = "android.settings.DATA_SAVER_SETTINGS";
    ActivityAction["DATA_USAGE_SETTINGS"] = "android.settings.DATA_USAGE_SETTINGS";
    ActivityAction["DATE_SETTINGS"] = "android.settings.DATE_SETTINGS";
    ActivityAction["DEVELOPMENT_START_DSU_LOADER"] = "android.settings.development.START_DSU_LOADER";
    ActivityAction["DEVICE_INFO_SETTINGS"] = "android.settings.DEVICE_INFO_SETTINGS";
    ActivityAction["DEVICE_NAME"] = "android.settings.DEVICE_NAME";
    ActivityAction["DISPLAY_SETTINGS"] = "android.settings.DISPLAY_SETTINGS";
    ActivityAction["DREAM_SETTINGS"] = "android.settings.DREAM_SETTINGS";
    ActivityAction["ENTERPRISE_PRIVACY_SETTINGS"] = "android.settings.ENTERPRISE_PRIVACY_SETTINGS";
    ActivityAction["FACE_ENROLL"] = "android.settings.FACE_ENROLL";
    ActivityAction["FACE_SETTINGS"] = "android.settings.FACE_SETTINGS";
    ActivityAction["FACTORY_RESET"] = "com.android.settings.action.FACTORY_RESET";
    ActivityAction["FINGERPRINT_ENROLL"] = "android.settings.FINGERPRINT_ENROLL";
    ActivityAction["FINGERPRINT_SETTINGS"] = "android.settings.FINGERPRINT_SETTINGS";
    ActivityAction["FINGERPRINT_SETTINGS_V2"] = "android.settings.FINGERPRINT_SETTINGS_V2";
    ActivityAction["FINGERPRINT_SETUP"] = "android.settings.FINGERPRINT_SETUP";
    ActivityAction["FIRST_DAY_OF_WEEK_SETTINGS"] = "android.settings.FIRST_DAY_OF_WEEK_SETTINGS";
    ActivityAction["GESTURE_NAVIGATION_SETTINGS"] = "com.android.settings.GESTURE_NAVIGATION_SETTINGS";
    ActivityAction["HARD_KEYBOARD_LAYOUT_PICKER_SETTINGS"] = "android.settings.HARD_KEYBOARD_LAYOUT_PICKER_SETTINGS";
    ActivityAction["HARD_KEYBOARD_SETTINGS"] = "android.settings.HARD_KEYBOARD_SETTINGS";
    ActivityAction["HEARING_DEVICES_PAIRING_SETTINGS"] = "android.settings.HEARING_DEVICES_PAIRING_SETTINGS";
    ActivityAction["HEARING_DEVICES_SETTINGS"] = "android.settings.HEARING_DEVICES_SETTINGS";
    ActivityAction["HOME_SETTINGS"] = "android.settings.HOME_SETTINGS";
    ActivityAction["IA_SETTINGS"] = "com.android.settings.action.IA_SETTINGS";
    ActivityAction["IGNORE_BACKGROUND_DATA_RESTRICTIONS_SETTINGS"] = "android.settings.IGNORE_BACKGROUND_DATA_RESTRICTIONS_SETTINGS";
    ActivityAction["IGNORE_BATTERY_OPTIMIZATION_SETTINGS"] = "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS";
    ActivityAction["INPUT_METHOD_SETTINGS"] = "android.settings.INPUT_METHOD_SETTINGS";
    ActivityAction["INPUT_METHOD_SUBTYPE_SETTINGS"] = "android.settings.INPUT_METHOD_SUBTYPE_SETTINGS";
    ActivityAction["INTERNAL_STORAGE_SETTINGS"] = "android.settings.INTERNAL_STORAGE_SETTINGS";
    ActivityAction["LANGUAGE_SETTINGS"] = "android.settings.LANGUAGE_SETTINGS";
    ActivityAction["LICENSE"] = "android.settings.LICENSE";
    ActivityAction["LOCALE_SETTINGS"] = "android.settings.LOCALE_SETTINGS";
    ActivityAction["LOCATION_SCANNING_SETTINGS"] = "android.settings.LOCATION_SCANNING_SETTINGS";
    ActivityAction["LOCATION_SOURCE_SETTINGS"] = "android.settings.LOCATION_SOURCE_SETTINGS";
    ActivityAction["LOCK_SCREEN_SETTINGS"] = "android.settings.LOCK_SCREEN_SETTINGS";
    ActivityAction["MANAGE_ADAPTIVE_NOTIFICATIONS"] = "android.settings.MANAGE_ADAPTIVE_NOTIFICATIONS";
    ActivityAction["MANAGE_ALL_APPLICATIONS_SETTINGS"] = "android.settings.MANAGE_ALL_APPLICATIONS_SETTINGS";
    ActivityAction["MANAGE_ALL_FILES_ACCESS_PERMISSION"] = "android.settings.MANAGE_ALL_FILES_ACCESS_PERMISSION";
    ActivityAction["MANAGE_ALL_SIM_PROFILES_SETTINGS"] = "android.settings.MANAGE_ALL_SIM_PROFILES_SETTINGS";
    ActivityAction["MANAGE_APP_ALL_FILES_ACCESS_PERMISSION"] = "android.settings.MANAGE_APP_ALL_FILES_ACCESS_PERMISSION";
    ActivityAction["MANAGE_APP_LONG_RUNNING_JOBS"] = "android.settings.MANAGE_APP_LONG_RUNNING_JOBS";
    ActivityAction["MANAGE_APP_OVERLAY_PERMISSION"] = "android.settings.MANAGE_APP_OVERLAY_PERMISSION";
    ActivityAction["MANAGE_APP_USE_FULL_SCREEN_INTENT"] = "android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT";
    ActivityAction["MANAGE_APPLICATIONS_SETTINGS"] = "android.settings.MANAGE_APPLICATIONS_SETTINGS";
    ActivityAction["MANAGE_CLONED_APPS_SETTINGS"] = "android.settings.MANAGE_CLONED_APPS_SETTINGS";
    ActivityAction["MANAGE_CROSS_PROFILE_ACCESS"] = "android.settings.MANAGE_CROSS_PROFILE_ACCESS";
    ActivityAction["MANAGE_DEFAULT_APPS_SETTINGS"] = "android.settings.MANAGE_DEFAULT_APPS_SETTINGS";
    ActivityAction["MANAGE_DOMAIN_URLS"] = "android.settings.MANAGE_DOMAIN_URLS";
    ActivityAction["MANAGE_OVERLAY_PERMISSION"] = "android.settings.action.MANAGE_OVERLAY_PERMISSION";
    ActivityAction["MANAGE_UNKNOWN_APP_SOURCES"] = "android.settings.MANAGE_UNKNOWN_APP_SOURCES";
    ActivityAction["MANAGE_USER_ASPECT_RATIO_SETTINGS"] = "android.settings.MANAGE_USER_ASPECT_RATIO_SETTINGS";
    ActivityAction["MANAGE_WRITE_SETTINGS"] = "android.settings.action.MANAGE_WRITE_SETTINGS";
    ActivityAction["MANAGED_PROFILE_SETTINGS"] = "android.settings.MANAGED_PROFILE_SETTINGS";
    ActivityAction["MEDIA_BROADCAST_DIALOG"] = "android.settings.MEDIA_BROADCAST_DIALOG";
    ActivityAction["MEDIA_CONTROLS_SETTINGS"] = "android.settings.ACTION_MEDIA_CONTROLS_SETTINGS";
    ActivityAction["MEMORY_CARD_SETTINGS"] = "android.settings.MEMORY_CARD_SETTINGS";
    ActivityAction["MMS_MESSAGE_SETTING"] = "android.settings.MMS_MESSAGE_SETTING";
    ActivityAction["MOBILE_DATA_USAGE"] = "android.settings.MOBILE_DATA_USAGE";
    ActivityAction["MOBILE_NETWORK_LIST"] = "android.settings.MOBILE_NETWORK_LIST";
    ActivityAction["MODULE_LICENSES"] = "android.settings.MODULE_LICENSES";
    ActivityAction["MONITORING_CERT_INFO"] = "com.android.settings.MONITORING_CERT_INFO";
    ActivityAction["MORE_SECURITY_PRIVACY_SETTINGS"] = "com.android.settings.MORE_SECURITY_PRIVACY_SETTINGS";
    ActivityAction["NAVIGATION_MODE_SETTINGS"] = "com.android.settings.NAVIGATION_MODE_SETTINGS";
    ActivityAction["NETWORK_OPERATOR_SETTINGS"] = "android.settings.NETWORK_OPERATOR_SETTINGS";
    ActivityAction["NETWORK_PROVIDER_SETTINGS"] = "android.settings.NETWORK_PROVIDER_SETTINGS";
    ActivityAction["NFC_SETTINGS"] = "android.settings.NFC_SETTINGS";
    ActivityAction["NIGHT_DISPLAY_SETTINGS"] = "android.settings.NIGHT_DISPLAY_SETTINGS";
    ActivityAction["NOTIFICATION_ASSISTANT_SETTINGS"] = "android.settings.NOTIFICATION_ASSISTANT_SETTINGS";
    ActivityAction["NOTIFICATION_HISTORY"] = "android.settings.NOTIFICATION_HISTORY";
    ActivityAction["NOTIFICATION_LISTENER_DETAIL_SETTINGS"] = "android.settings.NOTIFICATION_LISTENER_DETAIL_SETTINGS";
    ActivityAction["NOTIFICATION_LISTENER_SETTINGS"] = "android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS";
    ActivityAction["NOTIFICATION_POLICY_ACCESS_DETAIL_SETTINGS"] = "android.settings.NOTIFICATION_POLICY_ACCESS_DETAIL_SETTINGS";
    ActivityAction["NOTIFICATION_POLICY_ACCESS_SETTINGS"] = "android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS";
    ActivityAction["NOTIFICATION_SETTINGS"] = "android.settings.NOTIFICATION_SETTINGS";
    ActivityAction["ONE_HANDED_SETTINGS"] = "android.settings.action.ONE_HANDED_SETTINGS";
    ActivityAction["OPEN_PRIVATE_SPACE_SETTINGS"] = "com.android.settings.action.OPEN_PRIVATE_SPACE_SETTINGS";
    ActivityAction["OTHER_SOUND_SETTINGS"] = "android.settings.ACTION_OTHER_SOUND_SETTINGS";
    ActivityAction["PANEL_INTERNET_CONNECTIVITY"] = "android.settings.panel.action.INTERNET_CONNECTIVITY";
    ActivityAction["PANEL_NFC"] = "android.settings.panel.action.NFC";
    ActivityAction["PANEL_VOLUME"] = "android.settings.panel.action.VOLUME";
    ActivityAction["PANEL_WIFI"] = "android.settings.panel.action.WIFI";
    ActivityAction["PICTURE_IN_PICTURE_SETTINGS"] = "android.settings.PICTURE_IN_PICTURE_SETTINGS";
    ActivityAction["POWER_MENU_SETTINGS"] = "android.settings.ACTION_POWER_MENU_SETTINGS";
    ActivityAction["PREMIUM_SMS_SETTINGS"] = "android.settings.PREMIUM_SMS_SETTINGS";
    ActivityAction["PREVIOUSLY_CONNECTED_DEVICE"] = "com.android.settings.PREVIOUSLY_CONNECTED_DEVICE";
    ActivityAction["PRINT_SETTINGS"] = "android.settings.ACTION_PRINT_SETTINGS";
    ActivityAction["PRIVACY_ADVANCED_SETTINGS"] = "android.settings.PRIVACY_ADVANCED_SETTINGS";
    ActivityAction["PRIVACY_CONTROLS"] = "android.settings.PRIVACY_CONTROLS";
    ActivityAction["PRIVACY_SETTINGS"] = "android.settings.PRIVACY_SETTINGS";
    ActivityAction["PROCESS_WIFI_EASY_CONNECT_URI"] = "android.settings.PROCESS_WIFI_EASY_CONNECT_URI";
    ActivityAction["REDUCE_BRIGHT_COLORS_SETTINGS"] = "android.settings.REDUCE_BRIGHT_COLORS_SETTINGS";
    ActivityAction["REGIONAL_PREFERENCES_SETTINGS"] = "android.settings.REGIONAL_PREFERENCES_SETTINGS";
    ActivityAction["REMOTE_AUTHENTICATOR_ENROLL"] = "android.settings.REMOTE_AUTHENTICATOR_ENROLL";
    ActivityAction["REQUEST_ENABLE_CONTENT_CAPTURE"] = "android.settings.REQUEST_ENABLE_CONTENT_CAPTURE";
    ActivityAction["REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"] = "android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS";
    ActivityAction["REQUEST_MANAGE_MEDIA"] = "android.settings.REQUEST_MANAGE_MEDIA";
    ActivityAction["REQUEST_MEDIA_ROUTING_CONTROL"] = "android.settings.REQUEST_MEDIA_ROUTING_CONTROL";
    ActivityAction["REQUEST_SCHEDULE_EXACT_ALARM"] = "android.settings.REQUEST_SCHEDULE_EXACT_ALARM";
    ActivityAction["REQUEST_SET_AUTOFILL_SERVICE"] = "android.settings.REQUEST_SET_AUTOFILL_SERVICE";
    ActivityAction["SATELLITE_SETTING"] = "android.settings.SATELLITE_SETTING";
    ActivityAction["SCREEN_TIMEOUT_SETTINGS"] = "android.settings.SCREEN_TIMEOUT_SETTINGS";
    ActivityAction["SEARCH_RESULT_TRAMPOLINE"] = "com.android.settings.SEARCH_RESULT_TRAMPOLINE";
    ActivityAction["SECURITY_ADVANCED_SETTINGS"] = "com.android.settings.security.SECURITY_ADVANCED_SETTINGS";
    ActivityAction["SECURITY_SETTINGS"] = "android.settings.SECURITY_SETTINGS";
    ActivityAction["SETTINGS"] = "android.settings.SETTINGS";
    ActivityAction["SETTINGS_EMBED_DEEP_LINK_ACTIVITY"] = "android.settings.SETTINGS_EMBED_DEEP_LINK_ACTIVITY";
    ActivityAction["SETUP_LOCK_SCREEN"] = "com.android.settings.SETUP_LOCK_SCREEN";
    ActivityAction["SHOW_ADMIN_SUPPORT_DETAILS"] = "android.settings.SHOW_ADMIN_SUPPORT_DETAILS";
    ActivityAction["SHOW_MANUAL"] = "android.settings.SHOW_MANUAL";
    ActivityAction["SHOW_REGULATORY_INFO"] = "android.settings.SHOW_REGULATORY_INFO";
    ActivityAction["SHOW_REMOTE_BUGREPORT_DIALOG"] = "android.settings.SHOW_REMOTE_BUGREPORT_DIALOG";
    ActivityAction["SHOW_RESTRICTED_SETTING_DIALOG"] = "android.settings.SHOW_RESTRICTED_SETTING_DIALOG";
    ActivityAction["SIM_PREFERENCE_SETTINGS"] = "android.settings.SIM_PREFERENCE_SETTINGS";
    ActivityAction["SIM_SUB_INFO_SETTINGS"] = "com.android.settings.sim.SIM_SUB_INFO_SETTINGS";
    ActivityAction["SOUND_SETTINGS"] = "android.settings.SOUND_SETTINGS";
    ActivityAction["SPA_SEARCH_LANDING"] = "android.settings.SPA_SEARCH_LANDING";
    ActivityAction["STORAGE_MANAGER_SETTINGS"] = "android.settings.STORAGE_MANAGER_SETTINGS";
    ActivityAction["STYLUS_USI_DETAILS_SETTINGS"] = "com.android.settings.STYLUS_USI_DETAILS_SETTINGS";
    ActivityAction["SUGGESTION_STATE_PROVIDER"] = "com.android.settings.action.SUGGESTION_STATE_PROVIDER";
    ActivityAction["SUPPORT_SETTINGS"] = "com.android.settings.action.SUPPORT_SETTINGS";
    ActivityAction["SYNC_SETTINGS"] = "android.settings.SYNC_SETTINGS";
    ActivityAction["TEMPERATURE_UNIT_SETTINGS"] = "android.settings.TEMPERATURE_UNIT_SETTINGS";
    ActivityAction["TETHER_PROVISIONING_UI"] = "android.settings.TETHER_PROVISIONING_UI";
    ActivityAction["TETHER_SETTINGS"] = "android.settings.TETHER_SETTINGS";
    ActivityAction["TETHER_UNSUPPORTED_CARRIER_UI"] = "android.settings.TETHER_UNSUPPORTED_CARRIER_UI";
    ActivityAction["TEXT_READING_SETTINGS"] = "android.settings.TEXT_READING_SETTINGS";
    ActivityAction["TRUSTED_CREDENTIALS"] = "com.android.settings.TRUSTED_CREDENTIALS";
    ActivityAction["TRUSTED_CREDENTIALS_USER"] = "com.android.settings.TRUSTED_CREDENTIALS_USER";
    ActivityAction["TTS_SETTINGS"] = "com.android.settings.TTS_SETTINGS";
    ActivityAction["TURN_SCREEN_ON_SETTINGS"] = "android.settings.TURN_SCREEN_ON_SETTINGS";
    ActivityAction["USAGE_ACCESS_SETTINGS"] = "android.settings.USAGE_ACCESS_SETTINGS";
    ActivityAction["USER_DICTIONARY_INSERT"] = "android.settings.USER_DICTIONARY_INSERT";
    ActivityAction["USER_DICTIONARY_SETTINGS"] = "android.settings.USER_DICTIONARY_SETTINGS";
    ActivityAction["USER_SETTINGS"] = "android.settings.USER_SETTINGS";
    ActivityAction["VIEW_ADVANCED_POWER_USAGE_DETAIL"] = "android.settings.VIEW_ADVANCED_POWER_USAGE_DETAIL";
    ActivityAction["VOICE_CONTROL_AIRPLANE_MODE"] = "android.settings.VOICE_CONTROL_AIRPLANE_MODE";
    ActivityAction["VOICE_CONTROL_BATTERY_SAVER_MODE"] = "android.settings.VOICE_CONTROL_BATTERY_SAVER_MODE";
    ActivityAction["VOICE_CONTROL_DO_NOT_DISTURB_MODE"] = "android.settings.VOICE_CONTROL_DO_NOT_DISTURB_MODE";
    ActivityAction["VOICE_INPUT_SETTINGS"] = "android.settings.VOICE_INPUT_SETTINGS";
    ActivityAction["VPN_SETTINGS"] = "android.settings.VPN_SETTINGS";
    ActivityAction["VR_LISTENER_SETTINGS"] = "android.settings.VR_LISTENER_SETTINGS";
    ActivityAction["WALLPAPER_SETTINGS"] = "android.settings.WALLPAPER_SETTINGS";
    ActivityAction["WEBVIEW_SETTINGS"] = "android.settings.WEBVIEW_SETTINGS";
    ActivityAction["WIFI_ADD_NETWORKS"] = "android.settings.WIFI_ADD_NETWORKS";
    ActivityAction["WIFI_CALLING_SETTINGS"] = "android.settings.WIFI_CALLING_SETTINGS";
    ActivityAction["WIFI_DETAILS_SETTINGS"] = "android.settings.WIFI_DETAILS_SETTINGS";
    ActivityAction["WIFI_DIALOG"] = "com.android.settings.WIFI_DIALOG";
    ActivityAction["WIFI_DPP_CONFIGURATOR_AUTH_QR_CODE_GENERATOR"] = "android.settings.WIFI_DPP_CONFIGURATOR_AUTH_QR_CODE_GENERATOR";
    ActivityAction["WIFI_DPP_CONFIGURATOR_QR_CODE_GENERATOR"] = "android.settings.WIFI_DPP_CONFIGURATOR_QR_CODE_GENERATOR";
    ActivityAction["WIFI_DPP_CONFIGURATOR_QR_CODE_SCANNER"] = "android.settings.WIFI_DPP_CONFIGURATOR_QR_CODE_SCANNER";
    ActivityAction["WIFI_DPP_ENROLLEE_QR_CODE_SCANNER"] = "android.settings.WIFI_DPP_ENROLLEE_QR_CODE_SCANNER";
    ActivityAction["WIFI_IP_SETTINGS"] = "android.settings.WIFI_IP_SETTINGS";
    ActivityAction["WIFI_NETWORK_REQUEST"] = "com.android.settings.wifi.action.NETWORK_REQUEST";
    ActivityAction["WIFI_SAVED_NETWORK_SETTINGS"] = "android.settings.WIFI_SAVED_NETWORK_SETTINGS";
    ActivityAction["WIFI_SCANNING_SETTINGS"] = "android.settings.WIFI_SCANNING_SETTINGS";
    ActivityAction["WIFI_SETTINGS"] = "android.settings.WIFI_SETTINGS";
    ActivityAction["WIFI_TETHER_SETTINGS"] = "com.android.settings.WIFI_TETHER_SETTINGS";
    ActivityAction["WIRELESS_SETTINGS"] = "android.settings.WIRELESS_SETTINGS";
    ActivityAction["ZEN_MODE_AUTOMATION_SETTINGS"] = "android.settings.ZEN_MODE_AUTOMATION_SETTINGS";
    ActivityAction["ZEN_MODE_EVENT_RULE_SETTINGS"] = "android.settings.ZEN_MODE_EVENT_RULE_SETTINGS";
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
     * Means that the activity was canceled, for example, by tapping on the back button.
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
 * @param activityAction The action to be performed, for example, `IntentLauncher.ActivityAction.WIRELESS_SETTINGS`.
 * There are a few pre-defined constants you can use for this parameter.
 * You can find them at [`expo-intent-launcher/src/IntentLauncher.ts`](https://github.com/expo/expo/blob/main/packages/expo-intent-launcher/src/IntentLauncher.ts).
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
/**
 * Opens an application by its package name.
 * @param packageName For example: `com.google.android.gm` for Gmail.
 */
export function openApplication(packageName) {
    if (!ExpoIntentLauncher.openApplication) {
        throw new UnavailabilityError('IntentLauncher', 'openApplication');
    }
    return ExpoIntentLauncher.openApplication(packageName);
}
/**
 * Returns the icon of the specified application as a base64-encoded PNG image string.
 * The returned string is prefixed with `data:image/png;base64,` and can be used directly in an `expo-image`'s [`Image.source`](./image/#source) prop.
 *
 * @param packageName The package name of the target application. For example, `com.google.android.gm` for Gmail.
 * @return A promise that resolves to the base64-encoded PNG icon of the specified application, or an empty string if the icon could not be retrieved.
 */
export async function getApplicationIconAsync(packageName) {
    if (!ExpoIntentLauncher.getApplicationIcon) {
        throw new UnavailabilityError('IntentLauncher', 'getApplicationIconAsync');
    }
    return ExpoIntentLauncher.getApplicationIcon(packageName);
}
//# sourceMappingURL=IntentLauncher.js.map
import { UnavailabilityError } from 'expo-modules-core';

import ExpoIntentLauncher from './ExpoIntentLauncher';

// @needsAudit
/**
 * Constants are from the source code of [Settings provider](https://developer.android.com/reference/android/provider/Settings).
 */
export enum ActivityAction {
  ACCESSIBILITY_COLOR_CONTRAST_SETTINGS = 'android.settings.ACCESSIBILITY_COLOR_CONTRAST_SETTINGS',
  ACCESSIBILITY_COLOR_MOTION_SETTINGS = 'android.settings.ACCESSIBILITY_COLOR_MOTION_SETTINGS',
  ACCESSIBILITY_COLOR_SPACE_SETTINGS = 'com.android.settings.ACCESSIBILITY_COLOR_SPACE_SETTINGS',
  ACCESSIBILITY_DETAILS_SETTINGS = 'android.settings.ACCESSIBILITY_DETAILS_SETTINGS',
  ACCESSIBILITY_SETTINGS = 'android.settings.ACCESSIBILITY_SETTINGS',
  ACCESSIBILITY_SETTINGS_FOR_SUW = 'android.settings.ACCESSIBILITY_SETTINGS_FOR_SUW',
  ACCESSIBILITY_SHORTCUT_SETTINGS = 'android.settings.ACCESSIBILITY_SHORTCUT_SETTINGS',
  ACCOUNT_SYNC_SETTINGS = 'android.settings.ACCOUNT_SYNC_SETTINGS',
  ADAPTIVE_BRIGHTNESS_SETTINGS = 'android.settings.ADAPTIVE_BRIGHTNESS_SETTINGS',
  ADD_ACCOUNT_SETTINGS = 'android.settings.ADD_ACCOUNT_SETTINGS',
  ADVANCED_CONNECTED_DEVICE_SETTINGS = 'com.android.settings.ADVANCED_CONNECTED_DEVICE_SETTINGS',
  ADVANCED_MEMORY_PROTECTION_SETTINGS = 'android.settings.ADVANCED_MEMORY_PROTECTION_SETTINGS',
  AIRPLANE_MODE_SETTINGS = 'android.settings.AIRPLANE_MODE_SETTINGS',
  ALL_APPS_NOTIFICATION_SETTINGS = 'android.settings.ALL_APPS_NOTIFICATION_SETTINGS',
  ALL_APPS_NOTIFICATION_SETTINGS_FOR_REVIEW = 'android.settings.ALL_APPS_NOTIFICATION_SETTINGS_FOR_REVIEW',
  APN_SETTINGS = 'android.settings.APN_SETTINGS',
  APP_LOCALE_SETTINGS = 'android.settings.APP_LOCALE_SETTINGS',
  APP_MEMORY_USAGE = 'android.settings.APP_MEMORY_USAGE',
  APP_NOTIFICATION_BUBBLE_SETTINGS = 'android.settings.APP_NOTIFICATION_BUBBLE_SETTINGS',
  APP_NOTIFICATION_REDACTION = 'android.settings.ACTION_APP_NOTIFICATION_REDACTION',
  APP_NOTIFICATION_SETTINGS = 'android.settings.APP_NOTIFICATION_SETTINGS',
  APP_OPEN_BY_DEFAULT_SETTINGS = 'android.settings.APP_OPEN_BY_DEFAULT_SETTINGS',
  APP_STORAGE_SETTINGS = 'com.android.settings.APP_STORAGE_SETTINGS',
  APPLICATION_DETAILS_SETTINGS = 'android.settings.APPLICATION_DETAILS_SETTINGS',
  APPLICATION_DEVELOPMENT_SETTINGS = 'android.settings.APPLICATION_DEVELOPMENT_SETTINGS',
  APPLICATION_SETTINGS = 'android.settings.APPLICATION_SETTINGS',
  AUDIO_STREAM_DIALOG = 'android.settings.AUDIO_STREAM_DIALOG',
  AUTO_ROTATE_SETTINGS = 'android.settings.AUTO_ROTATE_SETTINGS',
  AUTOMATIC_ZEN_RULE_SETTINGS = 'android.settings.AUTOMATIC_ZEN_RULE_SETTINGS',
  BACKUP_SETTINGS = 'com.android.settings.BACKUP_SETTINGS',
  BATTERY_POWER_USAGE_ADVANCED = 'com.android.settings.battery.action.POWER_USAGE_ADVANCED',
  BATTERY_SAVER_SCHEDULE_SETTINGS = 'com.android.settings.BATTERY_SAVER_SCHEDULE_SETTINGS',
  BATTERY_SAVER_SETTINGS = 'android.settings.BATTERY_SAVER_SETTINGS',
  BIOMETRIC_ENROLL = 'android.settings.BIOMETRIC_ENROLL',
  BIOMETRIC_SETTINGS_PROVIDER = 'com.android.settings.biometrics.BIOMETRIC_SETTINGS_PROVIDER',
  BLUETOOTH_AUDIO_SHARING_SETTINGS = 'com.android.settings.BLUETOOTH_AUDIO_SHARING_SETTINGS',
  BLUETOOTH_DASHBOARD_SETTINGS = 'android.settings.BLUETOOTH_DASHBOARD_SETTINGS',
  BLUETOOTH_DEVICE_DETAIL_SETTINGS = 'com.android.settings.BLUETOOTH_DEVICE_DETAIL_SETTINGS',
  BLUETOOTH_LE_AUDIO_QR_CODE_SCANNER = 'android.settings.BLUETOOTH_LE_AUDIO_QR_CODE_SCANNER',
  BLUETOOTH_PAIRING_SETTINGS = 'android.settings.BLUETOOTH_PAIRING_SETTINGS',
  BLUETOOTH_SETTINGS = 'android.settings.BLUETOOTH_SETTINGS',
  BLUTOOTH_FIND_BROADCASTS_ACTIVITY = 'android.settings.BLUTOOTH_FIND_BROADCASTS_ACTIVITY',
  BUGREPORT_HANDLER_SETTINGS = 'android.settings.BUGREPORT_HANDLER_SETTINGS',
  BUTTON_NAVIGATION_SETTINGS = 'com.android.settings.BUTTON_NAVIGATION_SETTINGS',
  CAPTIONING_SETTINGS = 'android.settings.CAPTIONING_SETTINGS',
  CAST_SETTINGS = 'android.settings.CAST_SETTINGS',
  CELLULAR_NETWORK_SECURITY = 'android.settings.CELLULAR_NETWORK_SECURITY',
  CHANNEL_NOTIFICATION_SETTINGS = 'android.settings.CHANNEL_NOTIFICATION_SETTINGS',
  COLOR_INVERSION_SETTINGS = 'android.settings.COLOR_INVERSION_SETTINGS',
  COMBINED_BIOMETRICS_SETTINGS = 'android.settings.COMBINED_BIOMETRICS_SETTINGS',
  COMMUNAL_SETTINGS = 'android.settings.COMMUNAL_SETTINGS',
  CONDITION_PROVIDER_SETTINGS = 'android.settings.ACTION_CONDITION_PROVIDER_SETTINGS',
  CONVERSATION_SETTINGS = 'android.settings.CONVERSATION_SETTINGS',
  CREDENTIAL_PROVIDER = 'android.settings.CREDENTIAL_PROVIDER',
  DARK_THEME_SETTINGS = 'android.settings.DARK_THEME_SETTINGS',
  DATA_ROAMING_SETTINGS = 'android.settings.DATA_ROAMING_SETTINGS',
  DATA_SAVER_SETTINGS = 'android.settings.DATA_SAVER_SETTINGS',
  DATA_USAGE_SETTINGS = 'android.settings.DATA_USAGE_SETTINGS',
  DATE_SETTINGS = 'android.settings.DATE_SETTINGS',
  DEVELOPMENT_START_DSU_LOADER = 'android.settings.development.START_DSU_LOADER',
  DEVICE_INFO_SETTINGS = 'android.settings.DEVICE_INFO_SETTINGS',
  DEVICE_NAME = 'android.settings.DEVICE_NAME',
  DISPLAY_SETTINGS = 'android.settings.DISPLAY_SETTINGS',
  DREAM_SETTINGS = 'android.settings.DREAM_SETTINGS',
  ENTERPRISE_PRIVACY_SETTINGS = 'android.settings.ENTERPRISE_PRIVACY_SETTINGS',
  FACE_ENROLL = 'android.settings.FACE_ENROLL',
  FACE_SETTINGS = 'android.settings.FACE_SETTINGS',
  FACTORY_RESET = 'com.android.settings.action.FACTORY_RESET',
  FINGERPRINT_ENROLL = 'android.settings.FINGERPRINT_ENROLL',
  FINGERPRINT_SETTINGS = 'android.settings.FINGERPRINT_SETTINGS',
  FINGERPRINT_SETTINGS_V2 = 'android.settings.FINGERPRINT_SETTINGS_V2',
  FINGERPRINT_SETUP = 'android.settings.FINGERPRINT_SETUP',
  FIRST_DAY_OF_WEEK_SETTINGS = 'android.settings.FIRST_DAY_OF_WEEK_SETTINGS',
  GESTURE_NAVIGATION_SETTINGS = 'com.android.settings.GESTURE_NAVIGATION_SETTINGS',
  HARD_KEYBOARD_LAYOUT_PICKER_SETTINGS = 'android.settings.HARD_KEYBOARD_LAYOUT_PICKER_SETTINGS',
  HARD_KEYBOARD_SETTINGS = 'android.settings.HARD_KEYBOARD_SETTINGS',
  HEARING_DEVICES_PAIRING_SETTINGS = 'android.settings.HEARING_DEVICES_PAIRING_SETTINGS',
  HEARING_DEVICES_SETTINGS = 'android.settings.HEARING_DEVICES_SETTINGS',
  HOME_SETTINGS = 'android.settings.HOME_SETTINGS',
  IA_SETTINGS = 'com.android.settings.action.IA_SETTINGS',
  IGNORE_BACKGROUND_DATA_RESTRICTIONS_SETTINGS = 'android.settings.IGNORE_BACKGROUND_DATA_RESTRICTIONS_SETTINGS',
  IGNORE_BATTERY_OPTIMIZATION_SETTINGS = 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
  INPUT_METHOD_SETTINGS = 'android.settings.INPUT_METHOD_SETTINGS',
  INPUT_METHOD_SUBTYPE_SETTINGS = 'android.settings.INPUT_METHOD_SUBTYPE_SETTINGS',
  INTERNAL_STORAGE_SETTINGS = 'android.settings.INTERNAL_STORAGE_SETTINGS',
  LANGUAGE_SETTINGS = 'android.settings.LANGUAGE_SETTINGS',
  LICENSE = 'android.settings.LICENSE',
  LOCALE_SETTINGS = 'android.settings.LOCALE_SETTINGS',
  LOCATION_SCANNING_SETTINGS = 'android.settings.LOCATION_SCANNING_SETTINGS',
  LOCATION_SOURCE_SETTINGS = 'android.settings.LOCATION_SOURCE_SETTINGS',
  LOCK_SCREEN_SETTINGS = 'android.settings.LOCK_SCREEN_SETTINGS',
  MANAGE_ADAPTIVE_NOTIFICATIONS = 'android.settings.MANAGE_ADAPTIVE_NOTIFICATIONS',
  MANAGE_ALL_APPLICATIONS_SETTINGS = 'android.settings.MANAGE_ALL_APPLICATIONS_SETTINGS',
  MANAGE_ALL_FILES_ACCESS_PERMISSION = 'android.settings.MANAGE_ALL_FILES_ACCESS_PERMISSION',
  MANAGE_ALL_SIM_PROFILES_SETTINGS = 'android.settings.MANAGE_ALL_SIM_PROFILES_SETTINGS',
  MANAGE_APP_ALL_FILES_ACCESS_PERMISSION = 'android.settings.MANAGE_APP_ALL_FILES_ACCESS_PERMISSION',
  MANAGE_APP_LONG_RUNNING_JOBS = 'android.settings.MANAGE_APP_LONG_RUNNING_JOBS',
  MANAGE_APP_OVERLAY_PERMISSION = 'android.settings.MANAGE_APP_OVERLAY_PERMISSION',
  MANAGE_APP_USE_FULL_SCREEN_INTENT = 'android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT',
  MANAGE_APPLICATIONS_SETTINGS = 'android.settings.MANAGE_APPLICATIONS_SETTINGS',
  MANAGE_CLONED_APPS_SETTINGS = 'android.settings.MANAGE_CLONED_APPS_SETTINGS',
  MANAGE_CROSS_PROFILE_ACCESS = 'android.settings.MANAGE_CROSS_PROFILE_ACCESS',
  MANAGE_DEFAULT_APPS_SETTINGS = 'android.settings.MANAGE_DEFAULT_APPS_SETTINGS',
  MANAGE_DOMAIN_URLS = 'android.settings.MANAGE_DOMAIN_URLS',
  MANAGE_OVERLAY_PERMISSION = 'android.settings.action.MANAGE_OVERLAY_PERMISSION',
  MANAGE_UNKNOWN_APP_SOURCES = 'android.settings.MANAGE_UNKNOWN_APP_SOURCES',
  MANAGE_USER_ASPECT_RATIO_SETTINGS = 'android.settings.MANAGE_USER_ASPECT_RATIO_SETTINGS',
  MANAGE_WRITE_SETTINGS = 'android.settings.action.MANAGE_WRITE_SETTINGS',
  MANAGED_PROFILE_SETTINGS = 'android.settings.MANAGED_PROFILE_SETTINGS',
  MEDIA_BROADCAST_DIALOG = 'android.settings.MEDIA_BROADCAST_DIALOG',
  MEDIA_CONTROLS_SETTINGS = 'android.settings.ACTION_MEDIA_CONTROLS_SETTINGS',
  MEMORY_CARD_SETTINGS = 'android.settings.MEMORY_CARD_SETTINGS',
  MMS_MESSAGE_SETTING = 'android.settings.MMS_MESSAGE_SETTING',
  MOBILE_DATA_USAGE = 'android.settings.MOBILE_DATA_USAGE',
  MOBILE_NETWORK_LIST = 'android.settings.MOBILE_NETWORK_LIST',
  MODULE_LICENSES = 'android.settings.MODULE_LICENSES',
  MONITORING_CERT_INFO = 'com.android.settings.MONITORING_CERT_INFO',
  MORE_SECURITY_PRIVACY_SETTINGS = 'com.android.settings.MORE_SECURITY_PRIVACY_SETTINGS',
  NAVIGATION_MODE_SETTINGS = 'com.android.settings.NAVIGATION_MODE_SETTINGS',
  NETWORK_OPERATOR_SETTINGS = 'android.settings.NETWORK_OPERATOR_SETTINGS',
  NETWORK_PROVIDER_SETTINGS = 'android.settings.NETWORK_PROVIDER_SETTINGS',
  NFC_SETTINGS = 'android.settings.NFC_SETTINGS',
  NIGHT_DISPLAY_SETTINGS = 'android.settings.NIGHT_DISPLAY_SETTINGS',
  NOTIFICATION_ASSISTANT_SETTINGS = 'android.settings.NOTIFICATION_ASSISTANT_SETTINGS',
  NOTIFICATION_HISTORY = 'android.settings.NOTIFICATION_HISTORY',
  NOTIFICATION_LISTENER_DETAIL_SETTINGS = 'android.settings.NOTIFICATION_LISTENER_DETAIL_SETTINGS',
  NOTIFICATION_LISTENER_SETTINGS = 'android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS',
  NOTIFICATION_POLICY_ACCESS_DETAIL_SETTINGS = 'android.settings.NOTIFICATION_POLICY_ACCESS_DETAIL_SETTINGS',
  NOTIFICATION_POLICY_ACCESS_SETTINGS = 'android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS',
  NOTIFICATION_SETTINGS = 'android.settings.NOTIFICATION_SETTINGS',
  ONE_HANDED_SETTINGS = 'android.settings.action.ONE_HANDED_SETTINGS',
  OPEN_PRIVATE_SPACE_SETTINGS = 'com.android.settings.action.OPEN_PRIVATE_SPACE_SETTINGS',
  OTHER_SOUND_SETTINGS = 'android.settings.ACTION_OTHER_SOUND_SETTINGS',
  PANEL_INTERNET_CONNECTIVITY = 'android.settings.panel.action.INTERNET_CONNECTIVITY',
  PANEL_NFC = 'android.settings.panel.action.NFC',
  PANEL_VOLUME = 'android.settings.panel.action.VOLUME',
  PANEL_WIFI = 'android.settings.panel.action.WIFI',
  PICTURE_IN_PICTURE_SETTINGS = 'android.settings.PICTURE_IN_PICTURE_SETTINGS',
  POWER_MENU_SETTINGS = 'android.settings.ACTION_POWER_MENU_SETTINGS',
  PREMIUM_SMS_SETTINGS = 'android.settings.PREMIUM_SMS_SETTINGS',
  PREVIOUSLY_CONNECTED_DEVICE = 'com.android.settings.PREVIOUSLY_CONNECTED_DEVICE',
  PRINT_SETTINGS = 'android.settings.ACTION_PRINT_SETTINGS',
  PRIVACY_ADVANCED_SETTINGS = 'android.settings.PRIVACY_ADVANCED_SETTINGS',
  PRIVACY_CONTROLS = 'android.settings.PRIVACY_CONTROLS',
  PRIVACY_SETTINGS = 'android.settings.PRIVACY_SETTINGS',
  PROCESS_WIFI_EASY_CONNECT_URI = 'android.settings.PROCESS_WIFI_EASY_CONNECT_URI',
  REDUCE_BRIGHT_COLORS_SETTINGS = 'android.settings.REDUCE_BRIGHT_COLORS_SETTINGS',
  REGIONAL_PREFERENCES_SETTINGS = 'android.settings.REGIONAL_PREFERENCES_SETTINGS',
  REMOTE_AUTHENTICATOR_ENROLL = 'android.settings.REMOTE_AUTHENTICATOR_ENROLL',
  REQUEST_ENABLE_CONTENT_CAPTURE = 'android.settings.REQUEST_ENABLE_CONTENT_CAPTURE',
  REQUEST_IGNORE_BATTERY_OPTIMIZATIONS = 'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
  REQUEST_MANAGE_MEDIA = 'android.settings.REQUEST_MANAGE_MEDIA',
  REQUEST_MEDIA_ROUTING_CONTROL = 'android.settings.REQUEST_MEDIA_ROUTING_CONTROL',
  REQUEST_SCHEDULE_EXACT_ALARM = 'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
  REQUEST_SET_AUTOFILL_SERVICE = 'android.settings.REQUEST_SET_AUTOFILL_SERVICE',
  SATELLITE_SETTING = 'android.settings.SATELLITE_SETTING',
  SCREEN_TIMEOUT_SETTINGS = 'android.settings.SCREEN_TIMEOUT_SETTINGS',
  SEARCH_RESULT_TRAMPOLINE = 'com.android.settings.SEARCH_RESULT_TRAMPOLINE',
  SECURITY_ADVANCED_SETTINGS = 'com.android.settings.security.SECURITY_ADVANCED_SETTINGS',
  SECURITY_SETTINGS = 'android.settings.SECURITY_SETTINGS',
  SETTINGS = 'android.settings.SETTINGS',
  SETTINGS_EMBED_DEEP_LINK_ACTIVITY = 'android.settings.SETTINGS_EMBED_DEEP_LINK_ACTIVITY',
  SETUP_LOCK_SCREEN = 'com.android.settings.SETUP_LOCK_SCREEN',
  SHOW_ADMIN_SUPPORT_DETAILS = 'android.settings.SHOW_ADMIN_SUPPORT_DETAILS',
  SHOW_MANUAL = 'android.settings.SHOW_MANUAL',
  SHOW_REGULATORY_INFO = 'android.settings.SHOW_REGULATORY_INFO',
  SHOW_REMOTE_BUGREPORT_DIALOG = 'android.settings.SHOW_REMOTE_BUGREPORT_DIALOG',
  SHOW_RESTRICTED_SETTING_DIALOG = 'android.settings.SHOW_RESTRICTED_SETTING_DIALOG',
  SIM_PREFERENCE_SETTINGS = 'android.settings.SIM_PREFERENCE_SETTINGS',
  SIM_SUB_INFO_SETTINGS = 'com.android.settings.sim.SIM_SUB_INFO_SETTINGS',
  SOUND_SETTINGS = 'android.settings.SOUND_SETTINGS',
  SPA_SEARCH_LANDING = 'android.settings.SPA_SEARCH_LANDING',
  STORAGE_MANAGER_SETTINGS = 'android.settings.STORAGE_MANAGER_SETTINGS',
  STYLUS_USI_DETAILS_SETTINGS = 'com.android.settings.STYLUS_USI_DETAILS_SETTINGS',
  SUGGESTION_STATE_PROVIDER = 'com.android.settings.action.SUGGESTION_STATE_PROVIDER',
  SUPPORT_SETTINGS = 'com.android.settings.action.SUPPORT_SETTINGS',
  SYNC_SETTINGS = 'android.settings.SYNC_SETTINGS',
  TEMPERATURE_UNIT_SETTINGS = 'android.settings.TEMPERATURE_UNIT_SETTINGS',
  TETHER_PROVISIONING_UI = 'android.settings.TETHER_PROVISIONING_UI',
  TETHER_SETTINGS = 'android.settings.TETHER_SETTINGS',
  TETHER_UNSUPPORTED_CARRIER_UI = 'android.settings.TETHER_UNSUPPORTED_CARRIER_UI',
  TEXT_READING_SETTINGS = 'android.settings.TEXT_READING_SETTINGS',
  TRUSTED_CREDENTIALS = 'com.android.settings.TRUSTED_CREDENTIALS',
  TRUSTED_CREDENTIALS_USER = 'com.android.settings.TRUSTED_CREDENTIALS_USER',
  TTS_SETTINGS = 'com.android.settings.TTS_SETTINGS',
  TURN_SCREEN_ON_SETTINGS = 'android.settings.TURN_SCREEN_ON_SETTINGS',
  USAGE_ACCESS_SETTINGS = 'android.settings.USAGE_ACCESS_SETTINGS',
  USER_DICTIONARY_INSERT = 'android.settings.USER_DICTIONARY_INSERT',
  USER_DICTIONARY_SETTINGS = 'android.settings.USER_DICTIONARY_SETTINGS',
  USER_SETTINGS = 'android.settings.USER_SETTINGS',
  VIEW_ADVANCED_POWER_USAGE_DETAIL = 'android.settings.VIEW_ADVANCED_POWER_USAGE_DETAIL',
  VOICE_CONTROL_AIRPLANE_MODE = 'android.settings.VOICE_CONTROL_AIRPLANE_MODE',
  VOICE_CONTROL_BATTERY_SAVER_MODE = 'android.settings.VOICE_CONTROL_BATTERY_SAVER_MODE',
  VOICE_CONTROL_DO_NOT_DISTURB_MODE = 'android.settings.VOICE_CONTROL_DO_NOT_DISTURB_MODE',
  VOICE_INPUT_SETTINGS = 'android.settings.VOICE_INPUT_SETTINGS',
  VPN_SETTINGS = 'android.settings.VPN_SETTINGS',
  VR_LISTENER_SETTINGS = 'android.settings.VR_LISTENER_SETTINGS',
  WALLPAPER_SETTINGS = 'android.settings.WALLPAPER_SETTINGS',
  WEBVIEW_SETTINGS = 'android.settings.WEBVIEW_SETTINGS',
  WIFI_ADD_NETWORKS = 'android.settings.WIFI_ADD_NETWORKS',
  WIFI_CALLING_SETTINGS = 'android.settings.WIFI_CALLING_SETTINGS',
  WIFI_DETAILS_SETTINGS = 'android.settings.WIFI_DETAILS_SETTINGS',
  WIFI_DIALOG = 'com.android.settings.WIFI_DIALOG',
  WIFI_DPP_CONFIGURATOR_AUTH_QR_CODE_GENERATOR = 'android.settings.WIFI_DPP_CONFIGURATOR_AUTH_QR_CODE_GENERATOR',
  WIFI_DPP_CONFIGURATOR_QR_CODE_GENERATOR = 'android.settings.WIFI_DPP_CONFIGURATOR_QR_CODE_GENERATOR',
  WIFI_DPP_CONFIGURATOR_QR_CODE_SCANNER = 'android.settings.WIFI_DPP_CONFIGURATOR_QR_CODE_SCANNER',
  WIFI_DPP_ENROLLEE_QR_CODE_SCANNER = 'android.settings.WIFI_DPP_ENROLLEE_QR_CODE_SCANNER',
  WIFI_IP_SETTINGS = 'android.settings.WIFI_IP_SETTINGS',
  WIFI_NETWORK_REQUEST = 'com.android.settings.wifi.action.NETWORK_REQUEST',
  WIFI_SAVED_NETWORK_SETTINGS = 'android.settings.WIFI_SAVED_NETWORK_SETTINGS',
  WIFI_SCANNING_SETTINGS = 'android.settings.WIFI_SCANNING_SETTINGS',
  WIFI_SETTINGS = 'android.settings.WIFI_SETTINGS',
  WIFI_TETHER_SETTINGS = 'com.android.settings.WIFI_TETHER_SETTINGS',
  WIRELESS_SETTINGS = 'android.settings.WIRELESS_SETTINGS',
  ZEN_MODE_AUTOMATION_SETTINGS = 'android.settings.ZEN_MODE_AUTOMATION_SETTINGS',
  ZEN_MODE_EVENT_RULE_SETTINGS = 'android.settings.ZEN_MODE_EVENT_RULE_SETTINGS',
  ZEN_MODE_PRIORITY_SETTINGS = 'android.settings.ZEN_MODE_PRIORITY_SETTINGS',
  ZEN_MODE_SCHEDULE_RULE_SETTINGS = 'android.settings.ZEN_MODE_SCHEDULE_RULE_SETTINGS',
  ZEN_MODE_SETTINGS = 'android.settings.ZEN_MODE_SETTINGS',
}

// @needsAudit
export interface IntentLauncherParams {
  /**
   * A string specifying the MIME type of the data represented by the data parameter. Ignore this
   * argument to allow Android to infer the correct MIME type.
   */
  type?: string;
  /**
   * Category provides more details about the action the intent performs. See [`Intent.addCategory`](https://developer.android.com/reference/android/content/Intent#addCategory(java.lang.String)).
   */
  category?: string;
  /**
   * A map specifying additional key-value pairs which are passed with the intent as `extras`.
   * The keys must include a package prefix, for example the app `com.android.contacts` would use
   * names like `com.android.contacts.ShowAll`.
   */
  extra?: Record<string, any>;
  /**
   * A URI specifying the data that the intent should operate upon. (_Note:_ Android requires the URI
   * scheme to be lowercase, unlike the formal RFC.)
   */
  data?: string;
  /**
   * Bitmask of flags to be used. See [`Intent.setFlags`](https://developer.android.com/reference/android/content/Intent#setFlags(int)) for more details.
   */
  flags?: number;
  /**
   * Package name used as an identifier of ComponentName. Set this only if you want to explicitly
   * set the component to handle the intent.
   */
  packageName?: string;
  /**
   * Class name of the ComponentName.
   */
  className?: string;
}

// @needsAudit
export interface IntentLauncherResult {
  /**
   * Result code returned by the activity.
   */
  resultCode: ResultCode;
  /**
   * Optional data URI that can be returned by the activity.
   */
  data?: string;
  /**
   * Optional extras object that can be returned by the activity.
   */
  extra?: object;
}

// @needsAudit
export enum ResultCode {
  /**
   * Indicates that the activity operation succeeded.
   */
  Success = -1,
  /**
   * Means that the activity was canceled, for example, by tapping on the back button.
   */
  Canceled = 0,
  /**
   * First custom, user-defined value that can be returned by the activity.
   */
  FirstUser = 1,
}

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
export async function startActivityAsync(
  activityAction: ActivityAction | string,
  params: IntentLauncherParams = {}
): Promise<IntentLauncherResult> {
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
export function openApplication(packageName: string): void {
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
export async function getApplicationIconAsync(packageName: string): Promise<string> {
  if (!ExpoIntentLauncher.getApplicationIcon) {
    throw new UnavailabilityError('IntentLauncher', 'getApplicationIconAsync');
  }
  return ExpoIntentLauncher.getApplicationIcon(packageName);
}

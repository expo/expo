import { UnavailabilityError } from 'expo-modules-core';

import ExpoIntentLauncher from './ExpoIntentLauncher';

// @needsAudit
/**
 * Constants are from the source code of [Settings provider](https://developer.android.com/reference/android/provider/Settings).
 */
export enum ActivityAction {
  ACCESSIBILITY_SETTINGS = 'android.settings.ACCESSIBILITY_SETTINGS',
  ADD_ACCOUNT_SETTINGS = 'android.settings.ADD_ACCOUNT_SETTINGS',
  AIRPLANE_MODE_SETTINGS = 'android.settings.AIRPLANE_MODE_SETTINGS',
  APN_SETTINGS = 'android.settings.APN_SETTINGS',
  APP_NOTIFICATION_REDACTION = 'android.settings.ACTION_APP_NOTIFICATION_REDACTION',
  APP_NOTIFICATION_SETTINGS = 'android.settings.APP_NOTIFICATION_SETTINGS',
  APP_OPS_SETTINGS = 'android.settings.APP_OPS_SETTINGS',
  APPLICATION_DETAILS_SETTINGS = 'android.settings.APPLICATION_DETAILS_SETTINGS',
  APPLICATION_DEVELOPMENT_SETTINGS = 'android.settings.APPLICATION_DEVELOPMENT_SETTINGS',
  APPLICATION_SETTINGS = 'android.settings.APPLICATION_SETTINGS',
  BATTERY_SAVER_SETTINGS = 'android.settings.BATTERY_SAVER_SETTINGS',
  BLUETOOTH_SETTINGS = 'android.settings.BLUETOOTH_SETTINGS',
  CAPTIONING_SETTINGS = 'android.settings.CAPTIONING_SETTINGS',
  CAST_SETTINGS = 'android.settings.CAST_SETTINGS',
  CONDITION_PROVIDER_SETTINGS = 'android.settings.ACTION_CONDITION_PROVIDER_SETTINGS',
  DATA_ROAMING_SETTINGS = 'android.settings.DATA_ROAMING_SETTINGS',
  DATE_SETTINGS = 'android.settings.DATE_SETTINGS',
  DEVICE_INFO_SETTINGS = 'android.settings.DEVICE_INFO_SETTINGS',
  DEVICE_NAME = 'android.settings.DEVICE_NAME',
  DISPLAY_SETTINGS = 'android.settings.DISPLAY_SETTINGS',
  DREAM_SETTINGS = 'android.settings.DREAM_SETTINGS',
  HARD_KEYBOARD_SETTINGS = 'android.settings.HARD_KEYBOARD_SETTINGS',
  HOME_SETTINGS = 'android.settings.HOME_SETTINGS',
  IGNORE_BACKGROUND_DATA_RESTRICTIONS_SETTINGS = 'android.settings.IGNORE_BACKGROUND_DATA_RESTRICTIONS_SETTINGS',
  IGNORE_BATTERY_OPTIMIZATION_SETTINGS = 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
  INPUT_METHOD_SETTINGS = 'android.settings.INPUT_METHOD_SETTINGS',
  INPUT_METHOD_SUBTYPE_SETTINGS = 'android.settings.INPUT_METHOD_SUBTYPE_SETTINGS',
  INTERNAL_STORAGE_SETTINGS = 'android.settings.INTERNAL_STORAGE_SETTINGS',
  LOCALE_SETTINGS = 'android.settings.LOCALE_SETTINGS',
  LOCATION_SOURCE_SETTINGS = 'android.settings.LOCATION_SOURCE_SETTINGS',
  MANAGE_ALL_APPLICATIONS_SETTINGS = 'android.settings.MANAGE_ALL_APPLICATIONS_SETTINGS',
  MANAGE_APPLICATIONS_SETTINGS = 'android.settings.MANAGE_APPLICATIONS_SETTINGS',
  MANAGE_DEFAULT_APPS_SETTINGS = 'android.settings.MANAGE_DEFAULT_APPS_SETTINGS',
  MEMORY_CARD_SETTINGS = 'android.settings.MEMORY_CARD_SETTINGS',
  MONITORING_CERT_INFO = 'android.settings.MONITORING_CERT_INFO',
  NETWORK_OPERATOR_SETTINGS = 'android.settings.NETWORK_OPERATOR_SETTINGS',
  NFC_PAYMENT_SETTINGS = 'android.settings.NFC_PAYMENT_SETTINGS',
  NFC_SETTINGS = 'android.settings.NFC_SETTINGS',
  NFCSHARING_SETTINGS = 'android.settings.NFCSHARING_SETTINGS',
  NIGHT_DISPLAY_SETTINGS = 'android.settings.NIGHT_DISPLAY_SETTINGS',
  NOTIFICATION_LISTENER_SETTINGS = 'android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS',
  NOTIFICATION_POLICY_ACCESS_SETTINGS = 'android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS',
  NOTIFICATION_SETTINGS = 'android.settings.NOTIFICATION_SETTINGS',
  PAIRING_SETTINGS = 'android.settings.PAIRING_SETTINGS',
  PRINT_SETTINGS = 'android.settings.ACTION_PRINT_SETTINGS',
  PRIVACY_SETTINGS = 'android.settings.PRIVACY_SETTINGS',
  QUICK_LAUNCH_SETTINGS = 'android.settings.QUICK_LAUNCH_SETTINGS',
  REQUEST_IGNORE_BATTERY_OPTIMIZATIONS = 'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
  SECURITY_SETTINGS = 'android.settings.SECURITY_SETTINGS',
  SETTINGS = 'android.settings.SETTINGS',
  SHOW_ADMIN_SUPPORT_DETAILS = 'android.settings.SHOW_ADMIN_SUPPORT_DETAILS',
  SHOW_INPUT_METHOD_PICKER = 'android.settings.SHOW_INPUT_METHOD_PICKER',
  SHOW_REGULATORY_INFO = 'android.settings.SHOW_REGULATORY_INFO',
  SHOW_REMOTE_BUGREPORT_DIALOG = 'android.settings.SHOW_REMOTE_BUGREPORT_DIALOG',
  SOUND_SETTINGS = 'android.settings.SOUND_SETTINGS',
  STORAGE_MANAGER_SETTINGS = 'android.settings.STORAGE_MANAGER_SETTINGS',
  SYNC_SETTINGS = 'android.settings.SYNC_SETTINGS',
  SYSTEM_UPDATE_SETTINGS = 'android.settings.SYSTEM_UPDATE_SETTINGS',
  TETHER_PROVISIONING_UI = 'android.settings.TETHER_PROVISIONING_UI',
  TRUSTED_CREDENTIALS_USER = 'android.settings.TRUSTED_CREDENTIALS_USER',
  USAGE_ACCESS_SETTINGS = 'android.settings.USAGE_ACCESS_SETTINGS',
  USER_DICTIONARY_INSERT = 'android.settings.USER_DICTIONARY_INSERT',
  USER_DICTIONARY_SETTINGS = 'android.settings.USER_DICTIONARY_SETTINGS',
  USER_SETTINGS = 'android.settings.USER_SETTINGS',
  VOICE_CONTROL_AIRPLANE_MODE = 'android.settings.VOICE_CONTROL_AIRPLANE_MODE',
  VOICE_CONTROL_BATTERY_SAVER_MODE = 'android.settings.VOICE_CONTROL_BATTERY_SAVER_MODE',
  VOICE_CONTROL_DO_NOT_DISTURB_MODE = 'android.settings.VOICE_CONTROL_DO_NOT_DISTURB_MODE',
  VOICE_INPUT_SETTINGS = 'android.settings.VOICE_INPUT_SETTINGS',
  VPN_SETTINGS = 'android.settings.VPN_SETTINGS',
  VR_LISTENER_SETTINGS = 'android.settings.VR_LISTENER_SETTINGS',
  WEBVIEW_SETTINGS = 'android.settings.WEBVIEW_SETTINGS',
  WIFI_IP_SETTINGS = 'android.settings.WIFI_IP_SETTINGS',
  WIFI_SETTINGS = 'android.settings.WIFI_SETTINGS',
  WIRELESS_SETTINGS = 'android.settings.WIRELESS_SETTINGS',
  ZEN_MODE_AUTOMATION_SETTINGS = 'android.settings.ZEN_MODE_AUTOMATION_SETTINGS',
  ZEN_MODE_EVENT_RULE_SETTINGS = 'android.settings.ZEN_MODE_EVENT_RULE_SETTINGS',
  ZEN_MODE_EXTERNAL_RULE_SETTINGS = 'android.settings.ZEN_MODE_EXTERNAL_RULE_SETTINGS',
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
   * Category provides more details about the action the intent performs. See [Intent.addCategory](https://developer.android.com/reference/android/content/Intent.html#addCategory(java.lang.String)).
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
   * Bitmask of flags to be used. See [Intent.setFlags](<https://developer.android.com/reference/android/content/Intent.html#setFlags(int)>) for more details.
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
   * Means that the activity was canceled, e.g. by tapping on the back button.
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
 * @param activityAction The action to be performed, e.g. `IntentLauncher.ActivityAction.WIRELESS_SETTINGS`.
 * There are a few pre-defined constants you can use for this parameter.
 * You can find them at [expo-intent-launcher/src/IntentLauncher.ts](https://github.com/expo/expo/blob/main/packages/expo-intent-launcher/src/IntentLauncher.ts).
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

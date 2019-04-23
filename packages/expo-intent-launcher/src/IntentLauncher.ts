import { UnavailabilityError } from '@unimodules/core';
import ExpoIntentLauncher from './ExpoIntentLauncher';

/**
 * Constants are from the source code of Settings:
 * https://developer.android.com/reference/android/provider/Settings.html
 */

export const ACTION_ACCESSIBILITY_SETTINGS = 'android.settings.ACCESSIBILITY_SETTINGS';
export const ACTION_APP_NOTIFICATION_REDACTION =
  'android.settings.ACTION_APP_NOTIFICATION_REDACTION';
export const ACTION_CONDITION_PROVIDER_SETTINGS =
  'android.settings.ACTION_CONDITION_PROVIDER_SETTINGS';
export const ACTION_NOTIFICATION_LISTENER_SETTINGS =
  'android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS';
export const ACTION_PRINT_SETTINGS = 'android.settings.ACTION_PRINT_SETTINGS';
export const ACTION_ADD_ACCOUNT_SETTINGS = 'android.settings.ADD_ACCOUNT_SETTINGS';
export const ACTION_AIRPLANE_MODE_SETTINGS = 'android.settings.AIRPLANE_MODE_SETTINGS';
export const ACTION_APN_SETTINGS = 'android.settings.APN_SETTINGS';
export const ACTION_APPLICATION_DETAILS_SETTINGS = 'android.settings.APPLICATION_DETAILS_SETTINGS';
export const ACTION_APPLICATION_DEVELOPMENT_SETTINGS =
  'android.settings.APPLICATION_DEVELOPMENT_SETTINGS';
export const ACTION_APPLICATION_SETTINGS = 'android.settings.APPLICATION_SETTINGS';
export const ACTION_APP_NOTIFICATION_SETTINGS = 'android.settings.APP_NOTIFICATION_SETTINGS';
export const ACTION_APP_OPS_SETTINGS = 'android.settings.APP_OPS_SETTINGS';
export const ACTION_BATTERY_SAVER_SETTINGS = 'android.settings.BATTERY_SAVER_SETTINGS';
export const ACTION_BLUETOOTH_SETTINGS = 'android.settings.BLUETOOTH_SETTINGS';
export const ACTION_CAPTIONING_SETTINGS = 'android.settings.CAPTIONING_SETTINGS';
export const ACTION_CAST_SETTINGS = 'android.settings.CAST_SETTINGS';
export const ACTION_DATA_ROAMING_SETTINGS = 'android.settings.DATA_ROAMING_SETTINGS';
export const ACTION_DATE_SETTINGS = 'android.settings.DATE_SETTINGS';
export const ACTION_DEVICE_INFO_SETTINGS = 'android.settings.DEVICE_INFO_SETTINGS';
export const ACTION_DEVICE_NAME = 'android.settings.DEVICE_NAME';
export const ACTION_DISPLAY_SETTINGS = 'android.settings.DISPLAY_SETTINGS';
export const ACTION_DREAM_SETTINGS = 'android.settings.DREAM_SETTINGS';
export const ACTION_HARD_KEYBOARD_SETTINGS = 'android.settings.HARD_KEYBOARD_SETTINGS';
export const ACTION_HOME_SETTINGS = 'android.settings.HOME_SETTINGS';
export const ACTION_IGNORE_BACKGROUND_DATA_RESTRICTIONS_SETTINGS =
  'android.settings.IGNORE_BACKGROUND_DATA_RESTRICTIONS_SETTINGS';
export const ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS =
  'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS';
export const ACTION_INPUT_METHOD_SETTINGS = 'android.settings.INPUT_METHOD_SETTINGS';
export const ACTION_INPUT_METHOD_SUBTYPE_SETTINGS =
  'android.settings.INPUT_METHOD_SUBTYPE_SETTINGS';
export const ACTION_INTERNAL_STORAGE_SETTINGS = 'android.settings.INTERNAL_STORAGE_SETTINGS';
export const ACTION_LOCALE_SETTINGS = 'android.settings.LOCALE_SETTINGS';
export const ACTION_LOCATION_SOURCE_SETTINGS = 'android.settings.LOCATION_SOURCE_SETTINGS';
export const ACTION_MANAGE_ALL_APPLICATIONS_SETTINGS =
  'android.settings.MANAGE_ALL_APPLICATIONS_SETTINGS';
export const ACTION_MANAGE_APPLICATIONS_SETTINGS = 'android.settings.MANAGE_APPLICATIONS_SETTINGS';
export const ACTION_MANAGE_DEFAULT_APPS_SETTINGS = 'android.settings.MANAGE_DEFAULT_APPS_SETTINGS';
export const ACTION_MEMORY_CARD_SETTINGS = 'android.settings.MEMORY_CARD_SETTINGS';
export const ACTION_MONITORING_CERT_INFO = 'android.settings.MONITORING_CERT_INFO';
export const ACTION_NETWORK_OPERATOR_SETTINGS = 'android.settings.NETWORK_OPERATOR_SETTINGS';
export const ACTION_NFCSHARING_SETTINGS = 'android.settings.NFCSHARING_SETTINGS';
export const ACTION_NFC_PAYMENT_SETTINGS = 'android.settings.NFC_PAYMENT_SETTINGS';
export const ACTION_NFC_SETTINGS = 'android.settings.NFC_SETTINGS';
export const ACTION_NIGHT_DISPLAY_SETTINGS = 'android.settings.NIGHT_DISPLAY_SETTINGS';
export const ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS =
  'android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS';
export const ACTION_NOTIFICATION_SETTINGS = 'android.settings.NOTIFICATION_SETTINGS';
export const ACTION_PAIRING_SETTINGS = 'android.settings.PAIRING_SETTINGS';
export const ACTION_PRIVACY_SETTINGS = 'android.settings.PRIVACY_SETTINGS';
export const ACTION_QUICK_LAUNCH_SETTINGS = 'android.settings.QUICK_LAUNCH_SETTINGS';
export const ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS =
  'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS';
export const ACTION_SECURITY_SETTINGS = 'android.settings.SECURITY_SETTINGS';
export const ACTION_SETTINGS = 'android.settings.SETTINGS';
export const ACTION_SHOW_ADMIN_SUPPORT_DETAILS = 'android.settings.SHOW_ADMIN_SUPPORT_DETAILS';
export const ACTION_SHOW_INPUT_METHOD_PICKER = 'android.settings.SHOW_INPUT_METHOD_PICKER';
export const ACTION_SHOW_REGULATORY_INFO = 'android.settings.SHOW_REGULATORY_INFO';
export const ACTION_SHOW_REMOTE_BUGREPORT_DIALOG = 'android.settings.SHOW_REMOTE_BUGREPORT_DIALOG';
export const ACTION_SOUND_SETTINGS = 'android.settings.SOUND_SETTINGS';
export const ACTION_STORAGE_MANAGER_SETTINGS = 'android.settings.STORAGE_MANAGER_SETTINGS';
export const ACTION_SYNC_SETTINGS = 'android.settings.SYNC_SETTINGS';
export const ACTION_SYSTEM_UPDATE_SETTINGS = 'android.settings.SYSTEM_UPDATE_SETTINGS';
export const ACTION_TETHER_PROVISIONING_UI = 'android.settings.TETHER_PROVISIONING_UI';
export const ACTION_TRUSTED_CREDENTIALS_USER = 'android.settings.TRUSTED_CREDENTIALS_USER';
export const ACTION_USAGE_ACCESS_SETTINGS = 'android.settings.USAGE_ACCESS_SETTINGS';
export const ACTION_USER_DICTIONARY_INSERT = 'android.settings.USER_DICTIONARY_INSERT';
export const ACTION_USER_DICTIONARY_SETTINGS = 'android.settings.USER_DICTIONARY_SETTINGS';
export const ACTION_USER_SETTINGS = 'android.settings.USER_SETTINGS';
export const ACTION_VOICE_CONTROL_AIRPLANE_MODE = 'android.settings.VOICE_CONTROL_AIRPLANE_MODE';
export const ACTION_VOICE_CONTROL_BATTERY_SAVER_MODE =
  'android.settings.VOICE_CONTROL_BATTERY_SAVER_MODE';
export const ACTION_VOICE_CONTROL_DO_NOT_DISTURB_MODE =
  'android.settings.VOICE_CONTROL_DO_NOT_DISTURB_MODE';
export const ACTION_VOICE_INPUT_SETTINGS = 'android.settings.VOICE_INPUT_SETTINGS';
export const ACTION_VPN_SETTINGS = 'android.settings.VPN_SETTINGS';
export const ACTION_VR_LISTENER_SETTINGS = 'android.settings.VR_LISTENER_SETTINGS';
export const ACTION_WEBVIEW_SETTINGS = 'android.settings.WEBVIEW_SETTINGS';
export const ACTION_WIFI_IP_SETTINGS = 'android.settings.WIFI_IP_SETTINGS';
export const ACTION_WIFI_SETTINGS = 'android.settings.WIFI_SETTINGS';
export const ACTION_WIRELESS_SETTINGS = 'android.settings.WIRELESS_SETTINGS';
export const ACTION_ZEN_MODE_AUTOMATION_SETTINGS = 'android.settings.ZEN_MODE_AUTOMATION_SETTINGS';
export const ACTION_ZEN_MODE_EVENT_RULE_SETTINGS = 'android.settings.ZEN_MODE_EVENT_RULE_SETTINGS';
export const ACTION_ZEN_MODE_EXTERNAL_RULE_SETTINGS =
  'android.settings.ZEN_MODE_EXTERNAL_RULE_SETTINGS';
export const ACTION_ZEN_MODE_PRIORITY_SETTINGS = 'android.settings.ZEN_MODE_PRIORITY_SETTINGS';
export const ACTION_ZEN_MODE_SCHEDULE_RULE_SETTINGS =
  'android.settings.ZEN_MODE_SCHEDULE_RULE_SETTINGS';
export const ACTION_ZEN_MODE_SETTINGS = 'android.settings.ZEN_MODE_SETTINGS';

interface IntentParams {
  type?: string;
  category?: string;
  extra?: object;
  data?: string;
  flags?: number;
  packageName?: string;
  className?: string;
}

interface IntentResult {
  resultCode: number;
  data?: string;
  extra?: object;
}

export enum ResultCode {
  Success = -1,
  Canceled = 0,
  FirstUser = 1,
}

export async function startActivityAsync(activityAction: string, params: IntentParams = {}): Promise<IntentResult> {
  if (!ExpoIntentLauncher.startActivity) {
    throw new UnavailabilityError('IntentLauncher', 'startActivityAsync');
  }
  if (typeof activityAction !== 'string' || !activityAction) {
    throw new TypeError(`'activityAction' argument must be a non-empty string!`);
  }
  return ExpoIntentLauncher.startActivity(activityAction, params);
}

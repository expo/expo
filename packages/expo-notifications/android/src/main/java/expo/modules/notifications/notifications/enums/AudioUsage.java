package expo.modules.notifications.notifications.enums;

import android.media.AudioAttributes;

public enum AudioUsage {
  UNKNOWN(AudioAttributes.USAGE_UNKNOWN, 0),
  MEDIA(AudioAttributes.USAGE_MEDIA, 1),
  VOICE_COMMUNICATION(AudioAttributes.USAGE_VOICE_COMMUNICATION, 2),
  VOICE_COMMUNICATION_SIGNALLING(AudioAttributes.USAGE_VOICE_COMMUNICATION_SIGNALLING, 3),
  ALARM(AudioAttributes.USAGE_ALARM, 4),
  NOTIFICATION(AudioAttributes.USAGE_NOTIFICATION, 5),
  NOTIFICATION_RINGTONE(AudioAttributes.USAGE_NOTIFICATION_RINGTONE, 6),
  NOTIFICATION_COMMUNICATION_REQUEST(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_REQUEST, 7),
  NOTIFICATION_COMMUNICATION_INSTANT(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT, 8),
  NOTIFICATION_COMMUNICATION_DELAYED(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_DELAYED, 9),
  NOTIFICATION_EVENT(AudioAttributes.USAGE_NOTIFICATION_EVENT, 10),
  ASSISTANCE_ACCESSIBILITY(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY, 11),
  ASSISTANCE_NAVIGATION_GUIDANCE(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE, 12),
  ASSISTANCE_SONIFICATION(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION, 13),
  GAME(AudioAttributes.USAGE_GAME, 14);

  private final int mNativeVisibility;
  private final int mEnumValue;

  AudioUsage(int nativeVisibility, int enumValue) {
    mNativeVisibility = nativeVisibility;
    mEnumValue = enumValue;
  }

  public int getNativeValue() {
    return mNativeVisibility;
  }

  public int getEnumValue() {
    return mEnumValue;
  }

  public static AudioUsage fromEnumValue(int value) {
    for (AudioUsage usage : AudioUsage.values()) {
      if (usage.getEnumValue() == value) {
        return usage;
      }
    }
    return AudioUsage.UNKNOWN;
  }

  public static AudioUsage fromNativeValue(int value) {
    for (AudioUsage usage : AudioUsage.values()) {
      if (usage.getEnumValue() == value) {
        return usage;
      }
    }
    return AudioUsage.UNKNOWN;
  }
}

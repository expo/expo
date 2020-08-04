package expo.modules.notifications.notifications.enums;

import android.media.AudioAttributes;

public enum AudioContentType {
  UNKNOWN(AudioAttributes.CONTENT_TYPE_UNKNOWN, 0),
  SPEECH(AudioAttributes.CONTENT_TYPE_SPEECH, 1),
  MUSIC(AudioAttributes.CONTENT_TYPE_MUSIC, 2),
  MOVIE(AudioAttributes.CONTENT_TYPE_MOVIE, 3),
  SONIFICIATION(AudioAttributes.CONTENT_TYPE_SONIFICATION, 4);

  private final int mNativeVisibility;
  private final int mEnumValue;

  AudioContentType(int nativeVisibility, int enumValue) {
    mNativeVisibility = nativeVisibility;
    mEnumValue = enumValue;
  }

  public int getNativeValue() {
    return mNativeVisibility;
  }

  public int getEnumValue() {
    return mEnumValue;
  }

  public static AudioContentType fromEnumValue(int value) {
    for (AudioContentType visibility : AudioContentType.values()) {
      if (visibility.getEnumValue() == value) {
        return visibility;
      }
    }
    return AudioContentType.UNKNOWN;
  }

  public static AudioContentType fromNativeValue(int value) {
    for (AudioContentType visibility : AudioContentType.values()) {
      if (visibility.getEnumValue() == value) {
        return visibility;
      }
    }
    return AudioContentType.UNKNOWN;
  }
}

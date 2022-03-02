package expo.modules.av.video.scalablevideoview;

/**
 * The following class is copied from https://github.com/yqritc/Android-ScalableVideoView/blob/master/library/src/main/java/com/yqritc/scalablevideoview/ScalableType.java
 * as the original library (com.yqritc:android-scalablevideoview) is only available on jcenter() repository and we're moved from fetching libraries from there.
 */
public enum ScalableType {
  NONE,

  FIT_XY,
  FIT_START,
  FIT_CENTER,
  FIT_END,

  LEFT_TOP,
  LEFT_CENTER,
  LEFT_BOTTOM,
  CENTER_TOP,
  CENTER,
  CENTER_BOTTOM,
  RIGHT_TOP,
  RIGHT_CENTER,
  RIGHT_BOTTOM,

  LEFT_TOP_CROP,
  LEFT_CENTER_CROP,
  LEFT_BOTTOM_CROP,
  CENTER_TOP_CROP,
  CENTER_CROP,
  CENTER_BOTTOM_CROP,
  RIGHT_TOP_CROP,
  RIGHT_CENTER_CROP,
  RIGHT_BOTTOM_CROP,

  START_INSIDE,
  CENTER_INSIDE,
  END_INSIDE
}

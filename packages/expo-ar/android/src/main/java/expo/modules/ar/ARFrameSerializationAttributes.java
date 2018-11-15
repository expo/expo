package expo.modules.ar;

import java.util.HashMap;
import java.util.Map;

class ARFrameSerializationAttributes extends HashMap<String, Object> {
  private static final String RAW_FEATURES_POINT_KEY = "rawFeaturePoints";
  private static final String ANCHORS_KEY = "anchors";
  private static final String LIGHT_ESTIMATION_KEY = "lightEstimation";

  private final boolean mRawFeaturePoints;
  private final boolean mLightEstimation;
  private final boolean mAnchors;

  private ARFrameSerializationAttributes(
      boolean rawFeaturePoints,
      boolean anchors,
      boolean lightEstimation
  ) {
    mRawFeaturePoints = rawFeaturePoints;
    mAnchors = anchors;
    mLightEstimation = lightEstimation;
  }

  static ARFrameSerializationAttributes fromMap(Map<String, Object> attributes) {
    return new ARFrameSerializationAttributes(
        getParameterFromAttributes(attributes, RAW_FEATURES_POINT_KEY),
        getParameterFromAttributes(attributes, ANCHORS_KEY),
        getParameterFromAttributes(attributes, LIGHT_ESTIMATION_KEY)
    );
  }

  private static boolean getParameterFromAttributes(Map<String, Object> attributes, String parameter) {
    return attributes.containsKey(parameter)
        && attributes.get(parameter) instanceof Boolean
        && (Boolean) attributes.get(parameter);
  }

  boolean serializeAnchors() {
    return mAnchors;
  }

  boolean serializeRawFeaturePoints() {
    return mRawFeaturePoints;
  }

  boolean serializeLightEstimation() {
    return mLightEstimation;
  }
}

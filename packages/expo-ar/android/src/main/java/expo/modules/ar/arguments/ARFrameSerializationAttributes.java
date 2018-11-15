package expo.modules.ar.arguments;

import java.util.HashMap;
import java.util.Map;

public class ARFrameSerializationAttributes extends HashMap<String, Object> {
  private final boolean mRawFeaturePoints;
  private final boolean mLightEstimation;
  private final boolean mAnchors;
  private final boolean mPlanes;

  public static ARFrameSerializationAttributes fromMap(Map<String, Object> attributes) {
    boolean rawFeaturesPoints = getParameterFromAttributes(attributes, ARFrameAttribute.RAW_FEATURES_POINT);
    boolean anchors = getParameterFromAttributes(attributes, ARFrameAttribute.ANCHORS);
    boolean lightEstimation = getParameterFromAttributes(attributes, ARFrameAttribute.LIGHT_ESTIMATION);
    boolean planes = getParameterFromAttributes(attributes, ARFrameAttribute.PLANES);

    if (!rawFeaturesPoints && !anchors && !lightEstimation && !planes) {
      return null;
    }

    return new ARFrameSerializationAttributes(rawFeaturesPoints, anchors, lightEstimation, planes);
  }

  private ARFrameSerializationAttributes(
      boolean rawFeaturePoints,
      boolean anchors,
      boolean lightEstimation,
      boolean planes
  ) {
    mRawFeaturePoints = rawFeaturePoints;
    mAnchors = anchors;
    mLightEstimation = lightEstimation;
    mPlanes = planes;
  }

  private static boolean getParameterFromAttributes(Map<String, Object> attributes, ARFrameAttribute frameAttribute) {
    String parameter = frameAttribute.toString();
    return attributes.containsKey(parameter)
        && attributes.get(parameter) instanceof Boolean
        && (Boolean) attributes.get(parameter);
  }

  public boolean shouldSerializeAnchors() {
    return mAnchors;
  }

  public boolean shouldSerializeRawFeaturePoints() {
    return mRawFeaturePoints;
  }

  public boolean shouldSerializeLightEstimation() {
    return mLightEstimation;
  }

  public boolean shouldSerializePlanes() {
    return mPlanes;
  }
}

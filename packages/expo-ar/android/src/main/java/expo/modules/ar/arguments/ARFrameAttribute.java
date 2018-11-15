package expo.modules.ar.arguments;

public enum ARFrameAttribute {
  RAW_FEATURES_POINT ("rawFeaturePoints"),
  ANCHORS ("anchors"),
  LIGHT_ESTIMATION ("lightEstimation"),
  PLANES ("planes");

  private final String mFrameAttribute;

  ARFrameAttribute(String frameAttribute) {
    mFrameAttribute = frameAttribute;
  }

  public String toString() {
    return mFrameAttribute;
  }
}

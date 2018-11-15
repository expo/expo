package expo.modules.ar.arguments;

import com.google.ar.core.Config.PlaneFindingMode;

public enum ARPlaneDetection {
  AR_PLANE_DETECTION_NONE ("none", PlaneFindingMode.DISABLED),
  AR_PLANE_DETECTION_HORIZONTAL ("horizontal", PlaneFindingMode.HORIZONTAL),
  AR_PLANE_DETECTION_VERTICAL ("vertical", PlaneFindingMode.VERTICAL),
  AR_PLANE_DETECTION_HORIZONTAL_AND_VERTICAL ("horizontal_and_vertical", PlaneFindingMode.HORIZONTAL_AND_VERTICAL);

  private final PlaneFindingMode mPlaneFindingMode;
  private final String mPlaneDetection;

  public static ARPlaneDetection fromString(String planeDetection) {
    for (ARPlaneDetection pd: ARPlaneDetection.values()) {
      if (pd.mPlaneDetection.equals(planeDetection)) {
        return pd;
      }
    }
    return null;
  }

  ARPlaneDetection(String planeDetection, PlaneFindingMode planeFindingMode) {
    mPlaneDetection = planeDetection;
    mPlaneFindingMode = planeFindingMode;
  }

  public PlaneFindingMode getPlaneFindingMode() {
    return mPlaneFindingMode;
  }
}

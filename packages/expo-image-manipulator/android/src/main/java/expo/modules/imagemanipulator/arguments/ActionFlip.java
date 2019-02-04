package expo.modules.imagemanipulator.arguments;

import android.graphics.Matrix;

public enum ActionFlip {
  VERTICAL("vertical", 1, -1),
  HORIZONTAL("horizontal", -1, 1);

  private final String mType;
  private final float mSx;
  private final float mSy;

  ActionFlip(String type, float sx, float sy) {
    mType = type;
    mSx = sx;
    mSy = sy;
  }

  static public ActionFlip fromObject(Object o) throws IllegalArgumentException {
    String errorMessage = "Action 'flip' must be one of ['vertical', 'horizontal']. Obtained '" + o.toString() + "'";

    if (!(o instanceof String)) {
      throw new IllegalArgumentException(errorMessage);
    }
    for (ActionFlip af : values()) {
      if (af.mType.equals(o)) {
        return af;
      }
    }
    throw new IllegalArgumentException(errorMessage);
  }

  public Matrix getRotationMatrix() {
    Matrix rotationMatrix = new Matrix();
    rotationMatrix.postScale(mSx, mSy);
    return rotationMatrix;
  }
}

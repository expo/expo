package expo.interfaces.barcodescanner;

import android.graphics.Point;

import java.util.List;

public class BarCodeScannerResult {
  private int mWidth;
  private int mHeight;
  private int mType;
  private String mValue;
  private List<Integer> mCornerPoints;


  public BarCodeScannerResult(int type, String value, List<Integer> cornerPoints, int height, int width) {
    mType = type;
    mValue = value;
    mCornerPoints = cornerPoints;
    mHeight = height;
    mWidth = width;
  }

  public int getType() {
    return mType;
  }
  public String getValue() {
    return mValue;
  }

  public List<Integer> getCornerPoints() {
    return mCornerPoints;
  }
  public void setCornerPoints(List<Integer> points) {
    mCornerPoints = points;
  }

  public int getHeight() {
    return mHeight;
  }

  public void setHeight(int height) {
    mHeight = height;
  }

  public int getWidth() {
    return mWidth;
  }

  public void setWidth(int width) {
    mWidth = width;
  }
}

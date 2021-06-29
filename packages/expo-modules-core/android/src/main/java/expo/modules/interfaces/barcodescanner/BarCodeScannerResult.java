package expo.modules.interfaces.barcodescanner;

import java.util.List;

public class BarCodeScannerResult {
  private int mReferenceImageWidth;
  private int mReferenceImageHeight;
  private int mType;
  private String mValue;
  private List<Integer> mCornerPoints;


  public BarCodeScannerResult(int type, String value, List<Integer> cornerPoints, int height, int width) {
    mType = type;
    mValue = value;
    mCornerPoints = cornerPoints;
    mReferenceImageHeight = height;
    mReferenceImageWidth = width;
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

  public int getReferenceImageHeight() {
    return mReferenceImageHeight;
  }

  public void setReferenceImageHeight(int height) {
    mReferenceImageHeight = height;
  }

  public int getReferenceImageWidth() {
    return mReferenceImageWidth;
  }

  public void setReferenceImageWidth(int width) {
    mReferenceImageWidth = width;
  }
}

package expo.modules.interfaces.barcodescanner;

import java.util.List;

public class BarCodeScannerResult {
  public static class BoundingBox {
    private final int x;
    private final int y;
    private final int width;
    private final int height;

    public BoundingBox(int x, int y, int width, int height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }

    public int getX() {
      return x;
    }

    public int getY() {
      return y;
    }

    public int getWidth() {
      return width;
    }

    public int getHeight() {
      return height;
    }
  }

  private int mReferenceImageWidth;
  private int mReferenceImageHeight;
  private int mType;
  private String mValue;
  private String mRaw;
  private List<Integer> mCornerPoints;


  public BarCodeScannerResult(int type, String value, String raw, List<Integer> cornerPoints, int height, int width) {
    mType = type;
    mValue = value;
    mRaw = raw;
    mCornerPoints = cornerPoints;
    mReferenceImageHeight = height;
    mReferenceImageWidth = width;
  }

  public int getType() {
    return mType;
  }

  public String getValue() { return mValue; }

  public String getRaw() { return mRaw; }

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

  public BoundingBox getBoundingBox() {
    if (mCornerPoints.isEmpty()) {
      return new BoundingBox(0, 0, 0, 0);
    }
    int minX = Integer.MAX_VALUE;
    int minY = Integer.MAX_VALUE;
    int maxX = Integer.MIN_VALUE;
    int maxY = Integer.MIN_VALUE;

    for (int i = 0; i < mCornerPoints.size(); i += 2) {
      int x = mCornerPoints.get(i);
      int y = mCornerPoints.get(i + 1);

      minX = Integer.min(minX, x);
      minY = Integer.min(minY, y);
      maxX = Integer.max(maxX, x);
      maxY = Integer.max(maxY, y);
    }

    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
  }
}

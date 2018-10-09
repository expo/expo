package expo.modules.camera.utils;

public class ImageDimensions {
  private int mWidth;
  private int mHeight;
  private int mFacing;
  private int mRotation;

  public ImageDimensions(int width, int height) {
    this(width, height, 0);
  }

  public ImageDimensions(int width, int height, int rotation) {
    this(width, height, rotation, -1);
  }

  public ImageDimensions(int width, int height, int rotation, int facing) {
    mWidth = width;
    mHeight = height;
    mFacing = facing;
    mRotation = rotation;
  }

  public boolean isLandscape() {
    return mRotation % 180 == 90;
  }

  public int getWidth() {
    if (isLandscape()) {
      return mHeight;
    }

    return mWidth;
  }

  public int getHeight() {
    if (isLandscape()) {
      return mWidth;
    }

    return mHeight;
  }

  public int getRotation() {
    return mRotation;
  }

  public int getFacing() {
    return mFacing;
  }

  @Override
  public boolean equals(Object obj) {
    if (obj instanceof ImageDimensions) {
      ImageDimensions otherDimensions = (ImageDimensions) obj;
      return (otherDimensions.getWidth() == getWidth() &&
              otherDimensions.getHeight() == getHeight() &&
              otherDimensions.getFacing() == getFacing() &&
              otherDimensions.getRotation() == getRotation());
    } else {
      return super.equals(obj);
    }
  }
}

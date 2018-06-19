package expo.modules.camera.utils;

import android.content.Context;

import java.util.List;

public abstract class ExpoBarCodeDetector {

  protected List<Integer> mBarCodeTypes;
  protected  Context mContext;

  ExpoBarCodeDetector(List<Integer> barCodeTypes, Context context) {
    mBarCodeTypes = barCodeTypes;
    mContext = context;
  }

  public abstract Result detect(byte[] data, int width, int height, int rotation);
  public abstract boolean isAvailable();

  public class Result {

    private int mType;
    private String mValue;

    public Result(int type, String value) {
      mType = type;
      mValue = value;
    }

    public int getType() {
      return mType;
    }
    public String getValue() {
      return mValue;
    }
  }
}

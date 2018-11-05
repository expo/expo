package expo.modules.barcodescanner.utils;

import android.graphics.Bitmap;
import android.graphics.ImageFormat;

import java.nio.ByteBuffer;

public class FrameFactory {
  public static Frame buildFrame(byte[] bitmapData, int width, int height, int rotation) {
    com.google.android.gms.vision.Frame.Builder builder = new com.google.android.gms.vision.Frame.Builder();

    ByteBuffer byteBuffer = ByteBuffer.wrap(bitmapData);
    builder.setImageData(byteBuffer, width, height, ImageFormat.NV21);

    switch (rotation) {
      case 90:
        builder.setRotation(com.google.android.gms.vision.Frame.ROTATION_90);
        break;
      case 180:
        builder.setRotation(com.google.android.gms.vision.Frame.ROTATION_180);
        break;
      case 270:
        builder.setRotation(com.google.android.gms.vision.Frame.ROTATION_270);
        break;
      default:
        builder.setRotation(com.google.android.gms.vision.Frame.ROTATION_0);
    }

    ImageDimensions dimensions = new ImageDimensions(width, height, rotation);

    return new Frame(builder.build(), dimensions);
  }

  public static Frame buildFrame(Bitmap bitmap) {
    com.google.android.gms.vision.Frame.Builder builder = new com.google.android.gms.vision.Frame.Builder();
    builder.setBitmap(bitmap);
    ImageDimensions dimensions = new ImageDimensions(bitmap.getWidth(), bitmap.getHeight());
    return new Frame(builder.build(), dimensions);
  }
}

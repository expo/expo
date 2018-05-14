package expo.modules.camera.utils;

import android.graphics.Bitmap;
import android.graphics.ImageFormat;

import com.google.android.gms.vision.Frame;

import java.nio.ByteBuffer;

public class ExpoFrameFactory {
    public static ExpoFrame buildFrame(byte[] bitmapData, int width, int height, int rotation) {
        Frame.Builder builder = new Frame.Builder();

        ByteBuffer byteBuffer = ByteBuffer.wrap(bitmapData);
        builder.setImageData(byteBuffer, width, height, ImageFormat.NV21);

        switch (rotation) {
            case 90:
                builder.setRotation(Frame.ROTATION_90);
                break;
            case 180:
                builder.setRotation(Frame.ROTATION_180);
                break;
            case 270:
                builder.setRotation(Frame.ROTATION_270);
                break;
            default:
                builder.setRotation(Frame.ROTATION_0);
        }

        ImageDimensions dimensions = new ImageDimensions(width, height, rotation);

        return new ExpoFrame(builder.build(), dimensions);
    }

    public static ExpoFrame buildFrame(Bitmap bitmap) {
        Frame.Builder builder = new Frame.Builder();
        builder.setBitmap(bitmap);
        ImageDimensions dimensions = new ImageDimensions(bitmap.getWidth(), bitmap.getHeight());
        return new ExpoFrame(builder.build(), dimensions);
    }
}

package expo.modules.camera.utils;

import com.google.android.gms.vision.Frame;

public class ExpoFrame {
    private Frame mFrame;
    private ImageDimensions mDimensions;

    public ExpoFrame(Frame frame, ImageDimensions dimensions) {
        mFrame = frame;
        mDimensions = dimensions;
    }

    public Frame getFrame() {
        return mFrame;
    }

    public ImageDimensions getDimensions() {
        return mDimensions;
    }
}

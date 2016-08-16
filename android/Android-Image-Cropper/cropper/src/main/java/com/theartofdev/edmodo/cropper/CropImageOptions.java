// "Therefore those skilled at the unorthodox
// are infinite as heaven and earth;
// inexhaustible as the great rivers.
// When they come to an end;
// they begin again;
// like the days and months;
// they die and are reborn;
// like the four seasons."
//
// - Sun Tsu;
// "The Art of War"

package com.theartofdev.edmodo.cropper;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Parcel;
import android.os.Parcelable;
import android.util.DisplayMetrics;
import android.util.TypedValue;

/**
 * All the possible options that can be set to customize crop image.<br>
 * Initialized with default values.
 */
final class CropImageOptions implements Parcelable {

    public static final Creator<CropImageOptions> CREATOR = new Creator<CropImageOptions>() {
        @Override
        public CropImageOptions createFromParcel(Parcel in) {
            return new CropImageOptions(in);
        }

        @Override
        public CropImageOptions[] newArray(int size) {
            return new CropImageOptions[size];
        }
    };

    /**
     * The shape of the cropping window.
     */
    public CropImageView.CropShape cropShape;

    /**
     * An edge of the crop window will snap to the corresponding edge of a specified bounding box when the crop
     * window edge is less than or equal to this distance (in pixels) away from the bounding box edge. (in pixels)
     */
    public float snapRadius;

    /**
     * The radius of the touchable area around the handle. (in pixels)<br>
     * We are basing this value off of the recommended 48dp Rhythm.<br>
     * See: http://developer.android.com/design/style/metrics-grids.html#48dp-rhythm
     */
    public float touchRadius;

    /**
     * whether the guidelines should be on, off, or only showing when resizing.
     */
    public CropImageView.Guidelines guidelines;

    /**
     * The initial scale type of the image in the crop image view
     */
    public CropImageView.ScaleType scaleType;

    /**
     * if to show crop overlay UI what contains the crop window UI surrounded by background over the cropping
     * image.<br>
     * default: true, may disable for animation or frame transition.
     */
    public boolean showCropOverlay;

    /**
     * if to show progress bar when image async loading/cropping is in progress.<br>
     * default: true, disable to provide custom progress bar UI.
     */
    public boolean showProgressBar;

    /**
     * if auto-zoom functionality is enabled.<br>
     * default: true.
     */
    public boolean autoZoomEnabled;

    /**
     * The max zoom allowed during cropping.
     */
    public int maxZoom;

    /**
     * The initial crop window padding from image borders in percentage of the cropping image dimensions.
     */
    public float initialCropWindowPaddingRatio;

    /**
     * whether the width to height aspect ratio should be maintained or free to change.
     */
    public boolean fixAspectRatio;

    /**
     * the X value of the aspect ratio.
     */
    public int aspectRatioX;

    /**
     * the Y value of the aspect ratio.
     */
    public int aspectRatioY;

    /**
     * the thickness of the guidelines lines in pixels. (in pixels)
     */
    public float borderLineThickness;

    /**
     * the color of the guidelines lines
     */
    public int borderLineColor;

    /**
     * thickness of the corner line. (in pixels)
     */
    public float borderCornerThickness;

    /**
     * the offset of corner line from crop window border. (in pixels)
     */
    public float borderCornerOffset;

    /**
     * the length of the corner line away from the corner. (in pixels)
     */
    public float borderCornerLength;

    /**
     * the color of the corner line
     */
    public int borderCornerColor;

    /**
     * the thickness of the guidelines lines. (in pixels)
     */
    public float guidelinesThickness;

    /**
     * the color of the guidelines lines
     */
    public int guidelinesColor;

    /**
     * the color of the overlay background around the crop window cover the image parts not in the crop window.
     */
    public int backgroundColor;

    /**
     * the min width the crop window is allowed to be. (in pixels)
     */
    public int minCropWindowWidth;

    /**
     * the min height the crop window is allowed to be. (in pixels)
     */
    public int minCropWindowHeight;

    /**
     * the min width the resulting cropping image is allowed to be, affects the cropping window limits. (in pixels)
     */
    public int minCropResultWidth;

    /**
     * the min height the resulting cropping image is allowed to be, affects the cropping window limits. (in pixels)
     */
    public int minCropResultHeight;

    /**
     * the max width the resulting cropping image is allowed to be, affects the cropping window limits. (in pixels)
     */
    public int maxCropResultWidth;

    /**
     * the max height the resulting cropping image is allowed to be, affects the cropping window limits. (in pixels)
     */
    public int maxCropResultHeight;

    /**
     * the title of the {@link CropImageActivity}
     */
    public String activityTitle;

    /**
     * the color to use for action bar items icons
     */
    public int activityMenuIconColor;

    /**
     * the Android Uri to save the cropped image to
     */
    public Uri outputUri;

    /**
     * the compression format to use when writting the image
     */
    public Bitmap.CompressFormat outputCompressFormat;

    /**
     * the quility (if applicable) to use when writting the image (0 - 100)
     */
    public int outputCompressQuality;

    /**
     * the width to downsample the cropped image to
     */
    public int outputRequestWidth;

    /**
     * the height to downsample the cropped image to
     */
    public int outputRequestHeight;

    /**
     * if the result of crop image activity should not save the cropped image bitmap
     */
    public boolean noOutputImage;

    /**
     * the initial rectangle to set on the cropping image after loading
     */
    public Rect initialCropWindowRectangle;

    /**
     * the initial rotation to set on the cropping image after loading (0-360 degrees clockwise)
     */
    public int initialRotation;

    /**
     * if to allow rotation during cropping
     */
    public boolean allowRotation;

    /**
     * Init options with defaults.
     */
    public CropImageOptions() {

        DisplayMetrics dm = Resources.getSystem().getDisplayMetrics();

        cropShape = CropImageView.CropShape.RECTANGLE;
        snapRadius = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 3, dm);
        touchRadius = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 24, dm);
        guidelines = CropImageView.Guidelines.ON_TOUCH;
        scaleType = CropImageView.ScaleType.FIT_CENTER;
        showCropOverlay = true;
        showProgressBar = true;
        autoZoomEnabled = true;
        maxZoom = 4;
        initialCropWindowPaddingRatio = 0.1f;

        fixAspectRatio = false;
        aspectRatioX = 1;
        aspectRatioY = 1;

        borderLineThickness = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 3, dm);
        borderLineColor = Color.argb(170, 255, 255, 255);
        borderCornerThickness = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 2, dm);
        borderCornerOffset = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 5, dm);
        borderCornerLength = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 14, dm);
        borderCornerColor = Color.WHITE;

        guidelinesThickness = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 1, dm);
        guidelinesColor = Color.argb(170, 255, 255, 255);
        backgroundColor = Color.argb(119, 0, 0, 0);

        minCropWindowWidth = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 42, dm);
        minCropWindowHeight = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 42, dm);
        minCropResultWidth = 40;
        minCropResultHeight = 40;
        maxCropResultWidth = 99999;
        maxCropResultHeight = 99999;

        activityTitle = "";
        activityMenuIconColor = 0;

        outputUri = Uri.EMPTY;
        outputCompressFormat = Bitmap.CompressFormat.JPEG;
        outputCompressQuality = 90;
        outputRequestWidth = 0;
        outputRequestHeight = 0;
        noOutputImage = false;

        initialCropWindowRectangle = null;
        initialRotation = -1;
        allowRotation = true;
    }

    /**
     * Create object from parcel.
     */
    protected CropImageOptions(Parcel in) {
        cropShape = CropImageView.CropShape.values()[in.readInt()];
        snapRadius = in.readFloat();
        touchRadius = in.readFloat();
        guidelines = CropImageView.Guidelines.values()[in.readInt()];
        scaleType = CropImageView.ScaleType.values()[in.readInt()];
        showCropOverlay = in.readByte() != 0;
        showProgressBar = in.readByte() != 0;
        autoZoomEnabled = in.readByte() != 0;
        maxZoom = in.readInt();
        initialCropWindowPaddingRatio = in.readFloat();
        fixAspectRatio = in.readByte() != 0;
        aspectRatioX = in.readInt();
        aspectRatioY = in.readInt();
        borderLineThickness = in.readFloat();
        borderLineColor = in.readInt();
        borderCornerThickness = in.readFloat();
        borderCornerOffset = in.readFloat();
        borderCornerLength = in.readFloat();
        borderCornerColor = in.readInt();
        guidelinesThickness = in.readFloat();
        guidelinesColor = in.readInt();
        backgroundColor = in.readInt();
        minCropWindowWidth = in.readInt();
        minCropWindowHeight = in.readInt();
        minCropResultWidth = in.readInt();
        minCropResultHeight = in.readInt();
        maxCropResultWidth = in.readInt();
        maxCropResultHeight = in.readInt();
        activityTitle = in.readString();
        activityMenuIconColor = in.readInt();
        outputUri = in.readParcelable(Uri.class.getClassLoader());
        outputCompressFormat = Bitmap.CompressFormat.valueOf(in.readString());
        outputCompressQuality = in.readInt();
        outputRequestWidth = in.readInt();
        outputRequestHeight = in.readInt();
        noOutputImage = in.readByte() != 0;
        initialCropWindowRectangle = in.readParcelable(Rect.class.getClassLoader());
        initialRotation = in.readInt();
        allowRotation = in.readByte() != 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeInt(cropShape.ordinal());
        dest.writeFloat(snapRadius);
        dest.writeFloat(touchRadius);
        dest.writeInt(guidelines.ordinal());
        dest.writeInt(scaleType.ordinal());
        dest.writeByte((byte) (showCropOverlay ? 1 : 0));
        dest.writeByte((byte) (showProgressBar ? 1 : 0));
        dest.writeByte((byte) (autoZoomEnabled ? 1 : 0));
        dest.writeInt(maxZoom);
        dest.writeFloat(initialCropWindowPaddingRatio);
        dest.writeByte((byte) (fixAspectRatio ? 1 : 0));
        dest.writeInt(aspectRatioX);
        dest.writeInt(aspectRatioY);
        dest.writeFloat(borderLineThickness);
        dest.writeInt(borderLineColor);
        dest.writeFloat(borderCornerThickness);
        dest.writeFloat(borderCornerOffset);
        dest.writeFloat(borderCornerLength);
        dest.writeInt(borderCornerColor);
        dest.writeFloat(guidelinesThickness);
        dest.writeInt(guidelinesColor);
        dest.writeInt(backgroundColor);
        dest.writeInt(minCropWindowWidth);
        dest.writeInt(minCropWindowHeight);
        dest.writeInt(minCropResultWidth);
        dest.writeInt(minCropResultHeight);
        dest.writeInt(maxCropResultWidth);
        dest.writeInt(maxCropResultHeight);
        dest.writeString(activityTitle);
        dest.writeInt(activityMenuIconColor);
        dest.writeParcelable(outputUri, flags);
        dest.writeString(outputCompressFormat.name());
        dest.writeInt(outputCompressQuality);
        dest.writeInt(outputRequestWidth);
        dest.writeInt(outputRequestHeight);
        dest.writeInt(noOutputImage ? 1 : 0);
        dest.writeParcelable(initialCropWindowRectangle, flags);
        dest.writeInt(initialRotation);
        dest.writeByte((byte) (allowRotation ? 1 : 0));
    }

    @Override
    public int describeContents() {
        return 0;
    }

    /**
     * Validate all the options are withing valid range.
     *
     * @throws IllegalArgumentException if any of the options is not valid
     */
    public void validate() {
        if (maxZoom < 0) {
            throw new IllegalArgumentException("Cannot set max zoom to a number < 1");
        }
        if (touchRadius < 0) {
            throw new IllegalArgumentException("Cannot set touch radius value to a number <= 0 ");
        }
        if (initialCropWindowPaddingRatio < 0 || initialCropWindowPaddingRatio >= 0.5) {
            throw new IllegalArgumentException("Cannot set initial crop window padding value to a number < 0 or >= 0.5");
        }
        if (aspectRatioX <= 0) {
            throw new IllegalArgumentException("Cannot set aspect ratio value to a number less than or equal to 0.");
        }
        if (aspectRatioY <= 0) {
            throw new IllegalArgumentException("Cannot set aspect ratio value to a number less than or equal to 0.");
        }
        if (borderLineThickness < 0) {
            throw new IllegalArgumentException("Cannot set line thickness value to a number less than 0.");
        }
        if (borderCornerThickness < 0) {
            throw new IllegalArgumentException("Cannot set corner thickness value to a number less than 0.");
        }
        if (guidelinesThickness < 0) {
            throw new IllegalArgumentException("Cannot set guidelines thickness value to a number less than 0.");
        }
        if (minCropWindowHeight < 0) {
            throw new IllegalArgumentException("Cannot set min crop window height value to a number < 0 ");
        }
        if (minCropResultWidth < 0) {
            throw new IllegalArgumentException("Cannot set min crop result width value to a number < 0 ");
        }
        if (minCropResultHeight < 0) {
            throw new IllegalArgumentException("Cannot set min crop result height value to a number < 0 ");
        }
        if (maxCropResultWidth < minCropResultWidth) {
            throw new IllegalArgumentException("Cannot set max crop result width to smaller value than min crop result width");
        }
        if (maxCropResultHeight < minCropResultHeight) {
            throw new IllegalArgumentException("Cannot set max crop result height to smaller value than min crop result height");
        }
        if (outputRequestWidth < 0) {
            throw new IllegalArgumentException("Cannot set request width value to a number < 0 ");
        }
        if (outputRequestHeight < 0) {
            throw new IllegalArgumentException("Cannot set request height value to a number < 0 ");
        }
    }
}


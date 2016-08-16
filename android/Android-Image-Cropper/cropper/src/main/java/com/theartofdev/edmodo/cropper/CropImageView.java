// "Therefore those skilled at the unorthodox
// are infinite as heaven and earth,
// inexhaustible as the great rivers.
// When they come to an end,
// they begin again,
// like the days and months;
// they die and are reborn,
// like the four seasons."
//
// - Sun Tsu,
// "The Art of War"

package com.theartofdev.edmodo.cropper;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.res.TypedArray;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.RectF;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Bundle;
import android.os.Parcelable;
import android.util.AttributeSet;
import android.util.Pair;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.ProgressBar;

import java.lang.ref.WeakReference;
import java.util.UUID;

/**
 * Custom view that provides cropping capabilities to an image.
 */
public class CropImageView extends FrameLayout {

    //region: Fields and Consts

    /**
     * Image view widget used to show the image for cropping.
     */
    private final ImageView mImageView;

    /**
     * Overlay over the image view to show cropping UI.
     */
    private final CropOverlayView mCropOverlayView;

    /**
     * The matrix used to transform the cripping image in the image view
     */
    private final Matrix mImageMatrix = new Matrix();

    /**
     * Reusing matrix instance for reverse matrix calculations.
     */
    private final Matrix mImageInverseMatrix = new Matrix();

    /**
     * Progress bar widget to show progress bar on async image loading and cropping.
     */
    private final ProgressBar mProgressBar;

    /**
     * Rectengale used in image matrix transformation calculation (reusing rect instance)
     */
    private final RectF mImageRect = new RectF();

    /**
     * Animation class to smooth animate zoom-in/out
     */
    private CropImageAnimation mAnimation;

    private Bitmap mBitmap;

    private int mDegreesRotated;

    private int mLayoutWidth;

    private int mLayoutHeight;

    private int mImageResource;

    /**
     * The initial scale type of the image in the crop image view
     */
    private ScaleType mScaleType;

    /**
     * if to show crop overlay UI what contains the crop window UI surrounded by background over the cropping
     * image.<br>
     * default: true, may disable for animation or frame transition.
     */
    private boolean mShowCropOverlay = true;

    /**
     * if to show progress bar when image async loading/cropping is in progress.<br>
     * default: true, disable to provide custom progress bar UI.
     */
    private boolean mShowProgressBar = true;

    /**
     * if auto-zoom functionality is enabled.<br>
     * default: true.
     */
    private boolean mAutoZoomEnabled = true;

    /**
     * The max zoom allowed during cropping
     */
    private int mMaxZoom;

    /**
     * callback to be invoked when image async loading is complete
     */
    private WeakReference<OnSetImageUriCompleteListener> mOnSetImageUriCompleteListener;

    /**
     * callback to be invoked when image async cropping is complete (get bitmap)
     */
    private WeakReference<OnGetCroppedImageCompleteListener> mOnGetCroppedImageCompleteListener;

    /**
     * callback to be invoked when image async cropping is complete (save to uri)
     */
    private WeakReference<OnSaveCroppedImageCompleteListener> mOnSaveCroppedImageCompleteListener;

    /**
     * The URI that the image was loaded from (if loaded from URI)
     */
    private Uri mLoadedImageUri;

    /**
     * The sample size the image was loaded by if was loaded by URI
     */
    private int mLoadedSampleSize = 1;

    /**
     * The current zoom level to to scale the cropping image
     */
    private float mZoom = 1;

    /**
     * The X offset that the cropping image was translated after zooming
     */
    private float mZoomOffsetX;

    /**
     * The Y offset that the cropping image was translated after zooming
     */
    private float mZoomOffsetY;

    /**
     * Used to restore the cropping windows rectangle after state restore
     */
    private RectF mRestoreCropWindowRect;

    /**
     * Task used to load bitmap async from UI thread
     */
    private WeakReference<BitmapLoadingWorkerTask> mBitmapLoadingWorkerTask;

    /**
     * Task used to crop bitmap async from UI thread
     */
    private WeakReference<BitmapCroppingWorkerTask> mBitmapCroppingWorkerTask;
    //endregion

    public CropImageView(Context context) {
        this(context, null);
    }

    public CropImageView(Context context, AttributeSet attrs) {
        super(context, attrs);

        CropImageOptions options = null;
        Intent intent = context instanceof Activity ? ((Activity) context).getIntent() : null;
        if (intent != null) {
            options = intent.getParcelableExtra(CropImage.CROP_IMAGE_EXTRA_OPTIONS);
        }

        if (options == null) {

            options = new CropImageOptions();

            if (attrs != null) {
                TypedArray ta = context.obtainStyledAttributes(attrs, R.styleable.CropImageView, 0, 0);
                try {
                    options.fixAspectRatio = ta.getBoolean(R.styleable.CropImageView_cropFixAspectRatio, options.fixAspectRatio);
                    options.aspectRatioX = ta.getInteger(R.styleable.CropImageView_cropAspectRatioX, options.aspectRatioX);
                    options.aspectRatioY = ta.getInteger(R.styleable.CropImageView_cropAspectRatioY, options.aspectRatioY);
                    options.scaleType = ScaleType.values()[ta.getInt(R.styleable.CropImageView_cropScaleType, options.scaleType.ordinal())];
                    options.autoZoomEnabled = ta.getBoolean(R.styleable.CropImageView_cropAutoZoomEnabled, options.autoZoomEnabled);
                    options.maxZoom = ta.getInteger(R.styleable.CropImageView_cropMaxZoom, options.maxZoom);
                    options.cropShape = CropShape.values()[ta.getInt(R.styleable.CropImageView_cropShape, options.cropShape.ordinal())];
                    options.guidelines = Guidelines.values()[ta.getInt(R.styleable.CropImageView_cropGuidelines, options.guidelines.ordinal())];
                    options.snapRadius = ta.getDimension(R.styleable.CropImageView_cropSnapRadius, options.snapRadius);
                    options.touchRadius = ta.getDimension(R.styleable.CropImageView_cropTouchRadius, options.touchRadius);
                    options.initialCropWindowPaddingRatio = ta.getFloat(R.styleable.CropImageView_cropInitialCropWindowPaddingRatio, options.initialCropWindowPaddingRatio);
                    options.borderLineThickness = ta.getDimension(R.styleable.CropImageView_cropBorderLineThickness, options.borderLineThickness);
                    options.borderLineColor = ta.getInteger(R.styleable.CropImageView_cropBorderLineColor, options.borderLineColor);
                    options.borderCornerThickness = ta.getDimension(R.styleable.CropImageView_cropBorderCornerThickness, options.borderCornerThickness);
                    options.borderCornerOffset = ta.getDimension(R.styleable.CropImageView_cropBorderCornerOffset, options.borderCornerOffset);
                    options.borderCornerLength = ta.getDimension(R.styleable.CropImageView_cropBorderCornerLength, options.borderCornerLength);
                    options.borderCornerColor = ta.getInteger(R.styleable.CropImageView_cropBorderCornerColor, options.borderCornerColor);
                    options.guidelinesThickness = ta.getDimension(R.styleable.CropImageView_cropGuidelinesThickness, options.guidelinesThickness);
                    options.guidelinesColor = ta.getInteger(R.styleable.CropImageView_cropGuidelinesColor, options.guidelinesColor);
                    options.backgroundColor = ta.getInteger(R.styleable.CropImageView_cropBackgroundColor, options.backgroundColor);
                    options.showCropOverlay = ta.getBoolean(R.styleable.CropImageView_cropShowCropOverlay, mShowCropOverlay);
                    options.showProgressBar = ta.getBoolean(R.styleable.CropImageView_cropShowProgressBar, mShowProgressBar);
                    options.borderCornerThickness = ta.getDimension(R.styleable.CropImageView_cropBorderCornerThickness, options.borderCornerThickness);
                    options.minCropWindowWidth = (int) ta.getDimension(R.styleable.CropImageView_cropMinCropWindowWidth, options.minCropWindowWidth);
                    options.minCropWindowHeight = (int) ta.getDimension(R.styleable.CropImageView_cropMinCropWindowHeight, options.minCropWindowHeight);
                    options.minCropResultWidth = (int) ta.getFloat(R.styleable.CropImageView_cropMinCropResultWidthPX, options.minCropResultWidth);
                    options.minCropResultHeight = (int) ta.getFloat(R.styleable.CropImageView_cropMinCropResultHeightPX, options.minCropResultHeight);
                    options.maxCropResultWidth = (int) ta.getFloat(R.styleable.CropImageView_cropMaxCropResultWidthPX, options.maxCropResultWidth);
                    options.maxCropResultHeight = (int) ta.getFloat(R.styleable.CropImageView_cropMaxCropResultHeightPX, options.maxCropResultHeight);
                } finally {
                    ta.recycle();
                }
            }
        }

        options.validate();

        mScaleType = options.scaleType;
        mAutoZoomEnabled = options.autoZoomEnabled;
        mMaxZoom = options.maxZoom;
        mShowCropOverlay = options.showCropOverlay;
        mShowProgressBar = options.showProgressBar;

        LayoutInflater inflater = LayoutInflater.from(context);
        View v = inflater.inflate(R.layout.crop_image_view, this, true);

        mImageView = (ImageView) v.findViewById(R.id.ImageView_image);
        mImageView.setScaleType(ImageView.ScaleType.MATRIX);

        mCropOverlayView = (CropOverlayView) v.findViewById(R.id.CropOverlayView);
        mCropOverlayView.setCropWindowChangeListener(new CropOverlayView.CropWindowChangeListener() {
            @Override
            public void onCropWindowChanged(boolean inProgress) {
                handleCropWindowChanged(inProgress, true);
            }
        });
        mCropOverlayView.setInitialAttributeValues(options);

        mProgressBar = (ProgressBar) v.findViewById(R.id.CropProgressBar);
        setProgressBarVisibility();
    }

    /**
     * Get the scale type of the image in the crop view.
     */
    public ScaleType getScaleType() {
        return mScaleType;
    }

    /**
     * Set the scale type of the image in the crop view
     */
    public void setScaleType(ScaleType scaleType) {
        if (scaleType != mScaleType) {
            mScaleType = scaleType;
            mZoom = 1;
            mZoomOffsetX = mZoomOffsetY = 0;
            mCropOverlayView.resetCropOverlayView();
            requestLayout();
        }
    }

    /**
     * The shape of the cropping area - rectangle/circular.
     */
    public CropShape getCropShape() {
        return mCropOverlayView.getCropShape();
    }

    /**
     * The shape of the cropping area - rectangle/circular.
     */
    public void setCropShape(CropShape cropShape) {
        mCropOverlayView.setCropShape(cropShape);
    }

    /**
     * if auto-zoom functionality is enabled. default: true.
     */
    public boolean isAutoZoomEnabled() {
        return mAutoZoomEnabled;
    }

    /**
     * Set auto-zoom functionality to enabled/disabled.
     */
    public void setAutoZoomEnabled(boolean autoZoomEnabled) {
        if (mAutoZoomEnabled != autoZoomEnabled) {
            mAutoZoomEnabled = autoZoomEnabled;
            handleCropWindowChanged(false, false);
            mCropOverlayView.invalidate();
        }
    }

    /**
     * The max zoom allowed during cropping.
     */
    public int getMaxZoom() {
        return mMaxZoom;
    }

    /**
     * The max zoom allowed during cropping.
     */
    public void setMaxZoom(int maxZoom) {
        if (mMaxZoom != maxZoom && maxZoom > 0) {
            mMaxZoom = maxZoom;
            handleCropWindowChanged(false, false);
            mCropOverlayView.invalidate();
        }
    }

    /**
     * Get the amount of degrees the cropping image is rotated cloackwise.<br>
     *
     * @return 0-360
     */
    public int getRotatedDegrees() {
        return mDegreesRotated;
    }

    /**
     * Set the amount of degrees the cropping image is rotated cloackwise.<br>
     *
     * @param degrees 0-360
     */
    public void setRotatedDegrees(int degrees) {
        if (mDegreesRotated != degrees) {
            rotateImage(degrees - mDegreesRotated);
        }
    }

    /**
     * whether the aspect ratio is fixed or not; true fixes the aspect ratio, while false allows it to be changed.
     */
    public boolean isFixAspectRatio() {
        return mCropOverlayView.isFixAspectRatio();
    }

    /**
     * Sets whether the aspect ratio is fixed or not; true fixes the aspect ratio, while false allows it to be changed.
     */
    public void setFixedAspectRatio(boolean fixAspectRatio) {
        mCropOverlayView.setFixedAspectRatio(fixAspectRatio);
    }

    /**
     * Get the current guidelines option set.
     */
    public Guidelines getGuidelines() {
        return mCropOverlayView.getGuidelines();
    }

    /**
     * Sets the guidelines for the CropOverlayView to be either on, off, or to show when resizing the application.
     */
    public void setGuidelines(Guidelines guidelines) {
        mCropOverlayView.setGuidelines(guidelines);
    }

    /**
     * both the X and Y values of the aspectRatio.
     */
    public Pair<Integer, Integer> getAspectRatio() {
        return new Pair<>(mCropOverlayView.getAspectRatioX(), mCropOverlayView.getAspectRatioY());
    }

    /**
     * Sets the both the X and Y values of the aspectRatio.
     *
     * @param aspectRatioX int that specifies the new X value of the aspect ratio
     * @param aspectRatioY int that specifies the new Y value of the aspect ratio
     */
    public void setAspectRatio(int aspectRatioX, int aspectRatioY) {
        mCropOverlayView.setAspectRatioX(aspectRatioX);
        mCropOverlayView.setAspectRatioY(aspectRatioY);
    }

    /**
     * An edge of the crop window will snap to the corresponding edge of a
     * specified bounding box when the crop window edge is less than or equal to
     * this distance (in pixels) away from the bounding box edge. (default: 3dp)
     */
    public void setSnapRadius(float snapRadius) {
        if (snapRadius >= 0) {
            mCropOverlayView.setSnapRadius(snapRadius);
        }
    }

    /**
     * if to show progress bar when image async loading/cropping is in progress.<br>
     * default: true, disable to provide custom progress bar UI.
     */
    public boolean isShowProgressBar() {
        return mShowProgressBar;
    }

    /**
     * if to show progress bar when image async loading/cropping is in progress.<br>
     * default: true, disable to provide custom progress bar UI.
     */
    public void setShowProgressBar(boolean showProgressBar) {
        if (mShowProgressBar != showProgressBar) {
            mShowProgressBar = showProgressBar;
            setProgressBarVisibility();
        }
    }

    /**
     * if to show crop overlay UI what contains the crop window UI surrounded by background over the cropping
     * image.<br>
     * default: true, may disable for animation or frame transition.
     */
    public boolean isShowCropOverlay() {
        return mShowCropOverlay;
    }

    /**
     * if to show crop overlay UI what contains the crop window UI surrounded by background over the cropping
     * image.<br>
     * default: true, may disable for animation or frame transition.
     */
    public void setShowCropOverlay(boolean showCropOverlay) {
        if (mShowCropOverlay != showCropOverlay) {
            mShowCropOverlay = showCropOverlay;
            setCropOverlayVisibility();
        }
    }

    /**
     * Returns the integer of the imageResource
     */
    public int getImageResource() {
        return mImageResource;
    }

    /**
     * Get the URI of an image that was set by URI, null otherwise.
     */
    public Uri getImageUri() {
        return mLoadedImageUri;
    }

    /**
     * Gets the crop window's position relative to the source Bitmap (not the image
     * displayed in the CropImageView) using the original image rotation.
     *
     * @return a Rect instance containing cropped area boundaries of the source Bitmap
     */
    public Rect getCropRect() {
        if (mBitmap != null) {

            // get the points of the crop rectangle adjusted to source bitmap
            float[] points = getCropPoints();

            int orgWidth = mBitmap.getWidth() * mLoadedSampleSize;
            int orgHeight = mBitmap.getHeight() * mLoadedSampleSize;

            // get the rectangle for the points (it may be larger than original if rotation is not stright)
            return BitmapUtils.getRectFromPoints(points, orgWidth, orgHeight,
                    mCropOverlayView.isFixAspectRatio(), mCropOverlayView.getAspectRatioX(), mCropOverlayView.getAspectRatioY());
        } else {
            return null;
        }
    }

    /**
     * Gets the 4 points of crop window's position relative to the source Bitmap (not the image
     * displayed in the CropImageView) using the original image rotation.<br>
     * Note: the 4 points may not be a rectangle if the image was rotates to NOT stright angle (!= 90/180/270).
     *
     * @return 4 points (x0,y0,x1,y1,x2,y2,x3,y3) of cropped area boundaries
     */
    public float[] getCropPoints() {

        // Get crop window position relative to the displayed image.
        RectF cropWindowRect = mCropOverlayView.getCropWindowRect();

        float[] points = new float[]{
                cropWindowRect.left,
                cropWindowRect.top,
                cropWindowRect.right,
                cropWindowRect.top,
                cropWindowRect.right,
                cropWindowRect.bottom,
                cropWindowRect.left,
                cropWindowRect.bottom
        };

        mImageMatrix.invert(mImageInverseMatrix);
        mImageInverseMatrix.mapPoints(points);

        for (int i = 0; i < points.length; i++) {
            points[i] *= mLoadedSampleSize;
        }

        return points;
    }

    /**
     * Set the crop window position and size to the given rectangle.<br>
     * Image to crop must be first set before invoking this, for async - after complete callback.
     *
     * @param rect window rectangle (position and size) relative to source bitmap
     */
    public void setCropRect(Rect rect) {
        mCropOverlayView.setInitialCropWindowRect(rect);
    }

    /**
     * Reset crop window to initial rectangle.
     */
    public void resetCropRect() {
        mZoom = 1;
        mZoomOffsetX = 0;
        mZoomOffsetY = 0;
        mDegreesRotated = 0;
        applyImageMatrix(getWidth(), getHeight(), false, false);
        mCropOverlayView.resetCropWindowRect();
    }

    /**
     * Gets the cropped image based on the current crop window.
     *
     * @return a new Bitmap representing the cropped image
     */
    public Bitmap getCroppedImage() {
        return getCroppedImage(0, 0);
    }

    /**
     * Gets the cropped image based on the current crop window.<br>
     * If image loaded from URI will use sample size to fit in the requested width and height down-sampling
     * if required - optimization to get best size to quality.<br>
     * NOTE: resulting image will not be exactly (reqWidth, reqHeight)
     * see: <a href="http://developer.android.com/training/displaying-bitmaps/load-bitmap.html">Loading Large
     * Bitmaps Efficiently</a>
     *
     * @param reqWidth the width to downsample the cropped image to
     * @param reqHeight the height to downsample the cropped image to
     * @return a new Bitmap representing the cropped image
     */
    public Bitmap getCroppedImage(int reqWidth, int reqHeight) {
        Bitmap croppedBitmap = null;
        if (mBitmap != null) {
            mImageView.clearAnimation();
            if (mLoadedImageUri != null && mLoadedSampleSize > 1) {
                int orgWidth = mBitmap.getWidth() * mLoadedSampleSize;
                int orgHeight = mBitmap.getHeight() * mLoadedSampleSize;
                croppedBitmap = BitmapUtils.cropBitmap(getContext(), mLoadedImageUri, getCropPoints(),
                        mDegreesRotated, orgWidth, orgHeight,
                        mCropOverlayView.isFixAspectRatio(), mCropOverlayView.getAspectRatioX(), mCropOverlayView.getAspectRatioY(),
                        reqWidth, reqHeight);
            } else {
                croppedBitmap = BitmapUtils.cropBitmap(mBitmap, getCropPoints(), mDegreesRotated,
                        mCropOverlayView.isFixAspectRatio(), mCropOverlayView.getAspectRatioX(), mCropOverlayView.getAspectRatioY());
            }
        }

        return croppedBitmap;
    }

    /**
     * Gets the cropped image based on the current crop window.<br>
     * The result will be invoked to listener set by {@link #setOnGetCroppedImageCompleteListener(OnGetCroppedImageCompleteListener)}.
     */
    public void getCroppedImageAsync() {
        getCroppedImageAsync(0, 0);
    }

    /**
     * Gets the cropped image based on the current crop window.<br>
     * If (reqWidth,reqHeight) is given AND image is loaded from URI cropping will try to use sample size to fit in
     * the requested width and height down-sampling if possible - optimization to get best size to quality.<br>
     * NOTE: resulting image will not be exactly (reqWidth, reqHeight)
     * see: <a href="http://developer.android.com/training/displaying-bitmaps/load-bitmap.html">Loading Large
     * Bitmaps Efficiently</a><br>
     * The result will be invoked to listener set by {@link #setOnGetCroppedImageCompleteListener(OnGetCroppedImageCompleteListener)}.
     *
     * @param reqWidth the width to downsample the cropped image to
     * @param reqHeight the height to downsample the cropped image to
     */
    public void getCroppedImageAsync(int reqWidth, int reqHeight) {
        if (mOnGetCroppedImageCompleteListener == null) {
            throw new IllegalArgumentException("OnGetCroppedImageCompleteListener is not set");
        }
        startCropWorkerTask(reqWidth, reqHeight, null, null, 0);
    }

    /**
     * Save the cropped image based on the current crop window to the given uri.<br>
     * Uses JPEG image compression with 90 compression quality.<br>
     * The result will be invoked to listener set by {@link #setOnGetCroppedImageCompleteListener(OnGetCroppedImageCompleteListener)}.
     *
     * @param saveUri the Android Uri to save the cropped image to
     */
    public void saveCroppedImageAsync(Uri saveUri) {
        saveCroppedImageAsync(saveUri, Bitmap.CompressFormat.JPEG, 90, 0, 0);
    }

    /**
     * Save the cropped image based on the current crop window to the given uri.<br>
     * The result will be invoked to listener set by {@link #setOnGetCroppedImageCompleteListener(OnGetCroppedImageCompleteListener)}.
     *
     * @param saveUri the Android Uri to save the cropped image to
     * @param saveCompressFormat the compression format to use when writting the image
     * @param saveCompressQuality the quility (if applicable) to use when writting the image (0 - 100)
     */
    public void saveCroppedImageAsync(Uri saveUri, Bitmap.CompressFormat saveCompressFormat, int saveCompressQuality) {
        saveCroppedImageAsync(saveUri, saveCompressFormat, saveCompressQuality, 0, 0);
    }

    /**
     * Save the cropped image based on the current crop window to the given uri.<br>
     * If (reqWidth,reqHeight) is given AND image is loaded from URI cropping will try to use sample size to fit in
     * the requested width and height down-sampling if possible - optimization to get best size to quality.<br>
     * NOTE: resulting image will not be exactly (reqWidth, reqHeight)
     * see: <a href="http://developer.android.com/training/displaying-bitmaps/load-bitmap.html">Loading Large
     * Bitmaps Efficiently</a><br>
     * The result will be invoked to listener set by {@link #setOnGetCroppedImageCompleteListener(OnGetCroppedImageCompleteListener)}.
     *
     * @param saveUri the Android Uri to save the cropped image to
     * @param saveCompressFormat the compression format to use when writting the image
     * @param saveCompressQuality the quility (if applicable) to use when writting the image (0 - 100)
     * @param reqWidth the width to downsample the cropped image to
     * @param reqHeight the height to downsample the cropped image to
     */
    public void saveCroppedImageAsync(Uri saveUri, Bitmap.CompressFormat saveCompressFormat, int saveCompressQuality, int reqWidth, int reqHeight) {
        if (mOnSaveCroppedImageCompleteListener == null) {
            throw new IllegalArgumentException("mOnSaveCroppedImageCompleteListener is not set");
        }
        startCropWorkerTask(reqWidth, reqHeight, saveUri, saveCompressFormat, saveCompressQuality);
    }

    /**
     * Set the callback to be invoked when image async loading ({@link #setImageUriAsync(Uri)})
     * is complete (successful or failed).
     */
    public void setOnSetImageUriCompleteListener(OnSetImageUriCompleteListener listener) {
        mOnSetImageUriCompleteListener = listener != null ? new WeakReference<>(listener) : null;
    }

    /**
     * Set the callback to be invoked when image async get cropping image ({@link #getCroppedImageAsync()})
     * is complete (successful or failed).
     */
    public void setOnGetCroppedImageCompleteListener(OnGetCroppedImageCompleteListener listener) {
        mOnGetCroppedImageCompleteListener = listener != null ? new WeakReference<>(listener) : null;
    }

    /**
     * Set the callback to be invoked when image async save cropping image ({@link #saveCroppedImageAsync(Uri)})
     * is complete (successful or failed).
     */
    public void setOnSaveCroppedImageCompleteListener(OnSaveCroppedImageCompleteListener listener) {
        mOnSaveCroppedImageCompleteListener = listener != null ? new WeakReference<>(listener) : null;
    }

    /**
     * Sets a Bitmap as the content of the CropImageView.
     *
     * @param bitmap the Bitmap to set
     */
    public void setImageBitmap(Bitmap bitmap) {
        mCropOverlayView.setInitialCropWindowRect(null);
        setBitmap(bitmap, true);
    }

    /**
     * Sets a Bitmap and initializes the image rotation according to the EXIT data.<br>
     * <br>
     * The EXIF can be retrieved by doing the following:
     * <code>ExifInterface exif = new ExifInterface(path);</code>
     *
     * @param bitmap the original bitmap to set; if null, this
     * @param exif the EXIF information about this bitmap; may be null
     */
    public void setImageBitmap(Bitmap bitmap, ExifInterface exif) {
        Bitmap setBitmap;
        if (bitmap != null && exif != null) {
            BitmapUtils.RotateBitmapResult result = BitmapUtils.rotateBitmapByExif(bitmap, exif);
            setBitmap = result.bitmap;
            mDegreesRotated = result.degrees;
        } else {
            setBitmap = bitmap;
        }
        mCropOverlayView.setInitialCropWindowRect(null);
        setBitmap(setBitmap, true);
    }

    /**
     * Sets a Drawable as the content of the CropImageView.
     *
     * @param resId the drawable resource ID to set
     */
    public void setImageResource(int resId) {
        if (resId != 0) {
            mCropOverlayView.setInitialCropWindowRect(null);
            Bitmap bitmap = BitmapFactory.decodeResource(getResources(), resId);
            setBitmap(bitmap, true);
            mImageResource = resId;
        }
    }

    /**
     * Sets a bitmap loaded from the given Android URI as the content of the CropImageView.<br>
     * Can be used with URI from gallery or camera source.<br>
     * Will rotate the image by exif data.<br>
     *
     * @param uri the URI to load the image from
     */
    public void setImageUriAsync(Uri uri) {
        if (uri != null) {
            BitmapLoadingWorkerTask currentTask = mBitmapLoadingWorkerTask != null ? mBitmapLoadingWorkerTask.get() : null;
            if (currentTask != null) {
                // cancel previous loading (no check if the same URI because camera URI can be the same for different images)
                currentTask.cancel(true);
            }

            // either no existing task is working or we canceled it, need to load new URI
            clearImage(true);
            mCropOverlayView.setInitialCropWindowRect(null);
            mBitmapLoadingWorkerTask = new WeakReference<>(new BitmapLoadingWorkerTask(this, uri));
            mBitmapLoadingWorkerTask.get().execute();
            setProgressBarVisibility();
        }
    }

    /**
     * Clear the current image set for cropping.
     */
    public void clearImage() {
        clearImage(true);
        mCropOverlayView.setInitialCropWindowRect(null);
    }

    /**
     * Rotates image by the specified number of degrees clockwise.<br>
     * Cycles from 0 to 360 degrees.
     *
     * @param degrees Integer specifying the number of degrees to rotate.
     */
    public void rotateImage(int degrees) {
        if (mBitmap != null) {
            if (degrees % 90 == 0) {

                BitmapUtils.RECT.set(mCropOverlayView.getCropWindowRect());

                mImageMatrix.invert(mImageInverseMatrix);
                mImageInverseMatrix.mapRect(BitmapUtils.RECT);

                mZoom = 1;
                mZoomOffsetX = 0;
                mZoomOffsetY = 0;
                mDegreesRotated += degrees;
                mDegreesRotated = mDegreesRotated >= 0 ? mDegreesRotated % 360 : mDegreesRotated % 360 + 360;

                applyImageMatrix(getWidth(), getHeight(), true, false);

                mImageMatrix.mapRect(BitmapUtils.RECT);

                mCropOverlayView.resetCropOverlayView();
                mCropOverlayView.setCropWindowRect(BitmapUtils.RECT);
                applyImageMatrix(getWidth(), getHeight(), true, false);
                handleCropWindowChanged(false, false);

            } else {

                mDegreesRotated += degrees;
                mDegreesRotated = mDegreesRotated >= 0 ? mDegreesRotated % 360 : mDegreesRotated % 360 + 360;

                mZoom = 1;
                mZoomOffsetX = mZoomOffsetY = 0;
                mCropOverlayView.resetCropOverlayView();
                applyImageMatrix(getWidth(), getHeight(), true, false);
            }
        }
    }

    //region: Private methods

    /**
     * On complete of the async bitmap loading by {@link #setImageUriAsync(Uri)} set the result
     * to the widget if still relevant and call listener if set.
     *
     * @param result the result of bitmap loading
     */
    void onSetImageUriAsyncComplete(BitmapLoadingWorkerTask.Result result) {

        mBitmapLoadingWorkerTask = null;
        setProgressBarVisibility();

        if (result.error == null) {
            setBitmap(result.bitmap, true);
            mLoadedImageUri = result.uri;
            mLoadedSampleSize = result.loadSampleSize;
            mDegreesRotated = result.degreesRotated;
        }

        OnSetImageUriCompleteListener listener = mOnSetImageUriCompleteListener != null
                ? mOnSetImageUriCompleteListener.get() : null;
        if (listener != null) {
            listener.onSetImageUriComplete(this, result.uri, result.error);
        }
    }

    /**
     * On complete of the async bitmap cropping by {@link #getCroppedImageAsync()} call listener if set.
     *
     * @param result the result of bitmap cropping
     */
    void onImageCroppingAsyncComplete(BitmapCroppingWorkerTask.Result result) {

        mBitmapCroppingWorkerTask = null;
        setProgressBarVisibility();

        if (result.isSave) {
            OnSaveCroppedImageCompleteListener listener = mOnSaveCroppedImageCompleteListener != null
                    ? mOnSaveCroppedImageCompleteListener.get() : null;
            if (listener != null) {
                listener.onSaveCroppedImageComplete(this, result.uri, result.error);
            }
        } else {
            OnGetCroppedImageCompleteListener listener = mOnGetCroppedImageCompleteListener != null
                    ? mOnGetCroppedImageCompleteListener.get() : null;
            if (listener != null) {
                listener.onGetCroppedImageComplete(this, result.bitmap, result.error);
            }
        }
    }

    /**
     * Set the given bitmap to be used in for cropping<br>
     * Optionally clear full if the bitmap is new, or partial clear if the bitmap has been manipulated.
     */
    private void setBitmap(Bitmap bitmap, boolean clearFull) {
        if (mBitmap == null || !mBitmap.equals(bitmap)) {

            mImageView.clearAnimation();

            clearImage(clearFull);

            mBitmap = bitmap;
            mImageView.setImageBitmap(mBitmap);

            applyImageMatrix(getWidth(), getHeight(), true, false);

            if (mCropOverlayView != null) {
                mCropOverlayView.resetCropOverlayView();
                setCropOverlayVisibility();
            }
        }
    }

    /**
     * Clear the current image set for cropping.<br>
     * Full clear will also clear the data of the set image like Uri or Resource id while partial clear
     * will only clear the bitmap and recycle if required.
     */
    private void clearImage(boolean full) {

        // if we allocated the bitmap, release it as fast as possible
        if (mBitmap != null && (mImageResource > 0 || mLoadedImageUri != null)) {
            mBitmap.recycle();
        }
        mBitmap = null;

        if (full) {
            // clean the loaded image flags for new image
            mImageResource = 0;
            mLoadedImageUri = null;
            mLoadedSampleSize = 1;
            mDegreesRotated = 0;
            mZoom = 1;
            mZoomOffsetX = 0;
            mZoomOffsetY = 0;
            mImageMatrix.reset();

            mImageView.setImageBitmap(null);

            setCropOverlayVisibility();
        }
    }

    /**
     * Gets the cropped image based on the current crop window.<br>
     * If (reqWidth,reqHeight) is given AND image is loaded from URI cropping will try to use sample size to fit in
     * the requested width and height down-sampling if possible - optimization to get best size to quality.<br>
     * The result will be invoked to listener set by {@link #setOnGetCroppedImageCompleteListener(OnGetCroppedImageCompleteListener)}.
     *
     * @param reqWidth optional: the width to downsample the cropped image to
     * @param reqHeight optional: the height to downsample the cropped image to
     * @param saveUri optional: to save the cropped image to
     * @param saveCompressFormat if saveUri is given, the given compression will be used for saving the image
     * @param saveCompressQuality if saveUri is given, the given quiality will be used for the compression.
     */
    public void startCropWorkerTask(int reqWidth, int reqHeight, Uri saveUri, Bitmap.CompressFormat saveCompressFormat, int saveCompressQuality) {
        if (mBitmap != null) {
            mImageView.clearAnimation();
    
            BitmapCroppingWorkerTask currentTask = mBitmapCroppingWorkerTask != null ? mBitmapCroppingWorkerTask.get() : null;
            if (currentTask != null) {
                // cancel previous cropping
                currentTask.cancel(true);
            }
    
            int orgWidth = mBitmap.getWidth() * mLoadedSampleSize;
            int orgHeight = mBitmap.getHeight() * mLoadedSampleSize;
            if (mLoadedImageUri != null && mLoadedSampleSize > 1) {
                mBitmapCroppingWorkerTask = new WeakReference<>(new BitmapCroppingWorkerTask(this, mLoadedImageUri, getCropPoints(),
                        mDegreesRotated, orgWidth, orgHeight,
                        mCropOverlayView.isFixAspectRatio(), mCropOverlayView.getAspectRatioX(), mCropOverlayView.getAspectRatioY(),
                        reqWidth, reqHeight, saveUri, saveCompressFormat, saveCompressQuality));
            } else {
                mBitmapCroppingWorkerTask = new WeakReference<>(new BitmapCroppingWorkerTask(this, mBitmap, getCropPoints(), mDegreesRotated,
                        mCropOverlayView.isFixAspectRatio(), mCropOverlayView.getAspectRatioX(), mCropOverlayView.getAspectRatioY(), saveUri, saveCompressFormat, saveCompressQuality));
            }
            mBitmapCroppingWorkerTask.get().execute();
            setProgressBarVisibility();
        }
    }

    @Override
    public Parcelable onSaveInstanceState() {
        Bundle bundle = new Bundle();
        bundle.putParcelable("instanceState", super.onSaveInstanceState());
        bundle.putParcelable("LOADED_IMAGE_URI", mLoadedImageUri);
        bundle.putInt("LOADED_IMAGE_RESOURCE", mImageResource);
        if (mLoadedImageUri == null && mImageResource < 1) {
            bundle.putParcelable("SET_BITMAP", mBitmap);
        }
        if (mLoadedImageUri != null && mBitmap != null) {
            String key = UUID.randomUUID().toString();
            BitmapUtils.mStateBitmap = new Pair<>(key, new WeakReference<>(mBitmap));
            bundle.putString("LOADED_IMAGE_STATE_BITMAP_KEY", key);
        }
        if (mBitmapLoadingWorkerTask != null) {
            BitmapLoadingWorkerTask task = mBitmapLoadingWorkerTask.get();
            if (task != null) {
                bundle.putParcelable("LOADING_IMAGE_URI", task.getUri());
            }
        }
        bundle.putInt("LOADED_SAMPLE_SIZE", mLoadedSampleSize);
        bundle.putInt("DEGREES_ROTATED", mDegreesRotated);
        bundle.putParcelable("INITIAL_CROP_RECT", mCropOverlayView.getInitialCropWindowRect());

        BitmapUtils.RECT.set(mCropOverlayView.getCropWindowRect());

        mImageMatrix.invert(mImageInverseMatrix);
        mImageInverseMatrix.mapRect(BitmapUtils.RECT);

        bundle.putParcelable("CROP_WINDOW_RECT", BitmapUtils.RECT);
        bundle.putString("CROP_SHAPE", mCropOverlayView.getCropShape().name());
        bundle.putBoolean("CROP_AUTO_ZOOM_ENABLED", mAutoZoomEnabled);
        bundle.putInt("CROP_MAX_ZOOM", mMaxZoom);

        return bundle;
    }

    @Override
    public void onRestoreInstanceState(Parcelable state) {
        if (state instanceof Bundle) {
            Bundle bundle = (Bundle) state;

            Bitmap bitmap = null;
            Uri uri = bundle.getParcelable("LOADED_IMAGE_URI");
            if (uri != null) {
                String key = bundle.getString("LOADED_IMAGE_STATE_BITMAP_KEY");
                if (key != null) {
                    Bitmap stateBitmap = BitmapUtils.mStateBitmap != null && BitmapUtils.mStateBitmap.first.equals(key)
                            ? BitmapUtils.mStateBitmap.second.get() : null;
                    if (stateBitmap != null && !stateBitmap.isRecycled()) {
                        BitmapUtils.mStateBitmap = null;
                        setBitmap(stateBitmap, true);
                        mLoadedImageUri = uri;
                        mLoadedSampleSize = bundle.getInt("LOADED_SAMPLE_SIZE");
                    }
                }
                if (mLoadedImageUri == null) {
                    setImageUriAsync(uri);
                }

            } else {
                int resId = bundle.getInt("LOADED_IMAGE_RESOURCE");
                if (resId > 0) {
                    setImageResource(resId);
                } else {
                    bitmap = bundle.getParcelable("SET_BITMAP");
                    if (bitmap != null) {
                        setBitmap(bitmap, true);
                    } else {
                        uri = bundle.getParcelable("LOADING_IMAGE_URI");
                        if (uri != null) {
                            setImageUriAsync(uri);
                        }
                    }
                }
            }

            mDegreesRotated = bundle.getInt("DEGREES_ROTATED");

            mCropOverlayView.setInitialCropWindowRect((Rect) bundle.getParcelable("INITIAL_CROP_RECT"));

            mRestoreCropWindowRect = bundle.getParcelable("CROP_WINDOW_RECT");

            mCropOverlayView.setCropShape(CropShape.valueOf(bundle.getString("CROP_SHAPE")));

            mAutoZoomEnabled = bundle.getBoolean("CROP_AUTO_ZOOM_ENABLED");
            mMaxZoom = bundle.getInt("CROP_MAX_ZOOM");

            super.onRestoreInstanceState(bundle.getParcelable("instanceState"));
        } else {
            super.onRestoreInstanceState(state);
        }
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);

        int widthMode = MeasureSpec.getMode(widthMeasureSpec);
        int widthSize = MeasureSpec.getSize(widthMeasureSpec);
        int heightMode = MeasureSpec.getMode(heightMeasureSpec);
        int heightSize = MeasureSpec.getSize(heightMeasureSpec);

        if (mBitmap != null) {

            // Bypasses a baffling bug when used within a ScrollView, where heightSize is set to 0.
            if (heightSize == 0) {
                heightSize = mBitmap.getHeight();
            }

            int desiredWidth;
            int desiredHeight;

            double viewToBitmapWidthRatio = Double.POSITIVE_INFINITY;
            double viewToBitmapHeightRatio = Double.POSITIVE_INFINITY;

            // Checks if either width or height needs to be fixed
            if (widthSize < mBitmap.getWidth()) {
                viewToBitmapWidthRatio = (double) widthSize / (double) mBitmap.getWidth();
            }
            if (heightSize < mBitmap.getHeight()) {
                viewToBitmapHeightRatio = (double) heightSize / (double) mBitmap.getHeight();
            }

            // If either needs to be fixed, choose smallest ratio and calculate from there
            if (viewToBitmapWidthRatio != Double.POSITIVE_INFINITY || viewToBitmapHeightRatio != Double.POSITIVE_INFINITY) {
                if (viewToBitmapWidthRatio <= viewToBitmapHeightRatio) {
                    desiredWidth = widthSize;
                    desiredHeight = (int) (mBitmap.getHeight() * viewToBitmapWidthRatio);
                } else {
                    desiredHeight = heightSize;
                    desiredWidth = (int) (mBitmap.getWidth() * viewToBitmapHeightRatio);
                }
            } else {
                // Otherwise, the picture is within frame layout bounds. Desired width is simply picture size
                desiredWidth = mBitmap.getWidth();
                desiredHeight = mBitmap.getHeight();
            }

            int width = getOnMeasureSpec(widthMode, widthSize, desiredWidth);
            int height = getOnMeasureSpec(heightMode, heightSize, desiredHeight);

            mLayoutWidth = width;
            mLayoutHeight = height;

            setMeasuredDimension(mLayoutWidth, mLayoutHeight);

        } else {
            setMeasuredDimension(widthSize, heightSize);
        }
    }

    @Override
    protected void onLayout(boolean changed, int l, int t, int r, int b) {

        super.onLayout(changed, l, t, r, b);

        if (mLayoutWidth > 0 && mLayoutHeight > 0) {
            // Gets original parameters, and creates the new parameters
            ViewGroup.LayoutParams origParams = this.getLayoutParams();
            origParams.width = mLayoutWidth;
            origParams.height = mLayoutHeight;
            setLayoutParams(origParams);

            if (mBitmap != null) {
                applyImageMatrix(r - l, b - t, false, false);

                // after state restore we want to restore the window crop, possible only after widget size is known
                if (mBitmap != null && mRestoreCropWindowRect != null) {
                    mImageMatrix.mapRect(mRestoreCropWindowRect);
                    mCropOverlayView.setCropWindowRect(mRestoreCropWindowRect);
                    mRestoreCropWindowRect = null;
                    handleCropWindowChanged(false, false);
                }
            } else {
                updateBitmapRect(BitmapUtils.EMPTY_RECT_F);
            }
        } else {
            updateBitmapRect(BitmapUtils.EMPTY_RECT_F);
        }
    }

    /**
     * Handle crop window change to:<br>
     * 1. Execute auto-zoom-in/out depending on the area covered of cropping window relative to the
     * available view area.<br>
     * 2. Slide the zoomed sub-area if the cropping window is outside of the visible view sub-area.<br>
     *
     * @param inProgress is the crop window change is still in progress by the user
     * @param animate if to animate the change to the image matrix, or set it directly
     */
    private void handleCropWindowChanged(boolean inProgress, boolean animate) {
        int width = getWidth();
        int height = getHeight();
        if (mBitmap != null && width > 0 && height > 0) {

            RectF cropRect = mCropOverlayView.getCropWindowRect();
            if (inProgress) {
                if (cropRect.left < 0 || cropRect.top < 0 || cropRect.right > width || cropRect.bottom > height) {
                    applyImageMatrix(width, height, false, false);
                }
            } else if (mAutoZoomEnabled || mZoom > 1) {
                float newZoom = 0;
                // keep the cropping window covered area to 50%-65% of zoomed sub-area
                if (mZoom < mMaxZoom && cropRect.width() < width * 0.5f && cropRect.height() < height * 0.5f) {
                    newZoom = Math.min(mMaxZoom, Math.min(width / (cropRect.width() / mZoom / 0.64f), height / (cropRect.height() / mZoom / 0.64f)));
                }
                if (mZoom > 1 && (cropRect.width() > width * 0.65f || cropRect.height() > height * 0.65f)) {
                    newZoom = Math.max(1, Math.min(width / (cropRect.width() / mZoom / 0.51f), height / (cropRect.height() / mZoom / 0.51f)));
                }
                if (!mAutoZoomEnabled) {
                    newZoom = 1;
                }

                if (newZoom > 0 && newZoom != mZoom) {
                    if (animate) {
                        if (mAnimation == null) {
                            // lazy create animation single instance
                            mAnimation = new CropImageAnimation(mImageView, mCropOverlayView);
                        }
                        // set the state for animation to start from
                        mAnimation.setStartState(mImageRect, mImageMatrix);
                    }

                    updateCropRectByZoomChange(newZoom / mZoom);
                    mZoom = newZoom;

                    applyImageMatrix(width, height, true, animate);
                }
            }
        }
    }

    /**
     * Adjust the given crop window rectangle by the change in zoom, need to update the location and size
     * of the crop rectangle to cover the same area in new zoom level.
     */
    private void updateCropRectByZoomChange(float zoomChange) {
        RectF cropRect = mCropOverlayView.getCropWindowRect();
        float xCenterOffset = getWidth() / 2 - cropRect.centerX();
        float yCenterOffset = getHeight() / 2 - cropRect.centerY();
        cropRect.offset(xCenterOffset - xCenterOffset * zoomChange, yCenterOffset - yCenterOffset * zoomChange);
        cropRect.inset((cropRect.width() - cropRect.width() * zoomChange) / 2f, (cropRect.height() - cropRect.height() * zoomChange) / 2f);
        mCropOverlayView.setCropWindowRect(cropRect);
    }

    /**
     * Apply matrix to handle the image inside the image view.
     *
     * @param width the width of the image view
     * @param height the height of the image view
     */
    private void applyImageMatrix(float width, float height, boolean center, boolean animate) {
        if (mBitmap != null && width > 0 && height > 0) {

            mImageMatrix.reset();
            mImageRect.set(0, 0, mBitmap.getWidth(), mBitmap.getHeight());

            // move the image to the center of the image view first so we can manipulate it from there
            mImageMatrix.postTranslate((width - mImageRect.width()) / 2, (height - mImageRect.height()) / 2);
            mapImageRectangleByImageMatrix(mImageRect);

            // rotate the image the required degrees from center of image
            if (mDegreesRotated > 0) {
                mImageMatrix.postRotate(mDegreesRotated, mImageRect.centerX(), mImageRect.centerY());
                mapImageRectangleByImageMatrix(mImageRect);
            }

            // scale the image to the image view, image rect transformed to know new width/height
            float scale = Math.min(width / mImageRect.width(), height / mImageRect.height());
            if (mScaleType == ScaleType.FIT_CENTER || (mScaleType == ScaleType.CENTER_INSIDE && scale < 1) || (scale > 1 && mAutoZoomEnabled)) {
                mImageMatrix.postScale(scale, scale, mImageRect.centerX(), mImageRect.centerY());
                mapImageRectangleByImageMatrix(mImageRect);
            }

            // scale by the current zoom level
            mImageMatrix.postScale(mZoom, mZoom, mImageRect.centerX(), mImageRect.centerY());
            mapImageRectangleByImageMatrix(mImageRect);

            RectF cropRect = mCropOverlayView.getCropWindowRect();

            // reset the crop window offset so we can update it to required value
            cropRect.offset(-mZoomOffsetX * mZoom, -mZoomOffsetY * mZoom);

            if (center) {
                // set the zoomed area to be as to the center of cropping window as possible
                mZoomOffsetX = width > mImageRect.width() ? 0
                        : Math.max(Math.min(width / 2 - cropRect.centerX(), -mImageRect.left), getWidth() - mImageRect.right) / mZoom;
                mZoomOffsetY = height > mImageRect.height() ? 0
                        : Math.max(Math.min(height / 2 - cropRect.centerY(), -mImageRect.top), getHeight() - mImageRect.bottom) / mZoom;
            } else {
                // adjust the zoomed area so the crop window rectangle will be inside the area in case it was moved outside
                mZoomOffsetX = Math.min(Math.max(mZoomOffsetX * mZoom, -cropRect.left), -cropRect.right + width) / mZoom;
                mZoomOffsetY = Math.min(Math.max(mZoomOffsetY * mZoom, -cropRect.top), -cropRect.bottom + height) / mZoom;
            }

            // apply to zoom offset translate and update the crop rectangle to offset correctly
            mImageMatrix.postTranslate(mZoomOffsetX * mZoom, mZoomOffsetY * mZoom);
            cropRect.offset(mZoomOffsetX * mZoom, mZoomOffsetY * mZoom);
            mCropOverlayView.setCropWindowRect(cropRect);
            mapImageRectangleByImageMatrix(mImageRect);

            // set matrix to apply
            if (animate) {
                // set the state for animation to end in, start animation now
                mAnimation.setEndState(mImageRect, mImageMatrix);
                mImageView.startAnimation(mAnimation);
            } else {
                mImageView.setImageMatrix(mImageMatrix);
            }

            // update the image rectangle in the crop overlay
            updateBitmapRect(mImageRect);
        }
    }

    /**
     * Adjust the given image rectangle by image transformation matrix to know the final rectangle of the image.<br>
     * To get the proper rectangle it must be first reset to orginal image rectangle.
     */
    private void mapImageRectangleByImageMatrix(RectF imgRect) {
        imgRect.set(0, 0, mBitmap.getWidth(), mBitmap.getHeight());
        mImageMatrix.mapRect(imgRect);
    }

    /**
     * Determines the specs for the onMeasure function. Calculates the width or height
     * depending on the mode.
     *
     * @param measureSpecMode The mode of the measured width or height.
     * @param measureSpecSize The size of the measured width or height.
     * @param desiredSize The desired size of the measured width or height.
     * @return The final size of the width or height.
     */
    private static int getOnMeasureSpec(int measureSpecMode, int measureSpecSize, int desiredSize) {

        // Measure Width
        int spec;
        if (measureSpecMode == MeasureSpec.EXACTLY) {
            // Must be this size
            spec = measureSpecSize;
        } else if (measureSpecMode == MeasureSpec.AT_MOST) {
            // Can't be bigger than...; match_parent value
            spec = Math.min(desiredSize, measureSpecSize);
        } else {
            // Be whatever you want; wrap_content
            spec = desiredSize;
        }

        return spec;
    }

    /**
     * Set visibility of crop overlay to hide it when there is no image or specificly set by client.
     */
    private void setCropOverlayVisibility() {
        if (mCropOverlayView != null) {
            mCropOverlayView.setVisibility(mShowCropOverlay && mBitmap != null ? VISIBLE : INVISIBLE);
        }
    }

    /**
     * Set visibility of progress bar when async loading/cropping is in process and show is enabled.
     */
    private void setProgressBarVisibility() {
        boolean visible = mShowProgressBar &&
                (mBitmap == null && mBitmapLoadingWorkerTask != null || mBitmapCroppingWorkerTask != null);
        mProgressBar.setVisibility(visible ? VISIBLE : INVISIBLE);
    }

    /**
     * Update the scale factor between the actual image bitmap and the shown image.<br>
     */
    private void updateBitmapRect(RectF bitmapRect) {
        if (mBitmap != null && bitmapRect.width() > 0 && bitmapRect.height() > 0) {

            // Get the scale factor between the actual Bitmap dimensions and the displayed dimensions for width/height.
            float scaleFactorWidth = mBitmap.getWidth() * mLoadedSampleSize / bitmapRect.width();
            float scaleFactorHeight = mBitmap.getHeight() * mLoadedSampleSize / bitmapRect.height();
            mCropOverlayView.setCropWindowLimits(getWidth(), getHeight(), scaleFactorWidth, scaleFactorHeight);
        }

        // set the bitmap rectangle and update the crop window after scale factor is set
        mCropOverlayView.setBitmapRect(bitmapRect, getWidth(), getHeight());
    }
    //endregion

    //region: Inner class: CropShape

    /**
     * The possible cropping area shape.
     */
    public enum CropShape {
        RECTANGLE,
        OVAL
    }
    //endregion

    //region: Inner class: ScaleType

    /**
     * Options for scaling the bounds of cropping image to the bounds of Crop Image View.<br>
     * Note: Some options are affected by auto-zoom, if enabled.
     */
    public enum ScaleType {

        /**
         * Scale the image uniformly (maintain the image's aspect ratio) to fit in crop image view.<br>
         * The largest dimension will be equals to crop image viee and the second dimension will be smaller.
         */
        FIT_CENTER,

        /**
         * Center the image in the view, but perform no scaling.<br>
         * Note: If auto-zoom is enabled and the source image is smaller than crop image view then it will be
         * scaled uniformly to fit the crop image view.
         */
        CENTER,

        /**
         * Scale the image uniformly (maintain the image's aspect ratio) so that both
         * dimensions (width and height) of the image will be equal to or <b>larger</b> than the
         * corresponding dimension of the view (minus padding).<br>
         * The image is then centered in the view.
         */
        CENTER_CROP,

        /**
         * Scale the image uniformly (maintain the image's aspect ratio) so that both
         * dimensions (width and height) of the image will be equal to or <b>less</b> than the
         * corresponding dimension of the view (minus padding).<br>
         * The image is then centered in the view.<br>
         * Note: If auto-zoom is enabled and the source image is smaller than crop image view then it will be
         * scaled uniformly to fit the crop image view.
         */
        CENTER_INSIDE
    }
    //endregion

    //region: Inner class: Guidelines

    /**
     * The possible guidelines showing types.
     */
    public enum Guidelines {
        /**
         * Never show
         */
        OFF,

        /**
         * Show when crop move action is live
         */
        ON_TOUCH,

        /**
         * Always show
         */
        ON
    }
    //endregion

    //region: Inner class: OnSetImageUriCompleteListener

    /**
     * Interface definition for a callback to be invoked when image async loading is complete.
     */
    public interface OnSetImageUriCompleteListener {

        /**
         * Called when a crop image view has completed loading image for cropping.<br>
         * If loading failed error parameter will contain the error.
         *
         * @param view The crop image view that loading of image was complete.
         * @param uri the URI of the image that was loading
         * @param error if error occurred during loading will contain the error, otherwise null.
         */
        void onSetImageUriComplete(CropImageView view, Uri uri, Exception error);
    }
    //endregion

    //region: Inner class: OnGetCroppedImageCompleteListener

    /**
     * Interface definition for a callback to be invoked when image async cropping is complete.
     */
    public interface OnGetCroppedImageCompleteListener {

        /**
         * Called when a crop image view has completed cropping image.<br>
         * If cropping failed error parameter will contain the error.
         *
         * @param view The crop image view that cropping of image was complete.
         * @param bitmap the cropped image bitmap (null if failed)
         * @param error if error occurred during cropping will contain the error, otherwise null.
         */
        void onGetCroppedImageComplete(CropImageView view, Bitmap bitmap, Exception error);
    }
    //endregion

    //region: Inner class: OnSaveCroppedImageCompleteListener

    /**
     * Interface definition for a callback to be invoked when image async cropping is complete.
     */
    public interface OnSaveCroppedImageCompleteListener {

        /**
         * Called when a crop image view has completed cropping image.<br>
         * If cropping failed error parameter will contain the error.
         *
         * @param view The crop image view that cropping of image was complete.
         * @param uri the cropped image uri (null if failed)
         * @param error if error occurred during cropping will contain the error, otherwise null.
         */
        void onSaveCroppedImageComplete(CropImageView view, Uri uri, Exception error);
    }
    //endregion
}

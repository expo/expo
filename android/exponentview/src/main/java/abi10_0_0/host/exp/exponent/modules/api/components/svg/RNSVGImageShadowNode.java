/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi10_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Region;
import android.net.Uri;
import android.util.Log;

import com.facebook.common.executors.UiThreadImmediateExecutorService;
import com.facebook.common.logging.FLog;
import com.facebook.common.references.CloseableReference;
import com.facebook.datasource.DataSource;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.datasource.BaseBitmapDataSubscriber;
import com.facebook.imagepipeline.image.CloseableBitmap;
import com.facebook.imagepipeline.image.CloseableImage;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import abi10_0_0.com.facebook.react.bridge.ReadableMap;
import abi10_0_0.com.facebook.react.common.ReactConstants;
import abi10_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.concurrent.atomic.AtomicBoolean;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

/**
 * Shadow node for virtual RNSVGPath view
 */
public class RNSVGImageShadowNode extends RNSVGPathShadowNode {

    private String mX;
    private String mY;
    private String mW;
    private String mH;
    private Uri mUri;
    private float mImageRatio;
    private String mAlign;
    private int mMeetOrSlice;
    private AtomicBoolean mLoading = new AtomicBoolean(false);

    @ReactProp(name = "x")
    public void setX(String x) {
        mX = x;
        markUpdated();
    }

    @ReactProp(name = "y")
    public void setY(String y) {
        mY = y;
        markUpdated();
    }

    @ReactProp(name = "width")
    public void setWidth(String width) {
        mW = width;
        markUpdated();
    }

    @ReactProp(name = "height")
    public void seHeight(String height) {
        mH = height;
        markUpdated();
    }

    @ReactProp(name = "src")
    public void setSrc(@Nullable ReadableMap src) {
        if (src != null) {
            String uriString = src.getString("uri");

            if (uriString == null || uriString.isEmpty()) {
                //TODO: give warning about this
                return;
            }

            mImageRatio = (float)src.getInt("width") / (float)src.getInt("height");
            mUri = Uri.parse(uriString);
        }
    }


    @ReactProp(name = "align")
    public void setAlign(String align) {
        mAlign = align;
        markUpdated();
    }

    @ReactProp(name = "meetOrSlice")
    public void setMeetOrSlice(int meetOrSlice) {
        mMeetOrSlice = meetOrSlice;
        markUpdated();
    }

    @Override
    public void draw(final Canvas canvas, final Paint paint, final float opacity) {
        mPath = new Path();
        mPath.addRect(new RectF(getRect()), Path.Direction.CW);

        if (!mLoading.get()) {
            final ImageRequest request = ImageRequestBuilder.newBuilderWithSource(mUri).build();

            if (Fresco.getImagePipeline().isInBitmapMemoryCache(request)) {
                tryRender(request, canvas, paint, opacity * mOpacity);
            } else {
                loadBitmap(request, canvas, paint);
            }
        }
    }

    private void loadBitmap(@Nonnull final ImageRequest request, @Nonnull final Canvas canvas, @Nonnull final Paint paint) {
        final DataSource<CloseableReference<CloseableImage>> dataSource
            = Fresco.getImagePipeline().fetchDecodedImage(request, getThemedContext());

        dataSource.subscribe(new BaseBitmapDataSubscriber() {
                                 @Override
                                 public void onNewResultImpl(@Nullable Bitmap bitmap) {
                                     if (bitmap != null) {
                                         canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
                                         paint.reset();
                                         mLoading.set(false);

                                         RNSVGSvgViewShadowNode svgShadowNode = getSvgShadowNode();
                                         svgShadowNode.drawChildren(canvas, paint);
                                         svgShadowNode.invalidateView();
                                     }
                                 }

                                 @Override
                                 public void onFailureImpl(DataSource dataSource) {
                                     // No cleanup required here.
                                     // TODO: more details about this failure
                                     mLoading.set(false);
                                     FLog.w(ReactConstants.TAG, dataSource.getFailureCause(), "RNSVG: fetchDecodedImage failed!");
                                 }
                             },
            UiThreadImmediateExecutorService.getInstance()
        );
    }

    @Nonnull
    private Rect getRect() {
        float x = PropHelper.fromPercentageToFloat(mX, mCanvasWidth, 0, mScale);
        float y = PropHelper.fromPercentageToFloat(mY, mCanvasHeight, 0, mScale);
        float w = PropHelper.fromPercentageToFloat(mW, mCanvasWidth, 0, mScale);
        float h = PropHelper.fromPercentageToFloat(mH, mCanvasHeight, 0, mScale);

        return new Rect((int) x, (int) y, (int) (x + w), (int) (y + h));
    }

    private void doRender(@Nonnull final Canvas canvas, @Nonnull final Paint paint, @Nonnull final Bitmap bitmap, final float opacity) {
        final int count = saveAndSetupCanvas(canvas);
        canvas.concat(mMatrix);

        Paint alphaPaint = new Paint();
        alphaPaint.setAlpha((int) (opacity * 255));

        // apply viewBox transform on Image render.
        Rect rect = getRect();
        float rectWidth = (float)rect.width();
        float rectHeight = (float)rect.height();
        float rectX = (float)rect.left;
        float rectY = (float)rect.top;
        float rectRatio = rectWidth / rectHeight;
        RectF renderRect;

        if (mImageRatio == rectRatio) {
            renderRect = new RectF(rect);
        } else if (mImageRatio < rectRatio) {
            renderRect = new RectF(0, 0, (int)(rectHeight * mImageRatio), (int)rectHeight);
        } else {
            renderRect = new RectF(0, 0, (int)rectWidth, (int)(rectWidth / mImageRatio));
        }

        RNSVGViewBoxShadowNode viewBox = new RNSVGViewBoxShadowNode();
        viewBox.setMinX("0");
        viewBox.setMinY("0");
        viewBox.setVbWidth(renderRect.width() / mScale + "");
        viewBox.setVbHeight(renderRect.height() / mScale + "");
        viewBox.setWidth(rectWidth / mScale);
        viewBox.setHeight(rectHeight / mScale);
        viewBox.setAlign(mAlign);
        viewBox.setMeetOrSlice(mMeetOrSlice);
        viewBox.setupDimensions(new Rect(0, 0, (int) rectWidth, (int) rectHeight));
        Matrix transform = viewBox.getTransform();

        transform.mapRect(renderRect);
        Matrix translation = new Matrix();
        translation.postTranslate(rectX, rectY);
        translation.mapRect(renderRect);

        Path clip = new Path();

        Path clipPath = getClipPath(canvas, paint);

        if (clipPath != null) {
            // clip by the common area of clipPath and mPath
            clip.setFillType(Path.FillType.INVERSE_EVEN_ODD);

            Path inverseWindingPath = new Path();
            inverseWindingPath.setFillType(Path.FillType.INVERSE_WINDING);
            inverseWindingPath.addPath(mPath);
            inverseWindingPath.addPath(clipPath);

            Path evenOddPath = new Path();
            evenOddPath.setFillType(Path.FillType.EVEN_ODD);
            evenOddPath.addPath(mPath);
            evenOddPath.addPath(clipPath);

            canvas.clipPath(evenOddPath, Region.Op.DIFFERENCE);
            canvas.clipPath(inverseWindingPath, Region.Op.DIFFERENCE);
        } else {
            canvas.clipPath(mPath, Region.Op.REPLACE);
        }

        canvas.drawBitmap(bitmap, null, renderRect, alphaPaint);
        restoreCanvas(canvas, count);
        markUpdateSeen();
    }

    private void tryRender(@Nonnull final ImageRequest request, @Nonnull final Canvas canvas, @Nonnull final Paint paint, final float opacity) {
        final DataSource<CloseableReference<CloseableImage>> dataSource
            = Fresco.getImagePipeline().fetchImageFromBitmapCache(request, getThemedContext());

        try {
            final CloseableReference<CloseableImage> imageReference = dataSource.getResult();
            if (imageReference != null) {
                try {
                    if (imageReference.get() instanceof CloseableBitmap) {
                        final Bitmap bitmap = ((CloseableBitmap) imageReference.get()).getUnderlyingBitmap();

                        if (bitmap != null) {
                            doRender(canvas, paint, bitmap, opacity);
                        }
                    }
                } finally {
                    CloseableReference.closeSafely(imageReference);
                }
            }
        } finally {
            dataSource.close();
        }
    }
}

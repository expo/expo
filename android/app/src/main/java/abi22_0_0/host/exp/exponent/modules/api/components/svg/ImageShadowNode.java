/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi22_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Region;
import android.net.Uri;

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
import abi22_0_0.com.facebook.react.bridge.ReadableMap;
import abi22_0_0.com.facebook.react.common.ReactConstants;
import abi22_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.concurrent.atomic.AtomicBoolean;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

/**
 * Shadow node for virtual Image view
 */
public class ImageShadowNode extends RenderableShadowNode {

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

            if (src.hasKey("width") && src.hasKey("height")) {
                mImageRatio = (float)src.getInt("width") / (float)src.getInt("height");
            } else {
                mImageRatio = 0f;
            }
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
        if (!mLoading.get()) {
            final ImageRequest request = ImageRequestBuilder.newBuilderWithSource(mUri).build();
            if (Fresco.getImagePipeline().isInBitmapMemoryCache(request)) {
                tryRender(request, canvas, paint, opacity * mOpacity);
            } else {
                loadBitmap(request);
            }
        }
    }

    @Override
    protected Path getPath(Canvas canvas, Paint paint) {
        Path path = new Path();
        path.addRect(new RectF(getRect()), Path.Direction.CW);
        return path;
    }

    private void loadBitmap(ImageRequest request) {
        final DataSource<CloseableReference<CloseableImage>> dataSource
            = Fresco.getImagePipeline().fetchDecodedImage(request, getThemedContext());

        dataSource.subscribe(new BaseBitmapDataSubscriber() {
                                 @Override
                                 public void onNewResultImpl(Bitmap bitmap) {
                                     mLoading.set(false);
                                     SvgViewShadowNode shadowNode = getSvgShadowNode();
                                     shadowNode.markUpdated();
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
        float x = relativeOnWidth(mX);
        float y = relativeOnHeight(mY);
        float w = relativeOnWidth(mW);
        float h = relativeOnHeight(mH);

        return new Rect((int) x, (int) y, (int) (x + w), (int) (y + h));
    }

    private void doRender(Canvas canvas, Paint paint, Bitmap bitmap, float opacity) {
        // apply viewBox transform on Image render.
        Rect rect = getRect();
        float rectWidth = (float)rect.width();
        float rectHeight = (float)rect.height();
        float rectX = (float)rect.left;
        float rectY = (float)rect.top;
        float rectRatio = rectWidth / rectHeight;
        RectF renderRect;

        if (mImageRatio == 0f || mImageRatio == rectRatio) {
            renderRect = new RectF(rect);
        } else if (mImageRatio < rectRatio) {
            renderRect = new RectF(0, 0, (int)(rectHeight * mImageRatio), (int)rectHeight);
        } else {
            renderRect = new RectF(0, 0, (int)rectWidth, (int)(rectWidth / mImageRatio));
        }

        RectF vbRect = new RectF(0, 0, renderRect.width() / mScale, renderRect.height() / mScale);
        RectF eRect = new RectF(getCanvasLeft(), getCanvasTop(), rectWidth / mScale + getCanvasLeft(), rectHeight / mScale + getCanvasTop());
        Matrix transform = ViewBox.getTransform(vbRect, eRect, mAlign, mMeetOrSlice, false);

        transform.mapRect(renderRect);
        Matrix translation = new Matrix();
        translation.postTranslate(rectX, rectY);
        translation.mapRect(renderRect);

        Path clip = new Path();

        Path clipPath = getClipPath(canvas, paint);
        Path path = getPath(canvas, paint);
        if (clipPath != null) {
            // clip by the common area of clipPath and mPath
            clip.setFillType(Path.FillType.INVERSE_EVEN_ODD);

            Path inverseWindingPath = new Path();
            inverseWindingPath.setFillType(Path.FillType.INVERSE_WINDING);
            inverseWindingPath.addPath(path);
            inverseWindingPath.addPath(clipPath);

            Path evenOddPath = new Path();
            evenOddPath.setFillType(Path.FillType.EVEN_ODD);
            evenOddPath.addPath(path);
            evenOddPath.addPath(clipPath);

            canvas.clipPath(evenOddPath, Region.Op.DIFFERENCE);
            canvas.clipPath(inverseWindingPath, Region.Op.DIFFERENCE);
        } else {
            canvas.clipPath(path, Region.Op.REPLACE);
        }

        Paint alphaPaint = new Paint();
        alphaPaint.setAlpha((int) (opacity * 255));
        canvas.drawBitmap(bitmap, null, renderRect, alphaPaint);
    }

    private void tryRender(ImageRequest request, Canvas canvas, Paint paint, float opacity) {
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
                } catch (Exception e) {
                    throw new IllegalStateException(e);
                } finally {
                    CloseableReference.closeSafely(imageReference);
                }
            }
        } catch (Exception e) {
            throw new IllegalStateException(e);
        } finally {
            dataSource.close();
        }
    }
}

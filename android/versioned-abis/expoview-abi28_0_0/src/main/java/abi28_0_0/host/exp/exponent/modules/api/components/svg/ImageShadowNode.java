/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi28_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
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
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.common.ReactConstants;
import abi28_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi28_0_0.com.facebook.react.views.imagehelper.ResourceDrawableIdHelper;

import java.util.concurrent.atomic.AtomicBoolean;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

import abi28_0_0.com.facebook.react.bridge.ReadableArray;

/**
 * Shadow node for virtual Image view
 */
class ImageShadowNode extends RenderableShadowNode {

    private String mX;
    private String mY;
    private String mW;
    private String mH;
    private Uri mUri;
    private int mImageWidth;
    private int mImageHeight;
    private String mAlign;
    private int mMeetOrSlice;
    private final AtomicBoolean mLoading = new AtomicBoolean(false);

    private static final float[] sRawMatrix = new float[]{
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    };
    private Matrix mMatrix = null;

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
                mImageWidth = src.getInt("width");
                mImageHeight = src.getInt("height");
            } else {
                mImageWidth = 0;
                mImageHeight = 0;
            }
            mUri = Uri.parse(uriString);
            if (mUri.getScheme() == null) {
                mUri = ResourceDrawableIdHelper.getInstance().getResourceDrawableUri(getThemedContext(), uriString);
            }
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

    @ReactProp(name = "matrix")
    public void setMatrix(@Nullable ReadableArray matrixArray) {
        if (matrixArray != null) {
            int matrixSize = PropHelper.toMatrixData(matrixArray, sRawMatrix, mScale);
            if (matrixSize == 6) {
                if (mMatrix == null) {
                    mMatrix = new Matrix();
                }
                mMatrix.setValues(sRawMatrix);
            } else if (matrixSize != -1) {
                FLog.w(ReactConstants.TAG, "RNSVG: Transform matrices must be of size 6");
            }
        } else {
            mMatrix = null;
        }

        markUpdated();
    }


    @Override
    public void draw(final Canvas canvas, final Paint paint, final float opacity) {
        if (!mLoading.get()) {
            final ImageRequest request = ImageRequestBuilder.newBuilderWithSource(mUri).build();
            if (Fresco.getImagePipeline().isInBitmapMemoryCache(request)) {
                tryRender(request, canvas, paint, opacity * mOpacity);
            } else {
                loadBitmap(request, canvas, paint, opacity * mOpacity);
            }
        }
    }

    @Override
    protected Path getPath(Canvas canvas, Paint paint) {
        Path path = new Path();
        path.addRect(getRect(), Path.Direction.CW);
        return path;
    }

    private void loadBitmap(ImageRequest request, final Canvas canvas, final Paint paint, final float opacity) {
        final DataSource<CloseableReference<CloseableImage>> dataSource
            = Fresco.getImagePipeline().fetchDecodedImage(request, getThemedContext());
        dataSource.subscribe(new BaseBitmapDataSubscriber() {
                                 @Override
                                 public void onNewResultImpl(Bitmap bitmap) {
                                     mLoading.set(false);
                                     bitmapTryRender(bitmap, canvas, paint, opacity * mOpacity);
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
    private RectF getRect() {
        double x = relativeOnWidth(mX);
        double y = relativeOnHeight(mY);
        double w = relativeOnWidth(mW);
        double h = relativeOnHeight(mH);
        if (w == 0) {
            w = mImageWidth * mScale;
        }
        if (h == 0) {
            h = mImageHeight * mScale;
        }

        return new RectF((float)x, (float)y, (float)(x + w), (float)(y + h));
    }

    private void doRender(Canvas canvas, Paint paint, Bitmap bitmap, float opacity) {
        if (mImageWidth == 0 || mImageHeight == 0) {
            mImageWidth = bitmap.getWidth();
            mImageHeight = bitmap.getHeight();
        }

        RectF renderRect = getRect();
        RectF vbRect = new RectF(0, 0, mImageWidth, mImageHeight);
        Matrix transform = ViewBox.getTransform(vbRect, renderRect, mAlign, mMeetOrSlice);
        transform.mapRect(vbRect);

        if (mMatrix != null) {
            mMatrix.mapRect(vbRect);
        }

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
        canvas.drawBitmap(bitmap, null, vbRect, alphaPaint);
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

    private void bitmapTryRender(Bitmap bitmap, Canvas canvas, Paint paint, float opacity) {
        try {
            if (bitmap != null) {
                doRender(canvas, paint, bitmap, opacity);
            }
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}

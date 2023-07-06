package com.shopify.reactnative.skia;

import static android.view.View.VISIBLE;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.PixelCopy;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerModule;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;


public class ViewScreenshotService {
    private static final long SURFACE_VIEW_READ_PIXELS_TIMEOUT = 5;
    private static final String TAG = "SkiaScreenshot";

    public static Bitmap makeViewScreenshotFromTag(ReactContext context, int tag) {
        UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
        View view = uiManager.resolveView(tag);
        if (view == null) {
            throw new RuntimeException("Could not resolve view from view tag " + tag);
        }

        // Measure and get size of view
        int width = view.getWidth();
        int height = view.getHeight();

        if (width <= 0 || height <= 0) {
            return null;
        }

        // The following code is taken from react-native-view-shot to be able to handle and
        // correctly render all kinds of views, also including TextureViews and SurfaceViews
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);

        final Paint paint = new Paint();
        paint.setAntiAlias(true);
        paint.setFilterBitmap(true);
        paint.setDither(true);

        // Render the main view and its children
        final Canvas canvas = new Canvas(bitmap);

        // Renders view with child views to canvas
        renderViewToCanvas(canvas, view, paint);

        return bitmap;
    }

    private static void renderViewToCanvas(Canvas canvas, View view, Paint paint) {
        // Apply transformations for the current view
        canvas.save();
        applyTransformations(canvas, view);

        // Draw children if the view has children
        if ((view instanceof ViewGroup)) {
            // Draw children
            ViewGroup group = (ViewGroup) view;

            // Hide visible children - this needs to be done because view.draw(canvas)
            // will render all visible non-texture/surface views directly - causing
            // views to be rendered twice - once by view.draw() and once when we
            // enumerate children. We therefore need to turn off rendering of visible
            // children before we call view.draw:
            List<View> visibleChildren = new ArrayList<>();
            for (int i = 0; i < group.getChildCount(); i++) {
                View child = group.getChildAt(i);
                if (child.getVisibility() == VISIBLE) {
                    visibleChildren.add(child);
                    child.setVisibility(View.INVISIBLE);
                }
            }

            // Draw ourselves
            view.draw(canvas);

            // Enable children again
            for (int i = 0; i < visibleChildren.size(); i++) {
                View child = visibleChildren.get(i);
                child.setVisibility(VISIBLE);
            }

            // Draw children
            for (int i = 0; i < group.getChildCount(); i++) {
                View child = group.getChildAt(i);

                // skip all invisible to user child views
                if (child.getVisibility() != VISIBLE) continue;

                // skip any child that we don't know how to process
                if (child instanceof TextureView) {
                    final TextureView tvChild = (TextureView) child;
                    tvChild.setOpaque(false); // <-- switch off background fill

                    canvas.save();
                    applyTransformations(canvas, child);

                    // TextureView should use bitmaps with matching size,
                    // otherwise content of the TextureView will be scaled to provided bitmap dimensions
                    final Bitmap childBitmapBuffer = tvChild.getBitmap(Bitmap.createBitmap(child.getWidth(), child.getHeight(), Bitmap.Config.ARGB_8888));
                    canvas.drawBitmap(childBitmapBuffer, 0, 0, paint);

                    canvas.restore();

                } else if (child instanceof SurfaceView) {
                    final SurfaceView svChild = (SurfaceView) child;
                    final CountDownLatch latch = new CountDownLatch(1);

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        final Bitmap childBitmapBuffer = Bitmap.createBitmap(child.getWidth(), child.getHeight(), Bitmap.Config.ARGB_8888);
                        try {
                            PixelCopy.request(svChild, childBitmapBuffer, copyResult -> {
                                canvas.save();
                                applyTransformations(canvas, child);
                                canvas.drawBitmap(childBitmapBuffer, 0, 0, paint);
                                canvas.restore();
                                latch.countDown();
                            }, new Handler(Looper.getMainLooper()));
                            latch.await(SURFACE_VIEW_READ_PIXELS_TIMEOUT, TimeUnit.SECONDS);
                        } catch (Exception e) {
                            Log.e(TAG, "Cannot PixelCopy for " + svChild, e);
                        }
                    } else {
                        Bitmap cache = svChild.getDrawingCache();
                        if (cache != null) {
                            canvas.save();
                            applyTransformations(canvas, child);
                            canvas.drawBitmap(svChild.getDrawingCache(), 0, 0, paint);
                            canvas.restore();
                        }
                    }
                } else {
                    // Regular views needs to be rendered again to ensure correct z-index
                    // order with texture views and surface views.
                    renderViewToCanvas(canvas, child, paint);
                }
            }
        } else {
            // Draw ourselves
            view.draw(canvas);
        }

        // Restore canvas
        canvas.restore();
    }

    @NonNull
    private static void applyTransformations(final Canvas c, @NonNull final View view) {
        // Get the transformation matrix of the view
        final Matrix matrix = view.getMatrix();

        // Create a new matrix for translation
        final Matrix translateMatrix = new Matrix();
        final float dx = view.getLeft() + view.getPaddingLeft() + view.getTranslationX();
        final float dy = view.getTop() + view.getPaddingTop() + view.getTranslationY();
        translateMatrix.setTranslate(dx, dy);

        // Pre-concatenate the current matrix of the canvas with the translation and transformation matrices of the view
        c.concat(translateMatrix);
        c.concat(matrix);
    }
}

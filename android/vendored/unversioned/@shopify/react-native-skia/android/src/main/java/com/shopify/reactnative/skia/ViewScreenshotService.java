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
        final Canvas c = new Canvas(bitmap);
        view.draw(c);

        // Enumerate children
        final List<View> childrenList = getAllChildren(view);

        for (final View child : childrenList) {
            // skip any child that we don't know how to process
            if (child instanceof TextureView) {
                // skip all invisible to user child views
                if (child.getVisibility() != VISIBLE) continue;

                final TextureView tvChild = (TextureView) child;
                tvChild.setOpaque(false); // <-- switch off background fill

                // TextureView should use bitmaps with matching size,
                // otherwise content of the TextureView will be scaled to provided bitmap dimensions
                final Bitmap childBitmapBuffer = tvChild.getBitmap(Bitmap.createBitmap(child.getWidth(), child.getHeight(), Bitmap.Config.ARGB_8888));

                final int countCanvasSave = c.save();
                applyTransformations(c, view, child);

                // due to re-use of bitmaps for screenshot, we can get bitmap that is bigger in size than requested
                c.drawBitmap(childBitmapBuffer, 0, 0, paint);

                c.restoreToCount(countCanvasSave);
            } else if (child instanceof SurfaceView) {
                final SurfaceView svChild = (SurfaceView)child;
                final CountDownLatch latch = new CountDownLatch(1);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    final Bitmap childBitmapBuffer = Bitmap.createBitmap(child.getWidth(), child.getHeight(), Bitmap.Config.ARGB_8888);
                    try {
                        PixelCopy.request(svChild, childBitmapBuffer, new PixelCopy.OnPixelCopyFinishedListener() {
                            @Override
                            public void onPixelCopyFinished(int copyResult) {
                                final int countCanvasSave = c.save();
                                applyTransformations(c, view, child);
                                c.drawBitmap(childBitmapBuffer, 0, 0, paint);
                                c.restoreToCount(countCanvasSave);
                                latch.countDown();
                            }
                        }, new Handler(Looper.getMainLooper()));
                        latch.await(SURFACE_VIEW_READ_PIXELS_TIMEOUT, TimeUnit.SECONDS);
                    } catch (Exception e) {
                        Log.e(TAG, "Cannot PixelCopy for " + svChild, e);
                    }
                } else {
                    Bitmap cache = svChild.getDrawingCache();
                    if (cache != null) {
                        c.drawBitmap(svChild.getDrawingCache(), 0, 0, paint);
                    }
                }
            }
        }

        return bitmap;
    }

    private static List<View> getAllChildren(@NonNull final View v) {
        if (!(v instanceof ViewGroup)) {
            final ArrayList<View> viewArrayList = new ArrayList<>();
            viewArrayList.add(v);

            return viewArrayList;
        }

        final ArrayList<View> result = new ArrayList<>();

        ViewGroup viewGroup = (ViewGroup) v;
        for (int i = 0; i < viewGroup.getChildCount(); i++) {
            View child = viewGroup.getChildAt(i);

            //Do not add any parents, just add child elements
            result.addAll(getAllChildren(child));
        }

        return result;
    }

    /**
     * Concat all the transformation matrix's from parent to child.
     */
    @NonNull
    @SuppressWarnings("UnusedReturnValue")
    private static Matrix applyTransformations(final Canvas c, @NonNull final View root, @NonNull final View child) {
        final Matrix transform = new Matrix();
        final LinkedList<View> ms = new LinkedList<>();

        // find all parents of the child view
        View iterator = child;
        do {
            ms.add(iterator);

            iterator = (View) iterator.getParent();
        } while (iterator != root);

        // apply transformations from parent --> child order
        Collections.reverse(ms);

        for (final View v : ms) {
            c.save();

            // apply each view transformations, so each child will be affected by them
            final float dx = v.getLeft() + ((v != child) ? v.getPaddingLeft() : 0) + v.getTranslationX();
            final float dy = v.getTop() + ((v != child) ? v.getPaddingTop() : 0) + v.getTranslationY();
            c.translate(dx, dy);
            c.rotate(v.getRotation(), v.getPivotX(), v.getPivotY());
            c.scale(v.getScaleX(), v.getScaleY());

            // compute the matrix just for any future use
            transform.postTranslate(dx, dy);
            transform.postRotate(v.getRotation(), v.getPivotX(), v.getPivotY());
            transform.postScale(v.getScaleX(), v.getScaleY());
        }

        return transform;
    }

}

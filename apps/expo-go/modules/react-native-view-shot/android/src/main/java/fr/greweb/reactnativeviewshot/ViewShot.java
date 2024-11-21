package fr.greweb.reactnativeviewshot;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Point;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import androidx.annotation.IntDef;
import androidx.annotation.NonNull;
import androidx.annotation.StringDef;

import android.os.Looper;
import android.util.Base64;
import android.util.Log;
import android.view.PixelCopy;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ScrollView;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.fabric.interop.UIBlockViewResolver;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIBlock;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.WeakHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.zip.Deflater;

import javax.annotation.Nullable;

import static android.view.View.VISIBLE;

/**
 * Snapshot utility class allow to screenshot a view.
 */
public class ViewShot implements UIBlock, com.facebook.react.fabric.interop.UIBlock {
    //region Constants
    /**
     * Tag fort Class logs.
     */
    private static final String TAG = ViewShot.class.getSimpleName();
    /**
     * Error code that we return to RN.
     */
    public static final String ERROR_UNABLE_TO_SNAPSHOT = "E_UNABLE_TO_SNAPSHOT";
    /**
     * pre-allocated output stream size for screenshot. In real life example it will eb around 7Mb.
     */
    private static final int PREALLOCATE_SIZE = 64 * 1024;
    /**
     * ARGB size in bytes.
     */
    private static final int ARGB_SIZE = 4;
    /**
     * Wait timeout for surface view capture.
     */
    private static final int SURFACE_VIEW_READ_PIXELS_TIMEOUT = 5;

    @SuppressWarnings("WeakerAccess")
    @IntDef({Formats.JPEG, Formats.PNG, Formats.WEBP, Formats.RAW})
    public @interface Formats {
        int JPEG = 0; // Bitmap.CompressFormat.JPEG.ordinal();
        int PNG = 1;  // Bitmap.CompressFormat.PNG.ordinal();
        int WEBP = 2; // Bitmap.CompressFormat.WEBP.ordinal();
        int RAW = -1;

        Bitmap.CompressFormat[] mapping = {
                Bitmap.CompressFormat.JPEG,
                Bitmap.CompressFormat.PNG,
                Bitmap.CompressFormat.WEBP
        };
    }

    /**
     * Supported Output results.
     */
    @StringDef({Results.BASE_64, Results.DATA_URI, Results.TEMP_FILE, Results.ZIP_BASE_64})
    public @interface Results {
        /**
         * Save screenshot as temp file on device.
         */
        String TEMP_FILE = "tmpfile";
        /**
         * Base 64 encoded image.
         */
        String BASE_64 = "base64";
        /**
         * Zipped RAW image in base 64 encoding.
         */
        String ZIP_BASE_64 = "zip-base64";
        /**
         * Base64 data uri.
         */
        String DATA_URI = "data-uri";
    }
    //endregion

    //region Static members
    /**
     * Image output buffer used as a source for base64 encoding
     */
    private static byte[] outputBuffer = new byte[PREALLOCATE_SIZE];
    //endregion

    //region Class members
    private final int tag;
    private final String extension;
    @Formats
    private final int format;
    private final double quality;
    private final Integer width;
    private final Integer height;
    private final File output;
    @Results
    private final String result;
    private final Promise promise;
    private final Boolean snapshotContentContainer;
    @SuppressWarnings({"unused", "FieldCanBeLocal"})
    private final ReactApplicationContext reactContext;
    private final boolean handleGLSurfaceView;
    private final Activity currentActivity;
    private final Executor executor;
    //endregion

    //region Constructors
    @SuppressWarnings("WeakerAccess")
    public ViewShot(
            final int tag,
            final String extension,
            @Formats final int format,
            final double quality,
            @Nullable Integer width,
            @Nullable Integer height,
            final File output,
            @Results final String result,
            final Boolean snapshotContentContainer,
            final ReactApplicationContext reactContext,
            final Activity currentActivity,
            final boolean handleGLSurfaceView,
            final Promise promise,
            final Executor executor) {
        this.tag = tag;
        this.extension = extension;
        this.format = format;
        this.quality = quality;
        this.width = width;
        this.height = height;
        this.output = output;
        this.result = result;
        this.snapshotContentContainer = snapshotContentContainer;
        this.reactContext = reactContext;
        this.currentActivity = currentActivity;
        this.handleGLSurfaceView = handleGLSurfaceView;
        this.promise = promise;
        this.executor = executor;
    }
    //endregion

    //region Overrides
    @Override
    public void execute(final NativeViewHierarchyManager nativeViewHierarchyManager) {
        executeImpl(nativeViewHierarchyManager, null);
    }

    @Override
    public void execute(@NonNull UIBlockViewResolver uiBlockViewResolver) {
        executeImpl(null, uiBlockViewResolver);
    }
    //endregion

    //region Implementation
    private void executeImpl(final NativeViewHierarchyManager nativeViewHierarchyManager, final UIBlockViewResolver uiBlockViewResolver) {
        executor.execute(new Runnable () {
            @Override
            public void run() {
                try {
                    final View view;

                    if (tag == -1) {
                        view = currentActivity.getWindow().getDecorView().findViewById(android.R.id.content);
                    } else if (uiBlockViewResolver != null) {
                        view = uiBlockViewResolver.resolveView(tag);
                    } else {
                        view = nativeViewHierarchyManager.resolveView(tag);
                    }

                    if (view == null) {
                        Log.e(TAG, "No view found with reactTag: " + tag, new AssertionError());
                        promise.reject(ERROR_UNABLE_TO_SNAPSHOT, "No view found with reactTag: " + tag);
                        return;
                    }

                    final ReusableByteArrayOutputStream stream = new ReusableByteArrayOutputStream(outputBuffer);
                    stream.setSize(proposeSize(view));
                    outputBuffer = stream.innerBuffer();

                    if (Results.TEMP_FILE.equals(result) && Formats.RAW == format) {
                        saveToRawFileOnDevice(view);
                    } else if (Results.TEMP_FILE.equals(result) && Formats.RAW != format) {
                        saveToTempFileOnDevice(view);
                    } else if (Results.BASE_64.equals(result) || Results.ZIP_BASE_64.equals(result)) {
                        saveToBase64String(view);
                    } else if (Results.DATA_URI.equals(result)) {
                        saveToDataUriString(view);
                    }
                } catch (final Throwable ex) {
                    Log.e(TAG, "Failed to capture view snapshot", ex);
                    promise.reject(ERROR_UNABLE_TO_SNAPSHOT, "Failed to capture view snapshot");
                }
            }
        });
    }

    private void saveToTempFileOnDevice(@NonNull final View view) throws IOException {
        final FileOutputStream fos = new FileOutputStream(output);
        captureView(view, fos);

        promise.resolve(Uri.fromFile(output).toString());
    }

    private void saveToRawFileOnDevice(@NonNull final View view) throws IOException {
        final String uri = Uri.fromFile(output).toString();

        final FileOutputStream fos = new FileOutputStream(output);
        final ReusableByteArrayOutputStream os = new ReusableByteArrayOutputStream(outputBuffer);
        final Point size = captureView(view, os);

        // in case of buffer grow that will be a new array with bigger size
        outputBuffer = os.innerBuffer();
        final int length = os.size();
        final String resolution = String.format(Locale.US, "%d:%d|", size.x, size.y);

        fos.write(resolution.getBytes(Charset.forName("US-ASCII")));
        fos.write(outputBuffer, 0, length);
        fos.close();

        promise.resolve(uri);
    }

    private void saveToDataUriString(@NonNull final View view) throws IOException {
        final ReusableByteArrayOutputStream os = new ReusableByteArrayOutputStream(outputBuffer);
        captureView(view, os);

        outputBuffer = os.innerBuffer();
        final int length = os.size();

        final String data = Base64.encodeToString(outputBuffer, 0, length, Base64.NO_WRAP);

        // correct the extension if JPG
        final String imageFormat = "jpg".equals(extension) ? "jpeg" : extension;

        promise.resolve("data:image/" + imageFormat + ";base64," + data);
    }

    private void saveToBase64String(@NonNull final View view) throws IOException {
        final boolean isRaw = Formats.RAW == this.format;
        final boolean isZippedBase64 = Results.ZIP_BASE_64.equals(this.result);

        final ReusableByteArrayOutputStream os = new ReusableByteArrayOutputStream(outputBuffer);
        final Point size = captureView(view, os);

        // in case of buffer grow that will be a new array with bigger size
        outputBuffer = os.innerBuffer();
        final int length = os.size();
        final String resolution = String.format(Locale.US, "%d:%d|", size.x, size.y);
        final String header = (isRaw ? resolution : "");
        final String data;

        if (isZippedBase64) {
            final Deflater deflater = new Deflater();
            deflater.setInput(outputBuffer, 0, length);
            deflater.finish();

            final ReusableByteArrayOutputStream zipped = new ReusableByteArrayOutputStream(new byte[32]);
            byte[] buffer = new byte[1024];
            while (!deflater.finished()) {
                int count = deflater.deflate(buffer); // returns the generated code... index
                zipped.write(buffer, 0, count);
            }

            data = header + Base64.encodeToString(zipped.innerBuffer(), 0, zipped.size(), Base64.NO_WRAP);
        } else {
            data = header + Base64.encodeToString(outputBuffer, 0, length, Base64.NO_WRAP);
        }

        promise.resolve(data);
    }

    @NonNull
    private List<View> getAllChildren(@NonNull final View v) {
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
     * Wrap {@link #captureViewImpl(View, OutputStream)} call and on end close output stream.
     */
    private Point captureView(@NonNull final View view, @NonNull final OutputStream os) throws IOException {
        try {
            return captureViewImpl(view, os);
        } finally {
            os.close();
        }
    }

    /**
     * Screenshot a view and return the captured bitmap.
     *
     * @param view the view to capture
     * @return screenshot resolution, Width * Height
     */
    private Point captureViewImpl(@NonNull final View view, @NonNull final OutputStream os) {
        int w = view.getWidth();
        int h = view.getHeight();

        if (w <= 0 || h <= 0) {
            throw new RuntimeException("Impossible to snapshot the view: view is invalid");
        }

        // evaluate real height
        if (snapshotContentContainer) {
            h = 0;
            ScrollView scrollView = (ScrollView) view;
            for (int i = 0; i < scrollView.getChildCount(); i++) {
                h += scrollView.getChildAt(i).getHeight();
            }
        }

        final Point resolution = new Point(w, h);
        Bitmap bitmap = getBitmapForScreenshot(w, h);

        final Paint paint = new Paint();
        paint.setAntiAlias(true);
        paint.setFilterBitmap(true);
        paint.setDither(true);

        // Uncomment next line if you want to wait attached android studio debugger:
        //   Debug.waitForDebugger();

        final Canvas c = new Canvas(bitmap);
        view.draw(c);

        //after view is drawn, go through children
        final List<View> childrenList = getAllChildren(view);

        for (final View child : childrenList) {
            // skip any child that we don't know how to process
            if (child instanceof TextureView) {
                // skip all invisible to user child views
                if (child.getVisibility() != VISIBLE) continue;

                final TextureView tvChild = (TextureView) child;
                tvChild.setOpaque(false); // <-- switch off background fill

                // NOTE (olku): get re-usable bitmap. TextureView should use bitmaps with matching size,
                // otherwise content of the TextureView will be scaled to provided bitmap dimensions
                final Bitmap childBitmapBuffer = tvChild.getBitmap(getExactBitmapForScreenshot(child.getWidth(), child.getHeight()));

                final int countCanvasSave = c.save();
                applyTransformations(c, view, child);

                // due to re-use of bitmaps for screenshot, we can get bitmap that is bigger in size than requested
                c.drawBitmap(childBitmapBuffer, 0, 0, paint);

                c.restoreToCount(countCanvasSave);
                recycleBitmap(childBitmapBuffer);
            } else if (child instanceof SurfaceView && handleGLSurfaceView) {
                final SurfaceView svChild = (SurfaceView)child;
                final CountDownLatch latch = new CountDownLatch(1);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    final Bitmap childBitmapBuffer = getExactBitmapForScreenshot(child.getWidth(), child.getHeight());
                    try {
                        PixelCopy.request(svChild, childBitmapBuffer, new PixelCopy.OnPixelCopyFinishedListener() {
                            @Override
                            public void onPixelCopyFinished(int copyResult) {
                                final int countCanvasSave = c.save();
                                applyTransformations(c, view, child);
                                c.drawBitmap(childBitmapBuffer, 0, 0, paint);
                                c.restoreToCount(countCanvasSave);
                                recycleBitmap(childBitmapBuffer);
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

        if (width != null && height != null && (width != w || height != h)) {
            final Bitmap scaledBitmap = Bitmap.createScaledBitmap(bitmap, width, height, true);
            recycleBitmap(bitmap);

            bitmap = scaledBitmap;
        }

        // special case, just save RAW ARGB array without any compression
        if (Formats.RAW == this.format && os instanceof ReusableByteArrayOutputStream) {
            final int total = w * h * ARGB_SIZE;
            final ReusableByteArrayOutputStream rbaos = cast(os);
            bitmap.copyPixelsToBuffer(rbaos.asBuffer(total));
            rbaos.setSize(total);
        } else {
            final Bitmap.CompressFormat cf = Formats.mapping[this.format];

            bitmap.compress(cf, (int) (100.0 * quality), os);
        }

        recycleBitmap(bitmap);

        return resolution; // return image width and height
    }

    /**
     * Concat all the transformation matrix's from parent to child.
     */
    @NonNull
    @SuppressWarnings("UnusedReturnValue")
    private Matrix applyTransformations(final Canvas c, @NonNull final View root, @NonNull final View child) {
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

    @SuppressWarnings("unchecked")
    private static <T extends A, A> T cast(final A instance) {
        return (T) instance;
    }
    //endregion

    //region Cache re-usable bitmaps
    /**
     * Synchronization guard.
     */
    private static final Object guardBitmaps = new Object();
    /**
     * Reusable bitmaps for screenshots.
     */
    private static final Set<Bitmap> weakBitmaps = Collections.newSetFromMap(new WeakHashMap<Bitmap, Boolean>());

    /**
     * Propose allocation size of the array output stream.
     */
    private static int proposeSize(@NonNull final View view) {
        final int w = view.getWidth();
        final int h = view.getHeight();

        return Math.min(w * h * ARGB_SIZE, 32);
    }

    /**
     * Return bitmap to set of available.
     */
    private static void recycleBitmap(@NonNull final Bitmap bitmap) {
        synchronized (guardBitmaps) {
            weakBitmaps.add(bitmap);
        }
    }

    /**
     * Try to find a bitmap for screenshot in reusable set and if not found create a new one.
     */
    @NonNull
    private static Bitmap getBitmapForScreenshot(final int width, final int height) {
        synchronized (guardBitmaps) {
            for (final Bitmap bmp : weakBitmaps) {
                if (bmp.getWidth() == width && bmp.getHeight() == height) {
                    weakBitmaps.remove(bmp);
                    bmp.eraseColor(Color.TRANSPARENT);
                    return bmp;
                }
            }
        }

        return Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
    }

    /**
     * Try to find a bitmap with exact width and height for screenshot in reusable set and if
     * not found create a new one.
     */
    @NonNull
    private static Bitmap getExactBitmapForScreenshot(final int width, final int height) {
        synchronized (guardBitmaps) {
            for (final Bitmap bmp : weakBitmaps) {
                if (bmp.getWidth() == width && bmp.getHeight() == height) {
                    weakBitmaps.remove(bmp);
                    bmp.eraseColor(Color.TRANSPARENT);
                    return bmp;
                }
            }
        }

        return Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
    }
    //endregion

    //region Nested declarations

    /**
     * Stream that can re-use pre-allocated buffer.
     */
    @SuppressWarnings("WeakerAccess")
    public static class ReusableByteArrayOutputStream extends ByteArrayOutputStream {
        private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

        public ReusableByteArrayOutputStream(@NonNull final byte[] buffer) {
            super(0);

            this.buf = buffer;
        }

        /**
         * Get access to inner buffer without any memory copy operations.
         */
        public byte[] innerBuffer() {
            return this.buf;
        }

        @NonNull
        public ByteBuffer asBuffer(final int size) {
            if (this.buf.length < size) {
                grow(size);
            }

            return ByteBuffer.wrap(this.buf);
        }

        public void setSize(final int size) {
            this.count = size;
        }

        /**
         * Increases the capacity to ensure that it can hold at least the
         * number of elements specified by the minimum capacity argument.
         *
         * @param minCapacity the desired minimum capacity
         */
        protected void grow(int minCapacity) {
            // overflow-conscious code
            int oldCapacity = buf.length;
            int newCapacity = oldCapacity << 1;
            if (newCapacity - minCapacity < 0)
                newCapacity = minCapacity;
            if (newCapacity - MAX_ARRAY_SIZE > 0)
                newCapacity = hugeCapacity(minCapacity);
            buf = Arrays.copyOf(buf, newCapacity);
        }

        protected static int hugeCapacity(int minCapacity) {
            if (minCapacity < 0) // overflow
                throw new OutOfMemoryError();

            return (minCapacity > MAX_ARRAY_SIZE) ?
                    Integer.MAX_VALUE :
                    MAX_ARRAY_SIZE;
        }

    }
    //endregion

}

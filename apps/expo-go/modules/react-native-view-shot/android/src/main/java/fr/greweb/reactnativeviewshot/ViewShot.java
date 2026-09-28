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
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
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
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.zip.Deflater;

import javax.annotation.Nullable;

import static android.view.View.VISIBLE;

/**
 * Snapshot utility class allow to screenshot a view.
 */
@UnstableReactNativeAPI
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
    /**
     * Hard cap (seconds) for blocking the capture executor on the UI
     * thread (mark + view.draw + restore). The capture is rejected with
     * UiThreadBlockTimeoutException when the main looper does not service
     * the posted runnable within this window — preventing capture from
     * hanging forever on a stuck UI thread. Sized to match
     * {@link #SURFACE_VIEW_READ_PIXELS_TIMEOUT} so both UI-thread waits
     * have predictable, consistent behavior.
     */
    private static final long UI_THREAD_BLOCK_TIMEOUT_SECONDS = 5;

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
        final View view;

        try {
            if (tag == -1) {
                view = currentActivity.getWindow().getDecorView().findViewById(android.R.id.content);
            } else if (uiBlockViewResolver != null) {
                view = uiBlockViewResolver.resolveView(tag);
            } else {
                view = nativeViewHierarchyManager.resolveView(tag);
            }
        } catch (final Throwable ex) {
            // currentActivity / getWindow() may be null when the app is
            // backgrounded, and resolveView can throw on stale tags. Catch
            // here so we reject the promise instead of crashing the
            // UIManager queue.
            Log.e(TAG, "Failed to resolve view for snapshot", ex);
            final String detail = ex.getMessage() != null ? ex.getMessage() : ex.toString();
            promise.reject(ERROR_UNABLE_TO_SNAPSHOT,
                "Failed to resolve view for snapshot: " + detail, ex);
            return;
        }

        if (view == null) {
            Log.e(TAG, "No view found with reactTag: " + tag, new AssertionError());
            promise.reject(ERROR_UNABLE_TO_SNAPSHOT, "No view found with reactTag: " + tag);
            return;
        }

        executor.execute(new Runnable () {
            @Override
            public void run() {
                try {
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
                    final String detail = ex.getMessage() != null ? ex.getMessage() : ex.toString();
                    promise.reject(ERROR_UNABLE_TO_SNAPSHOT,
                        "Failed to capture view snapshot: " + detail, ex);
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

    static void markSubtreeAlphaLayers(@NonNull final View v,
                                       @NonNull final List<View> tracked) {
        if (v instanceof ViewGroup) {
            final ViewGroup group = (ViewGroup) v;
            final float alpha = v.getAlpha();
            // Layering allocates an offscreen bitmap per affected group, so we
            // narrow the condition:
            //  - childCount > 1: the bug only manifests when a translucent
            //    parent has multiple children whose individual alphas blend
            //    instead of the subtree being composed first.
            //  - hasOverlappingRendering(): if the view itself reports it
            //    cannot have overlapping content, alpha can be applied to
            //    each child directly with the correct result, no layer
            //    needed. (Default for ViewGroup is true, but custom views
            //    may override.)
            //  - LAYER_TYPE_NONE: a view that already has a layer type may
            //    also carry a layer Paint we cannot read back, so flipping
            //    it would risk losing that paint on restore. Only tracking
            //    LAYER_TYPE_NONE views means we always restore back to NONE.
            if (alpha > 0f && alpha < 1f
                    && group.getChildCount() > 1
                    && v.hasOverlappingRendering()
                    && v.getLayerType() == View.LAYER_TYPE_NONE) {
                tracked.add(v);
                v.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
            }
            for (int i = 0; i < group.getChildCount(); i++) {
                markSubtreeAlphaLayers(group.getChildAt(i), tracked);
            }
        }
    }

    /**
     * Force a synchronous measure + layout pass at the given size, preserving
     * the view's existing position. Used by the snapshotContentContainer path
     * to expand a ScrollView to its full content size before drawing and to
     * restore it afterwards.
     */
    static void forceExactLayout(@NonNull final View v, final int width, final int height) {
        v.measure(
            View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));
        v.layout(v.getLeft(), v.getTop(), v.getLeft() + width, v.getTop() + height);
    }

    static final class UiThreadBlockTimeoutException extends RuntimeException {
        UiThreadBlockTimeoutException(String message) {
            super(message);
        }
    }

    /**
     * Runnable that receives a cancellation flag set by the caller when its
     * blocking wait has already expired, so the task can short-circuit
     * before doing expensive work on the UI thread.
     */
    private interface CancellableUiTask {
        void run(@NonNull AtomicBoolean cancelled);
    }

    // State machine for the posted UI runnable. STATE_QUEUED is the start
    // state; STATE_RUNNING is set by the runnable on entry; STATE_DONE is
    // set either by the runnable on exit or by the caller on timeout when
    // it CAS-promotes a still-queued task. The CAS contest between the
    // caller (timeout path) and the runnable (entry) ensures exactly one
    // side wins ownership: caller wins → task is dequeued/aborted and
    // bitmap can be cleaned up immediately; runnable wins → task executes
    // and owns its own cleanup via the cancellation handoff.
    private static final int STATE_QUEUED = 0;
    private static final int STATE_RUNNING = 1;
    private static final int STATE_DONE = 2;

    private static void runOnUiThreadBlocking(
            @NonNull final CancellableUiTask task,
            @NonNull final AtomicBoolean uiTaskFinished) {
        final AtomicBoolean cancelled = new AtomicBoolean(false);
        if (Looper.myLooper() == Looper.getMainLooper()) {
            try {
                task.run(cancelled);
            } finally {
                uiTaskFinished.set(true);
            }
            return;
        }
        final AtomicInteger state = new AtomicInteger(STATE_QUEUED);
        final AtomicReference<Throwable> uiTaskError = new AtomicReference<>();
        final Handler handler = new Handler(Looper.getMainLooper());
        final CountDownLatch latch = new CountDownLatch(1);
        final Runnable wrapped = new Runnable() {
            @Override
            public void run() {
                // Lose the CAS if the caller already promoted us to DONE
                // on timeout — in that case the bitmap may already have
                // been pooled, so skip the body to avoid drawing into it.
                if (!state.compareAndSet(STATE_QUEUED, STATE_RUNNING)) {
                    latch.countDown();
                    return;
                }
                try {
                    task.run(cancelled);
                } catch (Throwable t) {
                    // Capture and rethrow on the caller thread instead of
                    // letting the exception propagate to the UI thread's
                    // uncaught handler (which would crash the app).
                    uiTaskError.set(t);
                } finally {
                    state.set(STATE_DONE);
                    uiTaskFinished.set(true);
                    latch.countDown();
                }
            }
        };
        if (!handler.post(wrapped)) {
            // The task will never run, so signal "finished" to the caller
            // (its outer finally is then free to clean up the bitmap
            // immediately rather than waiting for a UI handoff that
            // can't happen).
            uiTaskFinished.set(true);
            throw new RuntimeException("Failed to post task to UI thread (looper exiting?)");
        }

        // Wait until the UI task has run. Cap with a hard timeout (throws
        // on expiry) so a stuck main thread cannot hang capture forever.
        // On expiry we:
        //  - flip the cancellation flag so a running task can short-circuit
        //  - call removeCallbacks to dequeue an unstarted post
        //  - CAS QUEUED→DONE: if we win, the task hadn't started and the
        //    runnable will skip if it later races dispatch, so the caller
        //    can pool the bitmap immediately; if we lose, the task is
        //    in flight and its own finally will hand off cleanup.
        // Keep waiting through interrupts so we don't return successfully
        // before the task ran.
        boolean interrupted = false;
        final long deadlineNanos = System.nanoTime() + TimeUnit.SECONDS.toNanos(UI_THREAD_BLOCK_TIMEOUT_SECONDS);
        try {
            while (true) {
                final long remaining = deadlineNanos - System.nanoTime();
                if (remaining <= 0) {
                    cancelled.set(true);
                    handler.removeCallbacks(wrapped);
                    if (state.compareAndSet(STATE_QUEUED, STATE_DONE)) {
                        uiTaskFinished.set(true);
                    }
                    final String msg = "Timed out waiting for UI thread after "
                        + UI_THREAD_BLOCK_TIMEOUT_SECONDS + "s";
                    Log.e(TAG, msg);
                    throw new UiThreadBlockTimeoutException(msg);
                }
                try {
                    if (latch.await(remaining, TimeUnit.NANOSECONDS)) {
                        final Throwable err = uiTaskError.get();
                        if (err != null) {
                            if (err instanceof RuntimeException) throw (RuntimeException) err;
                            if (err instanceof Error) throw (Error) err;
                            throw new RuntimeException(err);
                        }
                        return;
                    }
                } catch (InterruptedException e) {
                    interrupted = true;
                }
            }
        } finally {
            if (interrupted) {
                Thread.currentThread().interrupt();
            }
        }
    }

    @NonNull
    static List<View> getAllChildren(@NonNull final View v) {
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
        // All view-state reads and the bitmap allocation happen inside the
        // UI runnable below to avoid a race with concurrent captures of the
        // same view: another capture's mark/expand window could otherwise
        // be observed here on the background thread, causing oversized
        // bitmap allocation (and a blank tail when this capture's draw
        // later runs at the restored size). Posting through the UI thread
        // serialises captures of the same view, so each one allocates and
        // draws at a consistent size.
        final AtomicReference<Bitmap> originalBitmapRef = new AtomicReference<>();
        final AtomicReference<Canvas> canvasRef = new AtomicReference<>();
        final AtomicReference<Point> resolutionRef = new AtomicReference<>();
        // Recycling the canvas-backing bitmap is split between the caller
        // (background thread) and the UI runnable so we can safely return
        // the bitmap to the pool even when the caller times out mid-draw.
        // Both sides do `getAndSet(null)` after the UI task has finished;
        // exactly one wins the CAS and recycles, never returning a bitmap
        // that might still be in use by view.draw() on the UI thread.
        final AtomicReference<Bitmap> originalToRecycle = new AtomicReference<>();
        final AtomicBoolean uiTaskFinished = new AtomicBoolean(false);
        Bitmap bitmap = null;
        Bitmap originalBitmap = null;
        try {
            final Paint paint = new Paint();
            paint.setAntiAlias(true);
            paint.setFilterBitmap(true);
            paint.setDither(true);

            // Uncomment next line if you want to wait attached android studio debugger:
            //   Debug.waitForDebugger();

            // Force every translucent ViewGroup to render as a single offscreen
            // bitmap so view.draw() composites the subtree opaquely and applies
            // the alpha once at the end. Without this, ViewGroup.dispatchDraw on
            // a software canvas blends each child individually, which makes
            // overlapping children under a translucent parent show through each
            // other instead of being treated as one composited layer.
            //
            // Run mark + draw + restore atomically on the UI thread so:
            //  - setLayerType mutations happen on the thread that owns the view
            //  - restore is always paired with mark within the same task (even
            //    if the caller times out waiting on us, the queued task still
            //    runs end-to-end, never leaving the live UI in the forced-
            //    software state)
            //  - the live UI never observes a half-applied state between mark
            //    and restore.
            // Tradeoff: view.draw() runs on the UI thread, so a large hierarchy
            // can briefly stall rendering (frame drops) for the duration of the
            // capture; we accept that over the alternative of an unpaired-mark
            // window mutating the live tree.
            runOnUiThreadBlocking(new CancellableUiTask() {
                @Override
                public void run(@NonNull AtomicBoolean cancelled) {
                    Bitmap allocatedBitmap = null;
                    try {
                        if (cancelled.get()) return;
                        // Read the view's current size on the UI thread, after
                        // any in-flight capture has restored its layout (the
                        // UI thread is single-threaded so we cannot observe a
                        // partial mark/expand from another capture).
                        final int viewWidth = view.getWidth();
                        final int viewHeight = view.getHeight();
                        if (viewWidth <= 0 || viewHeight <= 0) {
                            throw new RuntimeException(
                                "Impossible to snapshot the view: view is invalid");
                        }

                        final List<View> alphaLayered = new ArrayList<>();
                        // Mirror iOS snapshotContentContainer behaviour: temporarily
                        // resize the ScrollView to its full content height and force
                        // a measure/layout pass so that children below the visible
                        // viewport are no longer clipped out by the ScrollView's own
                        // bounds. Without this, view.draw() on the expanded canvas
                        // still skips off-screen children because ScrollView clips
                        // its dispatchDraw to its own dimensions.
                        //
                        // FlatList caveat: virtualization (removeClippedSubviews,
                        // windowSize) means off-screen items may not be mounted
                        // and therefore cannot be drawn. To capture full content
                        // from a FlatList, set removeClippedSubviews={false} and
                        // a windowSize large enough to render everything, or use
                        // ScrollView for content under a few hundred items.
                        // TODO: HorizontalScrollView does not extend ScrollView,
                        // so it isn't covered here. iOS's UIScrollView check
                        // covers both axes; we'd need to widen this guard +
                        // expand width instead of height for the horizontal
                        // case to reach parity.
                        final ScrollView scrollView =
                            (snapshotContentContainer && view instanceof ScrollView)
                                ? (ScrollView) view : null;
                        if (snapshotContentContainer && scrollView == null) {
                            // Non-ScrollView refs with snapshotContentContainer:true
                            // can't be expanded; fall back to the visible bounds
                            // rather than throwing a ClassCastException.
                            Log.w(TAG, "snapshotContentContainer requested but ref is not a "
                                + "ScrollView (got " + view.getClass().getName()
                                + "); capturing the visible bounds instead.");
                        }
                        int captureHeight = viewHeight;
                        if (scrollView != null) {
                            int totalChildHeight = 0;
                            for (int i = 0; i < scrollView.getChildCount(); i++) {
                                totalChildHeight += scrollView.getChildAt(i).getHeight();
                            }
                            if (totalChildHeight > 0) {
                                captureHeight = totalChildHeight;
                            }
                        }
                        resolutionRef.set(new Point(viewWidth, captureHeight));
                        allocatedBitmap = getBitmapForScreenshot(viewWidth, captureHeight);
                        originalBitmapRef.set(allocatedBitmap);
                        originalToRecycle.set(allocatedBitmap);
                        final Canvas c = new Canvas(allocatedBitmap);
                        canvasRef.set(c);

                        final ViewGroup.LayoutParams savedLayoutParams =
                            scrollView != null ? scrollView.getLayoutParams() : null;
                        // Capture the original LayoutParams width/height so we
                        // restore special values like MATCH_PARENT/WRAP_CONTENT
                        // exactly — not the resolved pixel size — to avoid
                        // permanently freezing the ScrollView at pixel dims
                        // after capture.
                        final int savedLpWidth =
                            savedLayoutParams != null ? savedLayoutParams.width : 0;
                        final int savedLpHeight =
                            savedLayoutParams != null ? savedLayoutParams.height : 0;
                        final int savedScrollX = scrollView != null ? scrollView.getScrollX() : 0;
                        final int savedScrollY = scrollView != null ? scrollView.getScrollY() : 0;
                        try {
                            if (scrollView != null) {
                                if (savedLayoutParams != null) {
                                    // Mutate width/height in place on the live
                                    // LayoutParams (they are restored below).
                                    // Using requestLayout would schedule the
                                    // change asynchronously; we need it to take
                                    // effect synchronously before view.draw().
                                    savedLayoutParams.width = viewWidth;
                                    savedLayoutParams.height = captureHeight;
                                    scrollView.setLayoutParams(savedLayoutParams);
                                }
                                scrollView.scrollTo(0, 0);
                                // Force a synchronous measure + layout pass at
                                // the expanded size so dispatchDraw's clip rect
                                // covers the full content.
                                forceExactLayout(scrollView, viewWidth, captureHeight);
                            }
                            markSubtreeAlphaLayers(view, alphaLayered);
                            view.draw(c);
                        } finally {
                            for (View v : alphaLayered) {
                                v.setLayerType(View.LAYER_TYPE_NONE, null);
                            }
                            if (scrollView != null) {
                                if (savedLayoutParams != null) {
                                    // Restore the original LayoutParams values
                                    // (which may be MATCH_PARENT, WRAP_CONTENT
                                    // or a pixel size) so the live tree returns
                                    // to its prior layout policy.
                                    savedLayoutParams.width = savedLpWidth;
                                    savedLayoutParams.height = savedLpHeight;
                                    scrollView.setLayoutParams(savedLayoutParams);
                                }
                                forceExactLayout(scrollView, viewWidth, viewHeight);
                                scrollView.scrollTo(savedScrollX, savedScrollY);
                            }
                        }
                    } finally {
                        // Only own the recycle when the caller has abandoned us
                        // (timed out): otherwise the caller is still alive and
                        // will keep using the bitmap for child overlays, scale
                        // and compression — recycling here would return a live
                        // bitmap to the pool. The caller's own finally CAS-
                        // recycles at the end of captureViewImpl.
                        if (cancelled.get() && allocatedBitmap != null) {
                            final Bitmap toRecycle = originalToRecycle.getAndSet(null);
                            if (toRecycle != null) recycleBitmap(toRecycle);
                        }
                    }
                }
            }, uiTaskFinished);

            // The UI task ran successfully (otherwise runOnUiThreadBlocking
            // would have thrown). Pull out what it produced.
            originalBitmap = originalBitmapRef.get();
            bitmap = originalBitmap;
            final Canvas c = canvasRef.get();
            final Point resolution = resolutionRef.get();
            if (originalBitmap == null || c == null || resolution == null) {
                // Defensive: cancellation path or unexpected state.
                throw new RuntimeException("Impossible to snapshot the view: capture aborted");
            }
            final int w = resolution.x;
            final int h = resolution.y;

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
                // We reached here so runOnUiThreadBlocking returned successfully
                // — the original bitmap is no longer in use by the UI thread.
                // CAS-recycle it; if the UI runnable's finally already won the
                // race we just get null back.
                final Bitmap toRecycle = originalToRecycle.getAndSet(null);
                if (toRecycle != null) recycleBitmap(toRecycle);
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

            return resolution; // return image width and height
        } finally {
            // Recycle the original via CAS handoff: only safe once the UI
            // task is finished. If the UI is still drawing (timeout race),
            // we leave the ref intact and the runnable's finally will
            // recycle when it reaches it. If the runnable already won the
            // race, getAndSet returns null and we skip.
            if (uiTaskFinished.get()) {
                final Bitmap toRecycle = originalToRecycle.getAndSet(null);
                if (toRecycle != null) recycleBitmap(toRecycle);
            }
            // The scaled bitmap (if we created one) is owned exclusively by
            // this thread and never seen by the UI task, so it's always
            // safe to recycle here.
            if (bitmap != originalBitmap) {
                recycleBitmap(bitmap);
            }
        }
    }

    /**
     * Walk the parent chain from {@code child} up to (but not including)
     * {@code root}, returning the visited views in leaf-to-root order.
     * Guards against three failure modes that surfaced in #488:
     * <ul>
     *   <li>{@code child == root}: the captured view is itself a
     *       non-ViewGroup (e.g. a SurfaceView captured directly with
     *       {@code handleGLSurfaceView=true}), so {@code getAllChildren}
     *       returns {@code [v]} and we have no ancestors to walk.</li>
     *   <li>Null parent encountered mid-walk: the child wasn't (or no
     *       longer is) a descendant of root.</li>
     *   <li>Non-View {@link android.view.ViewParent} encountered (e.g.
     *       {@code ViewRootImpl} when walking past root): casting it to
     *       {@code View} would throw {@code ClassCastException}.</li>
     * </ul>
     * The original {@code do/while} loop blindly cast and dereferenced
     * {@code iterator.getParent()} and crashed in any of those cases.
     */
    @NonNull
    static List<View> walkAncestors(@NonNull final View child, @NonNull final View root) {
        final LinkedList<View> ms = new LinkedList<>();
        if (child == root) {
            return ms;
        }
        View iterator = child;
        while (iterator != null && iterator != root) {
            ms.add(iterator);
            final android.view.ViewParent parent = iterator.getParent();
            iterator = (parent instanceof View) ? (View) parent : null;
        }
        return ms;
    }

    /**
     * Concat all the transformation matrix's from parent to child.
     */
    @NonNull
    @SuppressWarnings("UnusedReturnValue")
    private Matrix applyTransformations(final Canvas c, @NonNull final View root, @NonNull final View child) {
        final Matrix transform = new Matrix();
        final LinkedList<View> ms = new LinkedList<>(walkAncestors(child, root));
        if (ms.isEmpty()) {
            return transform;
        }

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
    static int proposeSize(@NonNull final View view) {
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

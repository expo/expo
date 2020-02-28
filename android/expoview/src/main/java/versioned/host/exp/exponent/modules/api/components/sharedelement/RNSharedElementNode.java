package versioned.host.exp.exponent.modules.api.components.sharedelement;

import java.util.ArrayList;
import javax.annotation.Nullable;

import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Matrix;
import android.graphics.drawable.Animatable;
import android.widget.ImageView;
import android.content.Context;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableMap;

import com.facebook.imagepipeline.image.ImageInfo;
import com.facebook.drawee.view.GenericDraweeView;
import com.facebook.drawee.interfaces.DraweeController;
import com.facebook.drawee.controller.BaseControllerListener;
import com.facebook.drawee.backends.pipeline.PipelineDraweeController;

abstract class RetryRunnable implements Runnable {
    int numRetries = 0;
}

class RNSharedElementNode {
    static private String LOG_TAG = "RNSharedElementNode";

    private Context mContext;
    private int mReactTag;
    private View mView;
    private View mAncestorView;
    private boolean mIsParent;
    private ReadableMap mStyleConfig;
    private RNSharedElementStyle mResolveStyle;
    private View mResolvedView;
    private int mRefCount;
    private int mHideRefCount;
    private float mHideAlpha;
    private RNSharedElementStyle mStyleCache;
    private ArrayList<Callback> mStyleCallbacks;
    private RNSharedElementContent mContentCache;
    private ArrayList<Callback> mContentCallbacks;
    private BaseControllerListener<ImageInfo> mDraweeControllerListener;
    private Handler mRetryHandler;

    RNSharedElementNode(Context context, int reactTag, View view, boolean isParent, View ancestorView, ReadableMap styleConfig) {
        mReactTag = reactTag;
        mView = view;
        mAncestorView = ancestorView;
        mIsParent = isParent;
        mStyleConfig = styleConfig;
        mResolveStyle = new RNSharedElementStyle(styleConfig, context);
        mContext = context;
        mRefCount = 1;
        mHideRefCount = 0;
        mHideAlpha = 1;
        mStyleCache = null;
        mStyleCallbacks = null;
        mContentCache = null;
        mContentCallbacks = null;
        mResolvedView = null;
        mDraweeControllerListener = null;
        mRetryHandler = null;
    }

    int getReactTag() {
        return mReactTag;
    }

    int addRef() {
        return ++mRefCount;
    }

    int releaseRef() {
        if (--mRefCount == 0) {
            removeDraweeControllerListener(mResolvedView);
            stopRetryLoop();
            mView = null;
            mAncestorView = null;
            mStyleConfig = null;
            mResolvedView = null;
            mContentCache = null;
            mContentCallbacks = null;
            mStyleCache = null;
            mStyleCallbacks = null;
        }
        return mRefCount;
    }

    void addHideRef() {
        mHideRefCount++;
        if (mHideRefCount == 1) {
            mHideAlpha = mView.getAlpha();
            mView.setAlpha(0);
        }
    }

    void releaseHideRef() {
        mHideRefCount--;
        if (mHideRefCount == 0) {
            mView.setAlpha(mHideAlpha);
        }
    }

    private static View resolveView(View view, RNSharedElementStyle style) {
        if (view == null) return null;

        // If the view is a ViewGroup and it contains exactly one
        // imageview with the same size, then use that imageview
        if (view instanceof ViewGroup) {
            ViewGroup viewGroup = (ViewGroup) view;
            if (viewGroup.getChildCount() == 1) {
                View childView = viewGroup.getChildAt(0);
                if (childView instanceof ImageView) {
                    int left = childView.getLeft();
                    int top = childView.getTop();
                    int width = childView.getWidth();
                    int height = childView.getHeight();
                    int expectedLeft = Math.round(style.borderWidth);
                    int expectedTop = Math.round(style.borderWidth);
                    int expectedWidth = Math.round((float)viewGroup.getWidth() - (style.borderWidth * 2));
                    int expectedHeight = Math.round((float)viewGroup.getHeight() - (style.borderWidth * 2));
                    if (((left >= expectedLeft - 1) && (left <= expectedLeft + 1)) &&
                        ((top >= expectedTop - 1) && (top <= expectedTop + 1)) &&
                        ((width >= expectedWidth - 1) && (width <= expectedWidth + 1)) &&
                        ((height >= expectedHeight - 1) && (height <= expectedHeight + 1))) {
                        return childView;
                    }
                }
            }
        }
        return view;
    }

    View getAncestorView() {
        return mAncestorView;
    }

    View getResolvedView() {
        if (mResolvedView != null) return mResolvedView;
        View view = mView;
        if (mIsParent) {
            int childCount = ((ViewGroup)mView).getChildCount();
            if (childCount == 1) {
                view = ((ViewGroup)mView).getChildAt(0);
            } else if (childCount <= 0) {
                Log.d(LOG_TAG, "Child for parent doesnt exist");
                return null;
            }
        }
        mResolvedView = RNSharedElementNode.resolveView(view, mResolveStyle);
        return mResolvedView;
    }

    void requestStyle(Callback callback) {
        if (mStyleCache != null) {
            callback.invoke(mStyleCache, this);
            return;
        }
        if (mStyleCallbacks == null) mStyleCallbacks = new ArrayList<Callback>();
        mStyleCallbacks.add(callback);
        if (!fetchInitialStyle()) {
            startRetryLoop();
        }
    }

    private boolean fetchInitialStyle() {
        View view = getResolvedView();
        if (view == null) return false;
        if (mStyleCallbacks == null) return true;

        // Get relative size and position within parent
        int left = view.getLeft();
        int top = view.getTop();
        int width = view.getWidth();
        int height = view.getHeight();
        if (width == 0 && height == 0) return false;
        Matrix transform = RNSharedElementStyle.getAbsoluteViewTransform(view, true);
        Matrix ancestorTransform = RNSharedElementStyle.getAbsoluteViewTransform(mAncestorView, true);
        if ((transform == null) || (ancestorTransform == null)) return false;
        Rect frame = new Rect(left, top, left + width, top + height);

        // Get absolute position on screen (left/top)
        int[] location = new int[2]; 
        view.getLocationOnScreen(location);

        // Calculate the optional translation that was performed on the ancestor.
        // This corrects for any scene translation that was performed by the navigator.
        // E.g. when the incoming scene starts to the right and moves to the left
        // to enter the screen
        float[] f = new float[9];
        ancestorTransform.getValues(f);
        int ancestorTranslateX = (int) f[Matrix.MTRANS_X];
        int ancestorTranslateY = (int) f[Matrix.MTRANS_Y];
        left = location[0] - ancestorTranslateX;
        top = location[1] - ancestorTranslateY;

        // In case the view has a scale transform applied, the calculate
        // the correct visual width & height of the view
        transform.getValues(f);
        float scaleX = f[Matrix.MSCALE_X];
        float scaleY = f[Matrix.MSCALE_Y];
        width = (int) ((float)width * scaleX);
        height = (int) ((float)height * scaleY);

        // Create absolute layout rect
        Rect layout = new Rect(left, top, left + width, top + height);

        // Create style
        RNSharedElementStyle style = new RNSharedElementStyle(mStyleConfig, mContext);
        style.layout = layout;
        style.frame = frame;
        style.transform = transform;
        style.ancestorTransform = ancestorTransform;
        
        // Get opacity
        style.opacity = view.getAlpha();

        // Get elevation
        /*if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            style.elevation = view.getElevation();
        }*/

        // Update initial style cache
        mStyleCache = style;

        //Log.d(LOG_TAG, "Style fetched: " + style);

        // Notify callbacks
        ArrayList<Callback> callbacks = mStyleCallbacks;
        mStyleCallbacks = null;
        for (Callback callback : callbacks) { 
            callback.invoke(style, this);
        }
        return true;
    }

    void requestContent(Callback callback) {
        if (mContentCache != null) {
            callback.invoke(mContentCache, this);
            return;
        }
        if (mContentCallbacks == null) mContentCallbacks = new ArrayList<Callback>();
        mContentCallbacks.add(callback);
        if (!fetchInitialContent()) {
            startRetryLoop();
        }
    }

    private boolean fetchInitialContent() {
        View view = getResolvedView();
        if (view == null) return false;
        if (mContentCallbacks == null) return true;

        // Verify view size
        int width = view.getWidth();
        int height = view.getHeight();
        if (width == 0 && height == 0) return false;

        // Get content size (e.g. the size of the underlying image of an image-view)
        RectF contentSize = RNSharedElementContent.getSize(view);
        if (contentSize == null) {
            // Image has not yet been fetched, listen for it
            addDraweeControllerListener(view);
            return false;
        }

        // Create content
        RNSharedElementContent content = new RNSharedElementContent();
        content.view = view;
        content.size = contentSize;
        
        // Update cache
        mContentCache = content;

        // Log.d(LOG_TAG, "Content fetched: " + content);

        // Notify callbacks
        ArrayList<Callback> callbacks = mContentCallbacks;
        mContentCallbacks = null;
        for (Callback callback : callbacks) { 
            callback.invoke(content, this);
        }
        return true;
    }

    private void startRetryLoop() {
        if (mRetryHandler != null) return;

        //Log.d(LOG_TAG, "Starting retry loop...");

        mRetryHandler = new Handler();
        final long startTime = System.nanoTime();
        mRetryHandler.postDelayed(new RetryRunnable() {

            @Override
            public void run() {
                if (mRetryHandler == null) return;
                final RetryRunnable runnable = this;

                runnable.numRetries++;
                //Log.d(LOG_TAG, "Retry loop #" + runnable.numRetries + " ...");
                boolean isContentFetched = fetchInitialContent();
                boolean isStyleFetched = fetchInitialStyle();
                if (!isContentFetched || !isStyleFetched) {
                    mRetryHandler.postDelayed(runnable, 8);
                }
                else {
                    //Log.d(LOG_TAG, "Style/content fetch completed after #" + runnable.numRetries + " ...");
                    mRetryHandler = null;
                }
            }
        }, 4);
    }

    private void stopRetryLoop() {
        if (mRetryHandler != null) {
            //Log.d(LOG_TAG, "Stopping retry loop...");
            mRetryHandler = null;
        }
    }

    private void addDraweeControllerListener(final View view) {
        if (mDraweeControllerListener != null) return;

        if (!(view instanceof GenericDraweeView)) return;
        GenericDraweeView imageView = (GenericDraweeView) view;
        DraweeController controller = imageView.getController();
        if (!(controller instanceof PipelineDraweeController)) return;
        PipelineDraweeController pipelineController = (PipelineDraweeController) controller;

        mDraweeControllerListener = new BaseControllerListener<ImageInfo>() {
            @Override
            public void onSubmit(String id, Object callerContext) {
                //Log.d(LOG_TAG, "mDraweeControllerListener.onSubmit: " + id + ", callerContext: " + callerContext);
            }
    
            @Override
            public void onFinalImageSet(
              String id,
              @Nullable final ImageInfo imageInfo,
              @Nullable Animatable animatable) {
                //Log.d(LOG_TAG, "mDraweeControllerListener.onFinalImageSet: " + id + ", imageInfo: " + imageInfo);
                removeDraweeControllerListener(view);
                fetchInitialContent();
            }
    
            @Override
            public void onFailure(String id, Throwable throwable) {
                Log.d(LOG_TAG, "mDraweeControllerListener.onFailure: " + id + ", throwable: " + throwable);
            }
        };

        pipelineController.addControllerListener(mDraweeControllerListener);
    }

    private void removeDraweeControllerListener(final View view) {
        if (mDraweeControllerListener == null) return;
        GenericDraweeView imageView = (GenericDraweeView) view;
        DraweeController controller = imageView.getController();
        if (!(controller instanceof PipelineDraweeController)) return;
        PipelineDraweeController pipelineController = (PipelineDraweeController) controller;
        pipelineController.removeControllerListener(mDraweeControllerListener);
        mDraweeControllerListener = null;
    }
}

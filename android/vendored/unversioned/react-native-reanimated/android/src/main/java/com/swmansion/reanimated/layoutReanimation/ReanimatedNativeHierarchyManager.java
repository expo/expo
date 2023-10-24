package com.swmansion.reanimated.layoutReanimation;

import android.os.Build;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.ViewAtIndex;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.layoutanimation.LayoutAnimationController;
import com.facebook.react.uimanager.layoutanimation.LayoutAnimationListener;
import com.swmansion.reanimated.ReanimatedModule;
import java.lang.ref.WeakReference;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

class ReaLayoutAnimator extends LayoutAnimationController {
  private AnimationsManager mAnimationsManager = null;
  private volatile boolean mInitialized = false;
  private final ReactApplicationContext mContext;
  private final WeakReference<NativeViewHierarchyManager> mWeakNativeViewHierarchyManager;
  private final ArrayList<View> viewsToSnapshot = new ArrayList<>();

  ReaLayoutAnimator(
      ReactApplicationContext context, NativeViewHierarchyManager nativeViewHierarchyManager) {
    mContext = context;
    mWeakNativeViewHierarchyManager = new WeakReference<>(nativeViewHierarchyManager);
  }

  public void maybeInit() {
    if (!mInitialized) {
      mInitialized = true;
      ReanimatedModule reanimatedModule = mContext.getNativeModule(ReanimatedModule.class);
      mAnimationsManager = reanimatedModule.getNodesManager().getAnimationsManager();
      mAnimationsManager.setReanimatedNativeHierarchyManager(
          (ReanimatedNativeHierarchyManager) mWeakNativeViewHierarchyManager.get());
    }
  }

  public boolean shouldAnimateLayout(View viewToAnimate) {
    if (!isLayoutAnimationEnabled()) {
      return super.shouldAnimateLayout(viewToAnimate);
    }
    // if view parent is null, skip animation: view have been clipped, we don't want animation to
    // resume when view is re-attached to parent, which is the standard android animation behavior.
    // If there's a layout handling animation going on, it should be animated nonetheless since the
    // ongoing animation needs to be updated.
    if (viewToAnimate == null) {
      return false;
    }
    return (viewToAnimate.getParent() != null);
  }

  @Override
  public void reset() {
    super.reset();
    // we have to make snapshots of the views after all of them have updated layouts
    // to have correct global coordinates in the snapshots
    // we do it here because React calls reset() method after all views have updated layouts
    // and there is no semantically valid place to do it
    for (View view : viewsToSnapshot) {
      mAnimationsManager.onViewCreate(
          view,
          (ViewGroup) view.getParent(),
          new Snapshot(view, mWeakNativeViewHierarchyManager.get()));
    }
    viewsToSnapshot.clear();
  }

  /**
   * Update layout of given view, via immediate update or animation depending on the current batch
   * layout animation configuration supplied during initialization. Handles create and update
   * animations.
   *
   * @param view the view to update layout of
   * @param x the new X position for the view
   * @param y the new Y position for the view
   * @param width the new width value for the view
   * @param height the new height value for the view
   */
  public void applyLayoutUpdate(View view, int x, int y, int width, int height) {
    if (!isLayoutAnimationEnabled()) {
      super.applyLayoutUpdate(view, x, y, width, height);
      return;
    }
    UiThreadUtil.assertOnUiThread();
    maybeInit();
    // Determine which animation to use : if view is initially invisible, use create animation,
    // otherwise use update animation. This approach is easier than maintaining a list of tags
    // for recently created views.
    if (view.getWidth() == 0 || view.getHeight() == 0) {
      if (!mAnimationsManager.hasAnimationForTag(view.getId(), LayoutAnimations.Types.ENTERING)) {
        super.applyLayoutUpdate(view, x, y, width, height);
        mAnimationsManager.maybeRegisterSharedView(view);
        return;
      }
      view.layout(x, y, x + width, y + height);
      if (view.getId() != -1) {
        viewsToSnapshot.add(view);
      }
      return;
    }

    Snapshot before = new Snapshot(view, mWeakNativeViewHierarchyManager.get());
    view.layout(x, y, x + width, y + height);
    Snapshot after = new Snapshot(view, mWeakNativeViewHierarchyManager.get());
    mAnimationsManager.onViewUpdate(view, before, after);
  }

  /**
   * Animate a view deletion using the layout animation configuration supplied during
   * initialization.
   *
   * @param view The view to animate.
   * @param listener Called once the animation is finished, should be used to completely remove the
   *     view.
   */
  public void deleteView(final View view, final LayoutAnimationListener listener) {
    if (!isLayoutAnimationEnabled()) {
      super.deleteView(view, listener);
      return;
    }
    UiThreadUtil.assertOnUiThread();
    NativeViewHierarchyManager nativeViewHierarchyManager = mWeakNativeViewHierarchyManager.get();
    ViewManager viewManager;
    try {
      viewManager = nativeViewHierarchyManager.resolveViewManager(view.getId());
    } catch (IllegalViewOperationException e) {
      // (IllegalViewOperationException) == (vm == null)
      e.printStackTrace();
      mAnimationsManager.cancelAnimationsInSubviews(view);
      super.deleteView(view, listener);
      return;
    }
    // we don't want layout animations in native-stack since it is currently buggy there
    // so we check if it is a (grand)child of ScreenStack
    if (viewManager.getName().equals("RNSScreen")
        && view.getParent() != null
        && view.getParent().getParent() instanceof View) {
      // we check grandparent of Screen since the parent is a ScreenStackFragment
      View screenParentView = (View) view.getParent().getParent();
      ViewManager screenParentViewManager;
      try {
        screenParentViewManager =
            nativeViewHierarchyManager.resolveViewManager(screenParentView.getId());
      } catch (IllegalViewOperationException e) {
        // (IllegalViewOperationException) == (vm == null)
        e.printStackTrace();
        mAnimationsManager.cancelAnimationsInSubviews(view);
        super.deleteView(view, listener);
        return;
      }
      String parentName = screenParentViewManager.getName();
      if (parentName.equals("RNSScreenStack")) {
        mAnimationsManager.cancelAnimationsInSubviews(view);
        super.deleteView(view, listener);
        return;
      }
    }
    maybeInit();
    mAnimationsManager.onViewRemoval(view, (ViewGroup) view.getParent(), listener::onAnimationEnd);
  }

  public boolean isLayoutAnimationEnabled() {
    maybeInit();
    return mAnimationsManager.isLayoutAnimationEnabled();
  }

  public AnimationsManager getAnimationsManager() {
    return mAnimationsManager;
  }
}

public class ReanimatedNativeHierarchyManager extends NativeViewHierarchyManager {
  private final HashMap<Integer, ArrayList<View>> toBeRemoved = new HashMap<>();
  private final HashMap<Integer, Runnable> cleanerCallback = new HashMap<>();
  private final ReaLayoutAnimator mReaLayoutAnimator;
  private final HashMap<Integer, Set<Integer>> mPendingDeletionsForTag = new HashMap<>();
  private boolean initOk = true;

  public ReanimatedNativeHierarchyManager(
      ViewManagerRegistry viewManagers, ReactApplicationContext reactContext) {
    super(viewManagers);

    mReaLayoutAnimator = new ReaLayoutAnimator(reactContext, this);

    Class<?> clazz = this.getClass().getSuperclass();
    if (clazz == null) {
      Log.e("reanimated", "unable to resolve super class of ReanimatedNativeHierarchyManager");
      return;
    }

    try {
      Field layoutAnimatorField = clazz.getDeclaredField("mLayoutAnimator");
      layoutAnimatorField.setAccessible(true);

      if (android.os.Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        try {
          // accessFlags is supported only by API >=23
          Field modifiersField = Field.class.getDeclaredField("accessFlags");
          modifiersField.setAccessible(true);
          modifiersField.setInt(
              layoutAnimatorField, layoutAnimatorField.getModifiers() & ~Modifier.FINAL);
        } catch (NoSuchFieldException | IllegalAccessException e) {
          e.printStackTrace();
        }
      }
      layoutAnimatorField.set(this, mReaLayoutAnimator);
    } catch (NoSuchFieldException | IllegalAccessException e) {
      initOk = false;
      e.printStackTrace();
    }

    try {
      Field pendingTagsField = clazz.getDeclaredField("mPendingDeletionsForTag");
      pendingTagsField.setAccessible(true);

      if (android.os.Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        try {
          // accessFlags is supported only by API >=23
          Field pendingTagsFieldModifiers = Field.class.getDeclaredField("accessFlags");
          pendingTagsFieldModifiers.setAccessible(true);
          pendingTagsFieldModifiers.setInt(
              pendingTagsField, pendingTagsField.getModifiers() & ~Modifier.FINAL);
        } catch (NoSuchFieldException | IllegalAccessException e) {
          e.printStackTrace();
        }
      }
      pendingTagsField.set(this, mPendingDeletionsForTag);
    } catch (NoSuchFieldException | IllegalAccessException e) {
      initOk = false;
      e.printStackTrace();
    }

    if (initOk) {
      setLayoutAnimationEnabled(true);
    }
  }

  private boolean isLayoutAnimationDisabled() {
    return !initOk || !mReaLayoutAnimator.isLayoutAnimationEnabled();
  }

  public synchronized void updateLayout(
      int parentTag, int tag, int x, int y, int width, int height) {
    super.updateLayout(parentTag, tag, x, y, width, height);
    if (isLayoutAnimationDisabled()) {
      return;
    }
    try {
      ViewManager viewManager = resolveViewManager(tag);
      String viewManagerName = viewManager.getName();
      View container = resolveView(parentTag);
      if (container != null && viewManagerName.equals("RNSScreen") && mReaLayoutAnimator != null) {
        boolean hasHeader = checkIfTopScreenHasHeader((ViewGroup) container);
        if (!hasHeader || !container.isLayoutRequested()) {
          mReaLayoutAnimator.getAnimationsManager().screenDidLayout();
        }
      }
      View view = resolveView(tag);
      if (view != null && mReaLayoutAnimator != null) {
        mReaLayoutAnimator.getAnimationsManager().viewDidLayout(view);
      }
    } catch (IllegalViewOperationException e) {
      // (IllegalViewOperationException) == (vm == null)
      e.printStackTrace();
    }
  }

  private boolean checkIfTopScreenHasHeader(ViewGroup screenStack) {
    try {
      ViewGroup fragment = (ViewGroup) screenStack.getChildAt(0);
      ViewGroup screen = (ViewGroup) fragment.getChildAt(0);
      View headerConfig = screen.getChildAt(0);
      Field field = headerConfig.getClass().getDeclaredField("mIsHidden");
      field.setAccessible(true);
      return !field.getBoolean(headerConfig);
    } catch (NullPointerException | NoSuchFieldException | IllegalAccessException e) {
      return false;
    }
  }

  @Override
  public synchronized void manageChildren(
      int tag,
      @Nullable int[] indicesToRemove,
      @Nullable ViewAtIndex[] viewsToAdd,
      @Nullable int[] tagsToDelete) {
    if (isLayoutAnimationDisabled()) {
      super.manageChildren(tag, indicesToRemove, viewsToAdd, tagsToDelete);
      return;
    }
    ViewGroup viewGroup;
    ViewGroupManager viewGroupManager;
    try {
      viewGroup = (ViewGroup) resolveView(tag);
      viewGroupManager = (ViewGroupManager) resolveViewManager(tag);
    } catch (IllegalViewOperationException e) {
      // (IllegalViewOperationException) == (vm == null)
      e.printStackTrace();
      super.manageChildren(tag, indicesToRemove, viewsToAdd, tagsToDelete);
      return;
    }

    // we don't want layout animations in native-stack since it is currently buggy there
    AnimationsManager animationsManager = mReaLayoutAnimator.getAnimationsManager();
    if (viewGroupManager.getName().equals("RNSScreenStack")) {
      if (tagsToDelete == null) {
        animationsManager.makeSnapshotOfTopScreenViews(viewGroup);
      } else {
        animationsManager.notifyAboutViewsRemoval(tagsToDelete);
      }
      if (indicesToRemove != null && mReaLayoutAnimator instanceof ReaLayoutAnimator) {
        for (int index : indicesToRemove) {
          View child = viewGroupManager.getChildAt(viewGroup, index);
          mReaLayoutAnimator.getAnimationsManager().cancelAnimationsInSubviews(child);
        }
      }
      super.manageChildren(tag, indicesToRemove, viewsToAdd, tagsToDelete);
      return;
    }

    if (toBeRemoved.containsKey(tag)) {
      ArrayList<View> childrenToBeRemoved = toBeRemoved.get(tag);
      HashSet<Integer> tagsToRemove = new HashSet<>();
      for (View childToRemove : childrenToBeRemoved) {
        tagsToRemove.add(childToRemove.getId());
      }
      while (viewGroupManager.getChildCount(viewGroup) != 0) {
        View child =
            viewGroupManager.getChildAt(viewGroup, viewGroupManager.getChildCount(viewGroup) - 1);
        if (tagsToRemove.contains(child.getId())) {
          viewGroupManager.removeViewAt(viewGroup, viewGroupManager.getChildCount(viewGroup) - 1);
        } else {
          break;
        }
      }
    }
    if (tagsToDelete != null) {
      if (!toBeRemoved.containsKey(tag)) {
        toBeRemoved.put(tag, new ArrayList<>());
      }
      ArrayList<View> toBeRemovedChildren = toBeRemoved.get(tag);
      for (Integer childTag : tagsToDelete) {
        View view;
        try {
          view = resolveView(childTag);
        } catch (IllegalViewOperationException e) {
          // (IllegalViewOperationException) == (vm == null)
          e.printStackTrace();
          continue;
        }
        toBeRemovedChildren.add(view);
        // It's far from optimal but let's leave it as it is for now
        cleanerCallback.put(
            view.getId(),
            () -> {
              toBeRemovedChildren.remove(view);
              viewGroupManager.removeView(viewGroup, view);
            });
      }
    }

    // mPendingDeletionsForTag is modify by React
    if (mPendingDeletionsForTag != null) {
      Set<Integer> pendingTags = mPendingDeletionsForTag.get(tag);
      if (pendingTags != null) {
        pendingTags.clear();
      }
    }
    animationsManager.notifyAboutViewsRemoval(tagsToDelete);
    super.manageChildren(tag, indicesToRemove, viewsToAdd, null);
    if (toBeRemoved.containsKey(tag)) {
      ArrayList<View> childrenToBeRemoved = toBeRemoved.get(tag);
      for (View child : childrenToBeRemoved) {
        viewGroupManager.addView(viewGroup, child, viewGroupManager.getChildCount(viewGroup));
      }
    }
    super.manageChildren(tag, null, null, tagsToDelete);
  }

  public void publicDropView(View view) {
    dropView(view);
  }

  @Override
  protected synchronized void dropView(View view) {
    if (isLayoutAnimationDisabled()) {
      super.dropView(view);
      return;
    }
    if (toBeRemoved.containsKey(view.getId())) {
      toBeRemoved.remove(view.getId());
    }
    if (cleanerCallback.containsKey(view.getId())) {
      Runnable runnable = cleanerCallback.get(view.getId());
      cleanerCallback.remove(view.getId());
      runnable.run();
    }
    // childrens' callbacks should be cleaned by former publicDropView calls as Animation Manager
    // stripes views from bottom to top
    super.dropView(view);
  }
}

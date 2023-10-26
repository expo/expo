package com.swmansion.reanimated.layoutReanimation;

import android.app.Activity;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.view.ReactViewGroup;
import com.swmansion.reanimated.Utils;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.Nullable;

public class SharedTransitionManager {
  private final AnimationsManager mAnimationsManager;
  private NativeMethodsHolder mNativeMethodsHolder;
  private final List<View> mAddedSharedViews = new ArrayList<>();
  private final Map<Integer, View> mSharedTransitionParent = new HashMap<>();
  private final Map<Integer, Integer> mSharedTransitionInParentIndex = new HashMap<>();
  private boolean mIsSharedTransitionActive;
  private final Map<Integer, Snapshot> mSnapshotRegistry = new HashMap<>();
  private final Map<Integer, View> mCurrentSharedTransitionViews = new HashMap<>();
  private View mTransitionContainer;
  private final List<View> mRemovedSharedViews = new ArrayList<>();
  private final Set<Integer> mViewTagsToHide = new HashSet<>();
  private final Map<Integer, Integer> mDisableCleaningForViewTag = new HashMap<>();
  private List<SharedElement> mSharedElements = new ArrayList<>();
  private Map<Integer, SharedElement> mSharedElementsLookup = new HashMap<>();
  private final List<SharedElement> mSharedElementsWithProgress = new ArrayList<>();
  private final List<SharedElement> mSharedElementsWithAnimation = new ArrayList<>();
  private final Map<Integer, View> mViewsWithCanceledAnimation = new HashMap<>();

  public SharedTransitionManager(AnimationsManager animationsManager) {
    mAnimationsManager = animationsManager;
  }

  protected void notifyAboutNewView(View view) {
    mAddedSharedViews.add(view);
  }

  protected void notifyAboutRemovedView(View view) {
    mRemovedSharedViews.add(view);
  }

  @Nullable
  protected View getTransitioningView(int tag) {
    return mCurrentSharedTransitionViews.get(tag);
  }

  protected void screenDidLayout() {
    tryStartSharedTransitionForViews(mAddedSharedViews, true);
    mAddedSharedViews.clear();
  }

  protected void viewDidLayout(View view) {
    maybeRestartAnimationWithNewLayout(view);
  }

  protected void onViewsRemoval(int[] tagsToDelete) {
    if (tagsToDelete == null) {
      return;
    }
    visitTreeForTags(tagsToDelete, new SnapshotTreeVisitor());
    if (mRemovedSharedViews.size() > 0) {
      // this happens when navigation goes back
      boolean animationStarted = tryStartSharedTransitionForViews(mRemovedSharedViews, false);
      if (!animationStarted) {
        mRemovedSharedViews.clear();
      }
      visitTreeForTags(tagsToDelete, new ConfigCleanerTreeVisitor());
    } else if (mCurrentSharedTransitionViews.size() > 0) {
      // this happens when navigation goes back and previous shared animation is still running
      List<View> viewsWithNewTransition = new ArrayList<>();
      for (View view : mCurrentSharedTransitionViews.values()) {
        for (int tagToDelete : tagsToDelete) {
          if (isViewChildParentWithTag(view, tagToDelete)) {
            viewsWithNewTransition.add(view);
          }
        }
      }
      tryStartSharedTransitionForViews(viewsWithNewTransition, false);
      for (View view : viewsWithNewTransition) {
        clearAllSharedConfigsForView(view);
      }
    }
  }

  private boolean isViewChildParentWithTag(View view, int parentTag) {
    View parent = mSharedTransitionParent.get(view.getId());
    while (parent != null) {
      if (parent.getId() == parentTag) {
        return true;
      }
      if (parent.getClass().getSimpleName().equals("Screen")) {
        return false;
      }
      if (parent instanceof View) {
        parent = (View) parent.getParent();
      } else {
        return false;
      }
    }
    return false;
  }

  protected void doSnapshotForTopScreenViews(ViewGroup stack) {
    int screensCount = stack.getChildCount();
    if (screensCount > 0) {
      View firstStackChild = stack.getChildAt(0);
      if (firstStackChild instanceof ViewGroup) {
        View screen = ((ViewGroup) firstStackChild).getChildAt(0);
        visitNativeTreeAndMakeSnapshot(screen);
      } else {
        Log.e("[Reanimated]", "Unable to recognize screen on stack.");
      }
    }
  }

  protected void setNativeMethods(NativeMethodsHolder nativeMethods) {
    mNativeMethodsHolder = nativeMethods;
  }

  private void maybeRestartAnimationWithNewLayout(View view) {
    View sharedView = mCurrentSharedTransitionViews.get(view.getId());
    if (sharedView == null) {
      return;
    }
    List<SharedElement> sharedElementsToRestart = new ArrayList<>();
    for (SharedElement sharedElement : mSharedElements) {
      if (sharedElement.targetView == sharedView) {
        sharedElementsToRestart.add(sharedElement);
        View sourceView = sharedElement.sourceView;
        View targetView = sharedElement.targetView;

        Snapshot newSourceViewSnapshot = new Snapshot(sourceView);
        Snapshot currentTargetViewSnapshot = mSnapshotRegistry.get(targetView.getId());
        Snapshot newTargetViewSnapshot = new Snapshot(targetView);

        int newOriginX =
            currentTargetViewSnapshot.originX
                - currentTargetViewSnapshot.originXByParent
                + newTargetViewSnapshot.originX;
        int newOriginY =
            currentTargetViewSnapshot.originY
                - currentTargetViewSnapshot.originYByParent
                + newTargetViewSnapshot.originY;

        currentTargetViewSnapshot.originX = newOriginX;
        currentTargetViewSnapshot.originY = newOriginY;
        currentTargetViewSnapshot.globalOriginX = newOriginX;
        currentTargetViewSnapshot.globalOriginY = newOriginY;
        currentTargetViewSnapshot.originXByParent = newTargetViewSnapshot.originXByParent;
        currentTargetViewSnapshot.originYByParent = newTargetViewSnapshot.originYByParent;
        currentTargetViewSnapshot.height = newTargetViewSnapshot.height;
        currentTargetViewSnapshot.width = newTargetViewSnapshot.width;
        sharedElement.sourceViewSnapshot = newSourceViewSnapshot;
        sharedElement.targetViewSnapshot = currentTargetViewSnapshot;

        disableCleaningForViewTag(sourceView.getId());
        disableCleaningForViewTag(targetView.getId());
      }
    }
    startSharedTransition(
        sharedElementsToRestart, LayoutAnimations.Types.SHARED_ELEMENT_TRANSITION);
  }

  private boolean tryStartSharedTransitionForViews(
      List<View> sharedViews, boolean withNewElements) {
    if (sharedViews.isEmpty()) {
      return false;
    }
    sortViewsByTags(sharedViews);
    List<SharedElement> sharedElements =
        getSharedElementsForCurrentTransition(sharedViews, withNewElements);
    if (sharedElements.isEmpty()) {
      return false;
    }
    setupTransitionContainer();
    reparentSharedViewsForCurrentTransition(sharedElements);
    orderByAnimationTypes(sharedElements);
    startSharedTransition(
        mSharedElementsWithAnimation, LayoutAnimations.Types.SHARED_ELEMENT_TRANSITION);
    startSharedTransition(
        mSharedElementsWithProgress, LayoutAnimations.Types.SHARED_ELEMENT_TRANSITION_PROGRESS);
    return true;
  }

  private void sortViewsByTags(List<View> views) {
    /*
      All shared views during the transition have the same parent. It is problematic if parent
      view and their children are in the same transition. To keep the valid order in the z-axis,
      we need to sort views by tags. Parent tag is lower than children tags.
    */
    Collections.sort(views, (v1, v2) -> Integer.compare(v2.getId(), v1.getId()));
  }

  private List<SharedElement> getSharedElementsForCurrentTransition(
      List<View> sharedViews, boolean addedNewScreen) {
    List<View> newTransitionViews = new ArrayList<>();
    Set<Integer> viewTags = new HashSet<>();
    if (!addedNewScreen) {
      for (View view : sharedViews) {
        viewTags.add(view.getId());
      }
    }
    List<SharedElement> sharedElements = new ArrayList<>();
    ReanimatedNativeHierarchyManager reanimatedNativeHierarchyManager =
        mAnimationsManager.getReanimatedNativeHierarchyManager();
    for (View sharedView : sharedViews) {
      int targetViewTag =
          mNativeMethodsHolder.findPrecedingViewTagForTransition(sharedView.getId());
      boolean bothAreRemoved = !addedNewScreen && viewTags.contains(targetViewTag);
      if (targetViewTag < 0) {
        continue;
      }
      View viewSource, viewTarget;
      if (addedNewScreen) {
        viewSource = reanimatedNativeHierarchyManager.resolveView(targetViewTag);
        viewTarget = sharedView;
      } else {
        viewSource = sharedView;
        viewTarget = reanimatedNativeHierarchyManager.resolveView(targetViewTag);
      }
      if (bothAreRemoved) {
        // case for nested stack
        clearAllSharedConfigsForView(viewSource);
        clearAllSharedConfigsForView(viewTarget);
        continue;
      }

      boolean isSourceViewInTransition =
          mCurrentSharedTransitionViews.containsKey(viewSource.getId());
      boolean isTargetViewInTransition =
          mCurrentSharedTransitionViews.containsKey(viewTarget.getId());

      if (!(isSourceViewInTransition || isTargetViewInTransition)) {
        View viewSourceScreen = findScreen(viewSource);
        View viewTargetScreen = findScreen(viewTarget);
        if (viewSourceScreen == null || viewTargetScreen == null) {
          continue;
        }

        ViewGroup stack = (ViewGroup) findStack(viewSourceScreen);
        if (stack == null) {
          continue;
        }

        ViewGroupManager stackViewGroupManager =
            (ViewGroupManager) reanimatedNativeHierarchyManager.resolveViewManager(stack.getId());
        int screensCount = stackViewGroupManager.getChildCount(stack);

        if (screensCount < 2) {
          continue;
        }

        View topScreen = stackViewGroupManager.getChildAt(stack, screensCount - 1);
        View secondScreen = stackViewGroupManager.getChildAt(stack, screensCount - 2);
        boolean isValidConfiguration;
        if (addedNewScreen) {
          isValidConfiguration =
              secondScreen.getId() == viewSourceScreen.getId()
                  && topScreen.getId() == viewTargetScreen.getId();
        } else {
          isValidConfiguration =
              topScreen.getId() == viewSourceScreen.getId()
                  && secondScreen.getId() == viewTargetScreen.getId();
        }
        if (!isValidConfiguration) {
          continue;
        }
      }

      Snapshot sourceViewSnapshot = null;
      if (addedNewScreen) {
        mViewTagsToHide.add(viewSource.getId());
        if (isSourceViewInTransition) {
          sourceViewSnapshot = new Snapshot(viewSource);
        } else {
          makeSnapshot(viewSource);
        }
        makeSnapshot(viewTarget);
      } else if (isSourceViewInTransition) {
        makeSnapshot(viewSource);
      }
      if (sourceViewSnapshot == null) {
        sourceViewSnapshot = mSnapshotRegistry.get(viewSource.getId());
      }
      Snapshot targetViewSnapshot = mSnapshotRegistry.get(viewTarget.getId());

      newTransitionViews.add(viewSource);
      newTransitionViews.add(viewTarget);

      SharedElement sharedElement =
          new SharedElement(viewSource, sourceViewSnapshot, viewTarget, targetViewSnapshot);
      sharedElements.add(sharedElement);
    }

    if (!newTransitionViews.isEmpty()) {
      for (View view : mCurrentSharedTransitionViews.values()) {
        if (newTransitionViews.contains(view)) {
          disableCleaningForViewTag(view.getId());
        } else {
          mViewsWithCanceledAnimation.put(view.getId(), view);
        }
      }
      mCurrentSharedTransitionViews.clear();
      for (View view : newTransitionViews) {
        mCurrentSharedTransitionViews.put(view.getId(), view);
      }
      List<View> viewsWithCanceledAnimation = new ArrayList<>(mViewsWithCanceledAnimation.values());
      for (View view : viewsWithCanceledAnimation) {
        cancelAnimation(view);
        finishSharedAnimation(view.getId());
      }
    }

    mSharedElements = sharedElements;
    for (SharedElement sharedElement : sharedElements) {
      mSharedElementsLookup.put(sharedElement.sourceView.getId(), sharedElement);
    }
    return sharedElements;
  }

  private void setupTransitionContainer() {
    if (!mIsSharedTransitionActive) {
      mIsSharedTransitionActive = true;
      ReactContext context = mAnimationsManager.getContext();
      Activity currentActivity = context.getCurrentActivity();
      if (currentActivity == null) {
        return;
      }
      ViewGroup rootView = (ViewGroup) currentActivity.getWindow().getDecorView().getRootView();
      if (mTransitionContainer == null) {
        mTransitionContainer = new ReactViewGroup(context);
      }
      rootView.addView(mTransitionContainer);
      mTransitionContainer.bringToFront();
    }
  }

  private void reparentSharedViewsForCurrentTransition(List<SharedElement> sharedElements) {
    for (SharedElement sharedElement : sharedElements) {
      View viewSource = sharedElement.sourceView;
      if (!mSharedTransitionParent.containsKey(viewSource.getId())) {
        mSharedTransitionParent.put(viewSource.getId(), (View) viewSource.getParent());
        mSharedTransitionInParentIndex.put(
            viewSource.getId(), ((ViewGroup) viewSource.getParent()).indexOfChild(viewSource));
        ((ViewGroup) viewSource.getParent()).removeView(viewSource);
        ((ViewGroup) mTransitionContainer).addView(viewSource);
      }
    }
  }

  private void startSharedTransition(List<SharedElement> sharedElements, int type) {
    for (SharedElement sharedElement : sharedElements) {
      startSharedAnimationForView(
          sharedElement.sourceView,
          sharedElement.sourceViewSnapshot,
          sharedElement.targetViewSnapshot,
          type);
      sharedElement.targetView.setVisibility(View.INVISIBLE);
    }
  }

  private void startSharedAnimationForView(View view, Snapshot before, Snapshot after, int type) {
    HashMap<String, Object> targetValues = after.toTargetMap();
    HashMap<String, Object> startValues = before.toCurrentMap();

    HashMap<String, Object> preparedStartValues =
        mAnimationsManager.prepareDataForAnimationWorklet(startValues, false, true);
    HashMap<String, Object> preparedTargetValues =
        mAnimationsManager.prepareDataForAnimationWorklet(targetValues, true, true);
    HashMap<String, Object> preparedValues = new HashMap<>(preparedTargetValues);
    preparedValues.putAll(preparedStartValues);

    mNativeMethodsHolder.startAnimation(view.getId(), type, preparedValues);
  }

  protected void finishSharedAnimation(int tag) {
    if (mDisableCleaningForViewTag.containsKey(tag)) {
      enableCleaningForViewTag(tag);
      return;
    }
    View view = mCurrentSharedTransitionViews.get(tag);
    if (view == null) {
      view = mViewsWithCanceledAnimation.get(tag);
      if (view != null) {
        mViewsWithCanceledAnimation.remove(view.getId());
      }
    }
    if (view != null) {
      int viewTag = view.getId();
      ((ViewGroup) mTransitionContainer).removeView(view);
      View parentView = mSharedTransitionParent.get(viewTag);
      int childIndex = mSharedTransitionInParentIndex.get(viewTag);
      ViewGroup parentViewGroup = ((ViewGroup) parentView);
      if (childIndex <= parentViewGroup.getChildCount()) {
        parentViewGroup.addView(view, childIndex);
      } else {
        parentViewGroup.addView(view);
      }
      Snapshot viewSourcePreviousSnapshot = mSnapshotRegistry.get(viewTag);
      if (viewSourcePreviousSnapshot != null) {
        int originY = viewSourcePreviousSnapshot.originY;
        if (findStack(view) == null) {
          viewSourcePreviousSnapshot.originY = viewSourcePreviousSnapshot.originYByParent;
        }
        Map<String, Object> snapshotMap = viewSourcePreviousSnapshot.toBasicMap();
        Map<String, Object> preparedValues = new HashMap<>();
        for (String key : snapshotMap.keySet()) {
          Object value = snapshotMap.get(key);
          if (key.equals(Snapshot.TRANSFORM_MATRIX)) {
            preparedValues.put(key, value);
          } else {
            float pixelsValue = Utils.convertToFloat(value);
            double dipValue = PixelUtil.toDIPFromPixel(pixelsValue);
            preparedValues.put(key, dipValue);
          }
        }
        mAnimationsManager.progressLayoutAnimation(viewTag, preparedValues, true);
        viewSourcePreviousSnapshot.originY = originY;
      }
      if (mViewTagsToHide.contains(tag)) {
        view.setVisibility(View.INVISIBLE);
      }

      SharedElement sharedElement = mSharedElementsLookup.get(viewTag);
      if (sharedElement != null) {
        View targetView = sharedElement.targetView;
        Integer targetViewTag = targetView.getId();
        targetView.setVisibility(View.VISIBLE);
        mCurrentSharedTransitionViews.remove(targetViewTag);
        mViewsWithCanceledAnimation.remove(targetViewTag);
      }

      mCurrentSharedTransitionViews.remove(viewTag);
      mSharedTransitionParent.remove(viewTag);
      mSharedTransitionInParentIndex.remove(viewTag);

      if (mRemovedSharedViews.contains(view)) {
        mNativeMethodsHolder.clearAnimationConfig(view.getId());
        mRemovedSharedViews.remove(view);
      }
    }
    if (mCurrentSharedTransitionViews.isEmpty()) {
      if (mTransitionContainer != null) {
        ViewParent transitionContainerParent = mTransitionContainer.getParent();
        if (transitionContainerParent != null) {
          mTransitionContainer.setVisibility(View.INVISIBLE);
          // To prevent modifications of the views tree while Android is iterating
          // over them, we can schedule the modification for the next frame. This
          // approach is safe. The transparent transition container will remain on
          // the screen for one additional frame before being removed.
          mTransitionContainer.post(
              () -> {
                ((ViewGroup) transitionContainerParent).removeView(mTransitionContainer);
                mTransitionContainer.setVisibility(View.VISIBLE);
              });
        }
      }
      mSharedElements.clear();
      mSharedElementsLookup.clear();
      mSharedElementsWithProgress.clear();
      mSharedElementsWithAnimation.clear();
      mRemovedSharedViews.clear();
      mViewTagsToHide.clear();
      mIsSharedTransitionActive = false;
    }
  }

  @Nullable
  private View findScreen(View view) {
    ViewParent parent = view.getParent();
    while (parent != null) {
      if (parent.getClass().getSimpleName().equals("Screen")) {
        return (View) parent;
      }
      parent = parent.getParent();
    }
    return null;
  }

  @Nullable
  private View findStack(View view) {
    ViewParent parent = view.getParent();
    while (parent != null) {
      if (parent.getClass().getSimpleName().equals("ScreenStack")) {
        return (View) parent;
      }
      parent = parent.getParent();
    }
    return null;
  }

  protected void makeSnapshot(View view) {
    Snapshot snapshot = new Snapshot(view);
    mSnapshotRegistry.put(view.getId(), snapshot);
  }

  interface TreeVisitor {
    void run(View view);
  }

  class SnapshotTreeVisitor implements TreeVisitor {
    public void run(View view) {
      if (mAnimationsManager.hasAnimationForTag(
          view.getId(), LayoutAnimations.Types.SHARED_ELEMENT_TRANSITION)) {
        mRemovedSharedViews.add(view);
        makeSnapshot(view);
      }
    }
  }

  class ConfigCleanerTreeVisitor implements TreeVisitor {
    public void run(View view) {
      mNativeMethodsHolder.clearAnimationConfig(view.getId());
    }
  }

  protected void visitTreeForTags(int[] viewTags, TreeVisitor treeVisitor) {
    if (viewTags == null) {
      return;
    }
    ReanimatedNativeHierarchyManager reanimatedNativeHierarchyManager =
        mAnimationsManager.getReanimatedNativeHierarchyManager();
    for (int viewTag : viewTags) {
      View view = reanimatedNativeHierarchyManager.resolveView(viewTag);
      visitTree(view, treeVisitor);
    }
  }

  private void visitTree(View view, TreeVisitor treeVisitor) {
    int tag = view.getId();
    if (tag == -1) {
      return;
    }
    ViewGroup viewGroup;
    ViewGroupManager<ViewGroup> viewGroupManager = null;
    ReanimatedNativeHierarchyManager reanimatedNativeHierarchyManager =
        mAnimationsManager.getReanimatedNativeHierarchyManager();
    try {
      treeVisitor.run(view);

      if (!(view instanceof ViewGroup)) {
        return;
      }
      viewGroup = (ViewGroup) view;
      ViewManager viewManager = reanimatedNativeHierarchyManager.resolveViewManager(tag);
      if (viewManager instanceof ViewGroupManager) {
        viewGroupManager = (ViewGroupManager<ViewGroup>) viewManager;
      }
    } catch (IllegalViewOperationException e) {
      return;
    }
    if (viewGroupManager == null) {
      return;
    }
    for (int i = 0; i < viewGroupManager.getChildCount(viewGroup); i++) {
      View child = viewGroupManager.getChildAt(viewGroup, i);
      visitTree(child, treeVisitor);
    }
  }

  void visitNativeTreeAndMakeSnapshot(View view) {
    if (!(view instanceof ViewGroup)) {
      return;
    }
    ViewGroup viewGroup = (ViewGroup) view;
    if (mAnimationsManager.hasAnimationForTag(
        view.getId(), LayoutAnimations.Types.SHARED_ELEMENT_TRANSITION)) {
      makeSnapshot(view);
    }
    for (int i = 0; i < viewGroup.getChildCount(); i++) {
      View child = viewGroup.getChildAt(i);
      visitNativeTreeAndMakeSnapshot(child);
    }
  }

  private void clearAllSharedConfigsForView(View view) {
    int viewTag = view.getId();
    mSnapshotRegistry.remove(viewTag);
    mNativeMethodsHolder.clearAnimationConfig(viewTag);
  }

  private void cancelAnimation(View view) {
    int viewTag = view.getId();
    mNativeMethodsHolder.cancelAnimation(viewTag);
  }

  private void disableCleaningForViewTag(int viewTag) {
    Integer counter = mDisableCleaningForViewTag.get(viewTag);
    if (counter != null) {
      mDisableCleaningForViewTag.put(viewTag, counter + 1);
    } else {
      mDisableCleaningForViewTag.put(viewTag, 1);
    }
  }

  private void enableCleaningForViewTag(int viewTag) {
    Integer counter = mDisableCleaningForViewTag.get(viewTag);
    if (counter == null) {
      return;
    }
    if (counter == 1) {
      mDisableCleaningForViewTag.remove(viewTag);
    } else {
      mDisableCleaningForViewTag.put(viewTag, counter - 1);
    }
  }

  void orderByAnimationTypes(List<SharedElement> sharedElements) {
    mSharedElementsWithProgress.clear();
    mSharedElementsWithAnimation.clear();
    for (SharedElement sharedElement : sharedElements) {
      int viewTag = sharedElement.sourceView.getId();
      boolean viewHasProgressAnimation =
          mAnimationsManager.hasAnimationForTag(
              viewTag, LayoutAnimations.Types.SHARED_ELEMENT_TRANSITION_PROGRESS);
      if (viewHasProgressAnimation) {
        mSharedElementsWithProgress.add(sharedElement);
      } else {
        mSharedElementsWithAnimation.add(sharedElement);
      }
    }
  }
}

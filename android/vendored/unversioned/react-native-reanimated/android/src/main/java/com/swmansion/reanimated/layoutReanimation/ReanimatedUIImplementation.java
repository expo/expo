package com.facebook.react.uimanager;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.swmansion.reanimated.layoutReanimation.ReanimatedNativeHierarchyManager;
import java.util.List;

public class ReanimatedUIImplementation extends UIImplementation {
  public ReanimatedUIImplementation(
      ReactApplicationContext reactContext,
      ViewManagerResolver viewManagerResolver,
      EventDispatcher eventDispatcher,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    this(
        reactContext,
        new ViewManagerRegistry(viewManagerResolver),
        eventDispatcher,
        minTimeLeftInFrameForNonBatchedOperationMs);
  }

  public ReanimatedUIImplementation(
      ReactApplicationContext reactContext,
      List<ViewManager> viewManagerList,
      EventDispatcher eventDispatcher,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    this(
        reactContext,
        new ViewManagerRegistry(viewManagerList),
        eventDispatcher,
        minTimeLeftInFrameForNonBatchedOperationMs);
  }

  public ReanimatedUIImplementation(
      ReactApplicationContext reactContext,
      ViewManagerRegistry viewManagerRegistry,
      EventDispatcher eventDispatcher,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    super(
        reactContext,
        viewManagerRegistry,
        new UIViewOperationQueue(
            reactContext,
            new ReanimatedNativeHierarchyManager(viewManagerRegistry, reactContext),
            minTimeLeftInFrameForNonBatchedOperationMs),
        eventDispatcher);
  }

  /**
   * Invoked when there is a mutation in a node tree.
   *
   * @param tag react tag of the node we want to manage
   * @param indicesToRemove ordered (asc) list of indicies at which view should be removed
   * @param viewsToAdd ordered (asc based on mIndex property) list of tag-index pairs that represent
   *     a view which should be added at the specified index
   * @param tagsToDelete list of tags corresponding to views that should be removed
   */
  public void manageChildren(
      int viewTag,
      @Nullable ReadableArray moveFrom,
      @Nullable ReadableArray moveTo,
      @Nullable ReadableArray addChildTags,
      @Nullable ReadableArray addAtIndices,
      @Nullable ReadableArray removeFrom) {
    super.manageChildren(viewTag, moveFrom, moveTo, addChildTags, addAtIndices, removeFrom);
  }
}

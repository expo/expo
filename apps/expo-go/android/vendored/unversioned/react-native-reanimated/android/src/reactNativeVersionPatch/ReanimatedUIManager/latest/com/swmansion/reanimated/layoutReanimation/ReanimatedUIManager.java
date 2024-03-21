package com.facebook.react.uimanager;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import java.util.List;

@ReactModule(name = UIManagerModule.NAME)
public class ReanimatedUIManager extends UIManagerModule {

  public ReanimatedUIManager(
      ReactApplicationContext reactContext,
      List<ViewManager> viewManagersList,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    super(reactContext, viewManagersList, minTimeLeftInFrameForNonBatchedOperationMs);
  }

  public void onBatchComplete() {
    super.onBatchComplete();
  }

  @Override
  public boolean canOverrideExistingModule() {
    return true;
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public @Nullable WritableMap getConstantsForViewManager(@Nullable String viewManagerName) {
    return super.getConstantsForViewManager(viewManagerName);
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public WritableMap getDefaultEventTypes() {
    return super.getDefaultEventTypes();
  }

  /** Unregisters a new root view. */
  @ReactMethod
  public void removeRootView(int rootViewTag) {
    super.removeRootView(rootViewTag);
  }

  @ReactMethod
  public void createView(int tag, String className, int rootViewTag, ReadableMap props) {
    super.createView(tag, className, rootViewTag, props);
  }

  @ReactMethod
  public void updateView(final int tag, final String className, final ReadableMap props) {
    super.updateView(tag, className, props);
  }

  /**
   * Interface for adding/removing/moving views within a parent view from JS.
   *
   * @param viewTag the view tag of the parent view
   * @param moveFrom a list of indices in the parent view to move views from
   * @param moveTo parallel to moveFrom, a list of indices in the parent view to move views to
   * @param addChildTags a list of tags of views to add to the parent
   * @param addAtIndices parallel to addChildTags, a list of indices to insert those children at
   * @param removeFrom a list of indices of views to permanently remove. The memory for the
   *     corresponding views and data structures should be reclaimed.
   */
  @ReactMethod
  public void manageChildren(
      int viewTag,
      @Nullable ReadableArray moveFrom,
      @Nullable ReadableArray moveTo,
      @Nullable ReadableArray addChildTags,
      @Nullable ReadableArray addAtIndices,
      @Nullable ReadableArray removeFrom) {
    super.manageChildren(viewTag, moveFrom, moveTo, addChildTags, addAtIndices, removeFrom);
  }

  /**
   * Interface for fast tracking the initial adding of views. Children view tags are assumed to be
   * in order
   *
   * @param viewTag the view tag of the parent view
   * @param childrenTags An array of tags to add to the parent in order
   */
  @ReactMethod
  public void setChildren(int viewTag, ReadableArray childrenTags) {
    super.setChildren(viewTag, childrenTags);
  }

  /**
   * Determines the location on screen, width, and height of the given view and returns the values
   * via an async callback.
   */
  @ReactMethod
  public void measure(int reactTag, Callback callback) {
    super.measure(reactTag, callback);
  }

  /**
   * Determines the location on screen, width, and height of the given view relative to the device
   * screen and returns the values via an async callback. This is the absolute position including
   * things like the status bar
   */
  @ReactMethod
  public void measureInWindow(int reactTag, Callback callback) {
    super.measureInWindow(reactTag, callback);
  }

  /**
   * Measures the view specified by tag relative to the given ancestorTag. This means that the
   * returned x, y are relative to the origin x, y of the ancestor view. Results are stored in the
   * given outputBuffer. We allow ancestor view and measured view to be the same, in which case the
   * position always will be (0, 0) and method will only measure the view dimensions.
   *
   * <p>NB: Unlike {@link #measure}, this will measure relative to the view layout, not the visible
   * window which can cause unexpected results when measuring relative to things like ScrollViews
   * that can have offset content on the screen.
   */
  @ReactMethod
  public void measureLayout(
      int tag, int ancestorTag, Callback errorCallback, Callback successCallback) {
    super.measureLayout(tag, ancestorTag, errorCallback, successCallback);
  }

  /**
   * Like {@link #measure} and {@link #measureLayout} but measures relative to the immediate parent.
   *
   * <p>NB: Unlike {@link #measure}, this will measure relative to the view layout, not the visible
   * window which can cause unexpected results when measuring relative to things like ScrollViews
   * that can have offset content on the screen.
   *
   * @deprecated this method will not be available in FabricUIManager class.
   */
  @ReactMethod
  @Deprecated
  public void measureLayoutRelativeToParent(
      int tag, Callback errorCallback, Callback successCallback) {
    super.measureLayoutRelativeToParent(tag, errorCallback, successCallback);
  }

  /**
   * Find the touch target child native view in the supplied root view hierarchy, given a react
   * target location.
   *
   * <p>This method is currently used only by Element Inspector DevTool.
   *
   * @param reactTag the tag of the root view to traverse
   * @param point an array containing both X and Y target location
   * @param callback will be called if with the identified child view react ID, and measurement
   *     info. If no view was found, callback will be invoked with no data.
   */
  @ReactMethod
  public void findSubviewIn(
      final int reactTag, final ReadableArray point, final Callback callback) {
    super.findSubviewIn(reactTag, point, callback);
  }

  /**
   * Check if the first shadow node is the descendant of the second shadow node
   *
   * @deprecated this method will not be available in FabricUIManager class.
   */
  @ReactMethod
  @Deprecated
  public void viewIsDescendantOf(
      final int reactTag, final int ancestorReactTag, final Callback callback) {
    super.viewIsDescendantOf(reactTag, ancestorReactTag, callback);
  }

  @ReactMethod
  public void setJSResponder(int reactTag, boolean blockNativeResponder) {
    super.setJSResponder(reactTag, blockNativeResponder);
  }

  @ReactMethod
  public void clearJSResponder() {
    super.clearJSResponder();
  }

  @ReactMethod
  public void dispatchViewManagerCommand(
      int reactTag, Dynamic commandId, @Nullable ReadableArray commandArgs) {
    super.dispatchViewManagerCommand(reactTag, commandId, commandArgs);
  }

  /**
   * Show a PopupMenu.
   *
   * @param reactTag the tag of the anchor view (the PopupMenu is displayed next to this view); this
   *     needs to be the tag of a native view (shadow views can not be anchors)
   * @param items the menu items as an array of strings
   * @param error will be called if there is an error displaying the menu
   * @param success will be called with the position of the selected item as the first argument, or
   *     no arguments if the menu is dismissed
   */
  @ReactMethod
  public void showPopupMenu(int reactTag, ReadableArray items, Callback error, Callback success) {
    super.showPopupMenu(reactTag, items, error, success);
  }

  @ReactMethod
  public void dismissPopupMenu() {
    super.dismissPopupMenu();
  }

  /**
   * LayoutAnimation API on Android is currently experimental. Therefore, it needs to be enabled
   * explicitly in order to avoid regression in existing application written for iOS using this API.
   *
   * <p>Warning : This method will be removed in future version of React Native, and layout
   * animation will be enabled by default, so always check for its existence before invoking it.
   *
   * <p>TODO(9139831) : remove this method once layout animation is fully stable.
   *
   * @param enabled whether layout animation is enabled or not
   */
  @ReactMethod
  public void setLayoutAnimationEnabledExperimental(boolean enabled) {
    super.setLayoutAnimationEnabledExperimental(enabled);
  }

  /**
   * Configure an animation to be used for the native layout changes, and native views creation. The
   * animation will only apply during the current batch operations.
   *
   * <p>TODO(7728153) : animating view deletion is currently not supported.
   *
   * @param config the configuration of the animation for view addition/removal/update.
   * @param success will be called when the animation completes, or when the animation get
   *     interrupted. In this case, callback parameter will be false.
   * @param error will be called if there was an error processing the animation
   */
  @ReactMethod
  public void configureNextLayoutAnimation(ReadableMap config, Callback success, Callback error) {
    super.configureNextLayoutAnimation(config, success, error);
  }

  @ReactMethod
  public void sendAccessibilityEvent(int tag, int eventType) {
    super.sendAccessibilityEvent(tag, eventType);
  }
}

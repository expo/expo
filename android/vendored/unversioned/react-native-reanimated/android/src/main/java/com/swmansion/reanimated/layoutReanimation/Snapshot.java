package com.swmansion.reanimated.layoutReanimation;

import android.view.View;
import android.view.ViewGroup;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.ViewManager;
import com.swmansion.reanimated.ReactNativeUtils;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

public class Snapshot {
  public static final String WIDTH = "width";
  public static final String HEIGHT = "height";
  public static final String ORIGIN_X = "originX";
  public static final String ORIGIN_Y = "originY";
  public static final String TRANSFORM_MATRIX = "transformMatrix";
  public static final String GLOBAL_ORIGIN_X = "globalOriginX";
  public static final String GLOBAL_ORIGIN_Y = "globalOriginY";
  public static final String BORDER_RADIUS = "borderRadius";

  public static final String CURRENT_WIDTH = "currentWidth";
  public static final String CURRENT_HEIGHT = "currentHeight";
  public static final String CURRENT_ORIGIN_X = "currentOriginX";
  public static final String CURRENT_ORIGIN_Y = "currentOriginY";
  public static final String CURRENT_TRANSFORM_MATRIX = "currentTransformMatrix";
  public static final String CURRENT_GLOBAL_ORIGIN_X = "currentGlobalOriginX";
  public static final String CURRENT_GLOBAL_ORIGIN_Y = "currentGlobalOriginY";
  public static final String CURRENT_BORDER_RADIUS = "currentBorderRadius";

  public static final String TARGET_WIDTH = "targetWidth";
  public static final String TARGET_HEIGHT = "targetHeight";
  public static final String TARGET_ORIGIN_X = "targetOriginX";
  public static final String TARGET_ORIGIN_Y = "targetOriginY";
  public static final String TARGET_TRANSFORM_MATRIX = "targetTransformMatrix";
  public static final String TARGET_GLOBAL_ORIGIN_X = "targetGlobalOriginX";
  public static final String TARGET_GLOBAL_ORIGIN_Y = "targetGlobalOriginY";
  public static final String TARGET_BORDER_RADIUS = "targetBorderRadius";

  public View view;
  public ViewGroup parent;
  public ViewManager viewManager;
  public ViewManager parentViewManager;
  public int width;
  public int height;
  public int originX;
  public int originY;
  public int globalOriginX;
  public int globalOriginY;
  public List<Float> transformMatrix =
      new ArrayList<>(Arrays.asList(1f, 0f, 0f, 0f, 1f, 0f, 0f, 0f, 1f));
  public int originXByParent;
  public int originYByParent;
  public float borderRadius;
  private float[] identityMatrix = {1, 0, 0, 0, 1, 0, 0, 0, 1};

  public static ArrayList<String> targetKeysToTransform =
      new ArrayList<>(
          Arrays.asList(
              Snapshot.TARGET_WIDTH,
              Snapshot.TARGET_HEIGHT,
              Snapshot.TARGET_ORIGIN_X,
              Snapshot.TARGET_ORIGIN_Y,
              Snapshot.TARGET_GLOBAL_ORIGIN_X,
              Snapshot.TARGET_GLOBAL_ORIGIN_Y,
              Snapshot.TARGET_BORDER_RADIUS));
  public static ArrayList<String> currentKeysToTransform =
      new ArrayList<>(
          Arrays.asList(
              Snapshot.CURRENT_WIDTH,
              Snapshot.CURRENT_HEIGHT,
              Snapshot.CURRENT_ORIGIN_X,
              Snapshot.CURRENT_ORIGIN_Y,
              Snapshot.CURRENT_GLOBAL_ORIGIN_X,
              Snapshot.CURRENT_GLOBAL_ORIGIN_Y,
              Snapshot.CURRENT_BORDER_RADIUS));

  Snapshot(View view, NativeViewHierarchyManager viewHierarchyManager) {
    parent = (ViewGroup) view.getParent();
    try {
      viewManager = viewHierarchyManager.resolveViewManager(view.getId());
      parentViewManager = viewHierarchyManager.resolveViewManager(parent.getId());
    } catch (IllegalViewOperationException | NullPointerException e) {
      // do nothing
    }
    width = view.getWidth();
    height = view.getHeight();
    originX = view.getLeft();
    originY = view.getTop();
    this.view = view;
    int[] location = new int[2];
    view.getLocationOnScreen(location);
    globalOriginX = location[0];
    globalOriginY = location[1];
  }

  public Snapshot(View view) {
    int[] location = new int[2];
    view.getLocationOnScreen(location);
    originX = location[0];
    originY = location[1];
    width = view.getWidth();
    height = view.getHeight();

    View transformedView = findTransformedView(view);
    if (transformedView != null) {
      float[] transformMatrixArray = new float[9];
      transformedView.getMatrix().getValues(transformMatrixArray);
      transformMatrix = new ArrayList<>();
      for (int i = 0; i < 9; i++) {
        transformMatrix.add(transformMatrixArray[i]);
      }
      transformMatrix.set(0, transformedView.getScaleX());
      transformMatrix.set(4, transformedView.getScaleY());
      transformMatrix.set(2, transformedView.getTranslationX());
      transformMatrix.set(5, transformedView.getTranslationY());

      originX -= (width - width * transformedView.getScaleX()) / 2;
      originY -= (height - height * transformedView.getScaleY()) / 2;
    }
    originXByParent = view.getLeft();
    originYByParent = view.getTop();
    borderRadius = ReactNativeUtils.getBorderRadius(view);
  }

  private void addTargetConfig(HashMap<String, Object> data) {
    data.put(Snapshot.TARGET_ORIGIN_Y, originY);
    data.put(Snapshot.TARGET_ORIGIN_X, originX);
    data.put(Snapshot.TARGET_GLOBAL_ORIGIN_Y, globalOriginY);
    data.put(Snapshot.TARGET_GLOBAL_ORIGIN_X, globalOriginX);
    data.put(Snapshot.TARGET_HEIGHT, height);
    data.put(Snapshot.TARGET_WIDTH, width);
    data.put(Snapshot.TARGET_TRANSFORM_MATRIX, transformMatrix);
    data.put(Snapshot.TARGET_BORDER_RADIUS, borderRadius);
  }

  private void addCurrentConfig(HashMap<String, Object> data) {
    data.put(Snapshot.CURRENT_ORIGIN_Y, originY);
    data.put(Snapshot.CURRENT_ORIGIN_X, originX);
    data.put(Snapshot.CURRENT_GLOBAL_ORIGIN_Y, globalOriginY);
    data.put(Snapshot.CURRENT_GLOBAL_ORIGIN_X, globalOriginX);
    data.put(Snapshot.CURRENT_HEIGHT, height);
    data.put(Snapshot.CURRENT_WIDTH, width);
    data.put(Snapshot.CURRENT_TRANSFORM_MATRIX, transformMatrix);
    data.put(Snapshot.CURRENT_BORDER_RADIUS, borderRadius);
  }

  private void addBasicConfig(HashMap<String, Object> data) {
    data.put(Snapshot.ORIGIN_Y, originY);
    data.put(Snapshot.ORIGIN_X, originX);
    data.put(Snapshot.GLOBAL_ORIGIN_Y, globalOriginY);
    data.put(Snapshot.GLOBAL_ORIGIN_X, globalOriginX);
    data.put(Snapshot.HEIGHT, height);
    data.put(Snapshot.WIDTH, width);
    data.put(Snapshot.TRANSFORM_MATRIX, transformMatrix);
    data.put(Snapshot.BORDER_RADIUS, borderRadius);
  }

  public HashMap<String, Object> toTargetMap() {
    HashMap<String, Object> data = new HashMap<>();
    addTargetConfig(data);
    return data;
  }

  public HashMap<String, Object> toCurrentMap() {
    HashMap<String, Object> data = new HashMap<>();
    addCurrentConfig(data);
    return data;
  }

  public HashMap<String, Object> toBasicMap() {
    HashMap<String, Object> data = new HashMap<>();
    addBasicConfig(data);
    return data;
  }

  private View findTransformedView(View view) {
    View transformedView = null;
    boolean isTransformed = false;
    do {
      if (transformedView == null) {
        transformedView = view;
      } else {
        if (!(transformedView.getParent() instanceof View)) {
          break;
        }
        transformedView = (View) transformedView.getParent();
      }
      if (transformedView == null) {
        break;
      }
      float[] transformArray = new float[9];
      transformedView.getMatrix().getValues(transformArray);
      isTransformed = !Arrays.equals(transformArray, identityMatrix);
    } while (!isTransformed
        && transformedView != null
        && !transformedView.getClass().getSimpleName().equals("Screen"));
    return (isTransformed && transformedView != null) ? transformedView : null;
  }
}

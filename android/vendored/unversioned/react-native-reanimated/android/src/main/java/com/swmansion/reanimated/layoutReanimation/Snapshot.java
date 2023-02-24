package com.swmansion.reanimated.layoutReanimation;

import android.view.View;
import android.view.ViewGroup;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;

public class Snapshot {
  public static final String WIDTH = "width";
  public static final String HEIGHT = "height";
  public static final String ORIGIN_X = "originX";
  public static final String ORIGIN_Y = "originY";
  public static final String GLOBAL_ORIGIN_X = "globalOriginX";
  public static final String GLOBAL_ORIGIN_Y = "globalOriginY";

  public static final String CURRENT_WIDTH = "currentWidth";
  public static final String CURRENT_HEIGHT = "currentHeight";
  public static final String CURRENT_ORIGIN_X = "currentOriginX";
  public static final String CURRENT_ORIGIN_Y = "currentOriginY";
  public static final String CURRENT_GLOBAL_ORIGIN_X = "currentGlobalOriginX";
  public static final String CURRENT_GLOBAL_ORIGIN_Y = "currentGlobalOriginY";

  public static final String TARGET_WIDTH = "targetWidth";
  public static final String TARGET_HEIGHT = "targetHeight";
  public static final String TARGET_ORIGIN_X = "targetOriginX";
  public static final String TARGET_ORIGIN_Y = "targetOriginY";
  public static final String TARGET_GLOBAL_ORIGIN_X = "targetGlobalOriginX";
  public static final String TARGET_GLOBAL_ORIGIN_Y = "targetGlobalOriginY";

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

  public static ArrayList<String> targetKeysToTransform;
  public static ArrayList<String> currentKeysToTransform;

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

    targetKeysToTransform =
        new ArrayList<>(
            Arrays.asList(
                Snapshot.TARGET_WIDTH,
                Snapshot.TARGET_HEIGHT,
                Snapshot.TARGET_ORIGIN_X,
                Snapshot.TARGET_ORIGIN_Y,
                Snapshot.TARGET_GLOBAL_ORIGIN_X,
                Snapshot.TARGET_GLOBAL_ORIGIN_Y));
    currentKeysToTransform =
        new ArrayList<>(
            Arrays.asList(
                Snapshot.CURRENT_WIDTH,
                Snapshot.CURRENT_HEIGHT,
                Snapshot.CURRENT_ORIGIN_X,
                Snapshot.CURRENT_ORIGIN_Y,
                Snapshot.CURRENT_GLOBAL_ORIGIN_X,
                Snapshot.CURRENT_GLOBAL_ORIGIN_Y));
  }

  private void addTargetConfig(HashMap<String, Object> data) {
    data.put(Snapshot.TARGET_ORIGIN_Y, originY);
    data.put(Snapshot.TARGET_ORIGIN_X, originX);
    data.put(Snapshot.TARGET_GLOBAL_ORIGIN_Y, globalOriginY);
    data.put(Snapshot.TARGET_GLOBAL_ORIGIN_X, globalOriginX);
    data.put(Snapshot.TARGET_HEIGHT, height);
    data.put(Snapshot.TARGET_WIDTH, width);
  }

  private void addCurrentConfig(HashMap<String, Object> data) {
    data.put(Snapshot.CURRENT_ORIGIN_Y, originY);
    data.put(Snapshot.CURRENT_ORIGIN_X, originX);
    data.put(Snapshot.CURRENT_GLOBAL_ORIGIN_Y, globalOriginY);
    data.put(Snapshot.CURRENT_GLOBAL_ORIGIN_X, globalOriginX);
    data.put(Snapshot.CURRENT_HEIGHT, height);
    data.put(Snapshot.CURRENT_WIDTH, width);
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

  public HashMap<String, Object> toLayoutMap(Snapshot target) {
    HashMap<String, Object> data = target.toTargetMap();
    addCurrentConfig(data);
    return data;
  }
}

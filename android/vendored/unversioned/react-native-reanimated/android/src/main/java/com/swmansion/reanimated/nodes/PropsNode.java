package com.swmansion.reanimated.nodes;

import android.view.View;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.UIImplementation;
import com.swmansion.reanimated.NodesManager;
import com.swmansion.reanimated.Utils;
import java.util.Map;

public class PropsNode extends Node implements FinalNode {

  private final Map<String, Integer> mMapping;
  private final UIImplementation mUIImplementation;
  private int mConnectedViewTag = View.NO_ID;

  private final JavaOnlyMap mPropMap;
  private final ReactStylesDiffMap mDiffMap;

  private static void addProp(WritableMap propMap, String key, Object value) {
    if (value == null) {
      propMap.putNull(key);
    } else if (value instanceof Double) {
      propMap.putDouble(key, (Double) value);
    } else if (value instanceof Integer) {
      propMap.putInt(key, (Integer) value);
    } else if (value instanceof Number) {
      propMap.putDouble(key, ((Number) value).doubleValue());
    } else if (value instanceof Boolean) {
      propMap.putBoolean(key, (Boolean) value);
    } else if (value instanceof String) {
      propMap.putString(key, (String) value);
    } else if (value instanceof WritableArray) {
      propMap.putArray(key, (WritableArray) value);
    } else if (value instanceof WritableMap) {
      propMap.putMap(key, (WritableMap) value);
    } else {
      throw new IllegalStateException("Unknown type of animated value");
    }
  }

  public PropsNode(
      int nodeID,
      ReadableMap config,
      NodesManager nodesManager,
      UIImplementation uiImplementation) {
    super(nodeID, config, nodesManager);
    mMapping = Utils.processMapping(config.getMap("props"));
    mUIImplementation = uiImplementation;
    mPropMap = new JavaOnlyMap();
    mDiffMap = new ReactStylesDiffMap(mPropMap);
  }

  public void connectToView(int viewTag) {
    mConnectedViewTag = viewTag;
    dangerouslyRescheduleEvaluate();
  }

  public void disconnectFromView(int viewTag) {
    mConnectedViewTag = View.NO_ID;
  }

  @Override
  protected Double evaluate() {
    boolean hasUIProps = false;
    boolean hasNativeProps = false;
    boolean hasJSProps = false;
    WritableMap jsProps = Arguments.createMap();
    final WritableMap nativeProps = Arguments.createMap();

    for (Map.Entry<String, Integer> entry : mMapping.entrySet()) {
      Node node = mNodesManager.findNodeById(entry.getValue(), Node.class);
      if (node instanceof StyleNode) {
        WritableMap style = (WritableMap) node.value();
        ReadableMapKeySetIterator iter = style.keySetIterator();
        while (iter.hasNextKey()) {
          String key = iter.nextKey();
          WritableMap dest;
          if (mNodesManager.uiProps.contains(key)) {
            hasUIProps = true;
            dest = mPropMap;
          } else if (mNodesManager.nativeProps.contains(key)) {
            hasNativeProps = true;
            dest = nativeProps;
          } else {
            hasJSProps = true;
            dest = jsProps;
          }
          ReadableType type = style.getType(key);
          switch (type) {
            case Number:
              dest.putDouble(key, style.getDouble(key));
              break;
            case String:
              dest.putString(key, style.getString(key));
              break;
            case Array:
              dest.putArray(key, (WritableArray) style.getArray(key));
              break;
            default:
              throw new IllegalArgumentException("Unexpected type " + type);
          }
        }
      } else {
        String key = entry.getKey();
        Object value = node.value();
        if (mNodesManager.uiProps.contains(key)) {
          hasUIProps = true;
          addProp(mPropMap, key, value);
        } else {
          hasNativeProps = true;
          addProp(nativeProps, key, value);
        }
      }
    }

    if (mConnectedViewTag != View.NO_ID) {
      if (hasUIProps) {
        mUIImplementation.synchronouslyUpdateViewOnUIThread(mConnectedViewTag, mDiffMap);
      }
      if (hasNativeProps) {
        mNodesManager.enqueueUpdateViewOnNativeThread(mConnectedViewTag, nativeProps, false);
      }
      if (hasJSProps) {
        WritableMap evt = Arguments.createMap();
        evt.putInt("viewTag", mConnectedViewTag);
        evt.putMap("props", jsProps);
        mNodesManager.sendEvent("onReanimatedPropsChange", evt);
      }
    }

    return ZERO;
  }

  @Override
  public void update() {
    // Since we are updating nodes after detaching them from views there is a time where it's
    // possible that the view was disconnected and still receive an update, this is normal and
    // we can simply skip that update.
    if (mConnectedViewTag == View.NO_ID) {
      return;
    }

    // call value for side effect (diff map update via changes made to prop map)
    value();
  }
}

package abi29_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import android.view.View;

import abi29_0_0.com.facebook.react.bridge.Arguments;
import abi29_0_0.com.facebook.react.bridge.JavaOnlyMap;
import abi29_0_0.com.facebook.react.bridge.ReadableMap;
import abi29_0_0.com.facebook.react.bridge.ReadableMapKeySetIterator;
import abi29_0_0.com.facebook.react.bridge.ReadableType;
import abi29_0_0.com.facebook.react.bridge.WritableArray;
import abi29_0_0.com.facebook.react.bridge.WritableMap;
import abi29_0_0.com.facebook.react.uimanager.ReactStylesDiffMap;
import abi29_0_0.com.facebook.react.uimanager.UIImplementation;
import abi29_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;
import abi29_0_0.host.exp.exponent.modules.api.reanimated.Utils;

import java.util.Map;

public class PropsNode extends Node<Double> implements FinalNode {

  private final Map<String, Integer> mMapping;
  private final UIImplementation mUIImplementation;
  private int mConnectedViewTag = View.NO_ID;

  private final JavaOnlyMap mPropMap;
  private final ReactStylesDiffMap mDiffMap;

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
    boolean hasNativeProps = false;
    boolean hasJSProps = false;
    WritableMap jsProps = Arguments.createMap();

    for (Map.Entry<String, Integer> entry : mMapping.entrySet()) {
      Node node = mNodesManager.findNodeById(entry.getValue(), Node.class);
      if (node instanceof StyleNode) {
        WritableMap style = ((StyleNode) node).value();
        ReadableMapKeySetIterator iter = style.keySetIterator();
        while (iter.hasNextKey()) {
          String key = iter.nextKey();
          WritableMap dest;
          if (mNodesManager.nativeProps.contains(key)) {
            hasNativeProps = true;
            dest = mPropMap;
          } else {
            hasJSProps = true;
            dest = jsProps;
          }
          ReadableType type = style.getType(key);
          switch (type) {
            case Number:
              dest.putDouble(key, style.getDouble(key));
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
        if (mNodesManager.nativeProps.contains(key)) {
          hasNativeProps = true;
          mPropMap.putDouble(key, node.doubleValue());
        } else {
          hasJSProps = true;
          jsProps.putDouble(key, node.doubleValue());
        }
      }
    }

    if (mConnectedViewTag != View.NO_ID) {
      if (hasNativeProps) {
        mUIImplementation.synchronouslyUpdateViewOnUIThread(
                mConnectedViewTag,
                mDiffMap);
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

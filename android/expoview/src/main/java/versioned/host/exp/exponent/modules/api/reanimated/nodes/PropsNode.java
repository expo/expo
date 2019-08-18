package versioned.host.exp.exponent.modules.api.reanimated.nodes;

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
import versioned.host.exp.exponent.modules.api.reanimated.NodesManager;
import versioned.host.exp.exponent.modules.api.reanimated.Utils;

import java.util.Map;

public class PropsNode extends Node implements FinalNode {

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
          } else if (mNodesManager.nativeProps.contains(key)){
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
        if (mNodesManager.uiProps.contains(key)) {
          hasUIProps = true;
          mPropMap.putDouble(key, node.doubleValue());
        } else {
          hasNativeProps = true;
          nativeProps.putDouble(key, node.doubleValue());
        }
      }
    }

    if (mConnectedViewTag != View.NO_ID) {
      if (hasUIProps) {
        mUIImplementation.synchronouslyUpdateViewOnUIThread(
                mConnectedViewTag,
                mDiffMap);
      }
      if (hasNativeProps) {
        mNodesManager.enqueueUpdateViewOnNativeThread(mConnectedViewTag, nativeProps);
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

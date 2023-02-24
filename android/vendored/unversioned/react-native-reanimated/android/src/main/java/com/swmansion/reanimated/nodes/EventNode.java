package com.swmansion.reanimated.nodes;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.swmansion.reanimated.NodesManager;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;

public class EventNode extends Node implements RCTEventEmitter {

  private static class EventMap {
    private final int nodeID;
    private final String[] path;

    public EventMap(ReadableArray eventPath) {
      int size = eventPath.size();
      path = new String[size - 1];
      for (int i = 0; i < size - 1; i++) {
        path[i] = eventPath.getString(i);
      }
      nodeID = eventPath.getInt(size - 1);
    }

    public Double lookupValue(ReadableMap event) {
      ReadableMap map = event;
      for (int i = 0; map != null && i < path.length - 1; i++) {
        String key = path[i];
        map = map.hasKey(key) ? map.getMap(key) : null;
      }
      if (map != null) {
        String key = path[path.length - 1];
        return map.hasKey(key) ? map.getDouble(key) : null;
      }
      return null;
    }
  }

  private static List<EventMap> processMapping(ReadableArray mapping) {
    int size = mapping.size();
    List<EventMap> res = new ArrayList<>(size);
    for (int i = 0; i < size; i++) {
      res.add(new EventMap(mapping.getArray(i)));
    }
    return res;
  }

  private final List<EventMap> mMapping;

  public EventNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mMapping = processMapping(config.getArray("argMapping"));
  }

  @Override
  public void receiveEvent(int targetTag, String eventName, @Nullable WritableMap event) {
    if (event == null) {
      throw new IllegalArgumentException("Animated events must have event data.");
    }

    for (int i = 0; i < mMapping.size(); i++) {
      EventMap eventMap = mMapping.get(i);
      Double value = eventMap.lookupValue(event);
      if (value != null) {
        mNodesManager.findNodeById(eventMap.nodeID, ValueNode.class).setValue(value);
      }
    }
  }

  @Override
  public void receiveTouches(
      String eventName, WritableArray touches, WritableArray changedIndices) {
    throw new RuntimeException("receiveTouches is not support by animated events");
  }

  @Override
  protected Double evaluate() {
    return ZERO;
  }
}

package com.swmansion.reanimated.nodes;

import com.swmansion.reanimated.NodesManager;

/**
 * This node is used by {@link NodesManager} to return in place of a missing node that might have
 * been requested. This way we avoid a top of null-checks and we make nodes manager compatible with
 * the iOS code which does not crash for missing nodes. In most of the cases it is desirable to
 * handle missing nodes gracefully as it usually means the node hasn't been hooked under animated
 * view prop but is referenced in the graph (e.g. to support some edge case).
 */
public class NoopNode extends ValueNode {

  public NoopNode(NodesManager nodesManager) {
    super(-2, null, nodesManager);
  }

  @Override
  public void setValue(Object value) {
    // no-op
  }

  @Override
  public void addChild(Node child) {
    // no-op
  }

  @Override
  public void removeChild(Node child) {
    // no-op
  }

  @Override
  protected void markUpdated() {
    // no-op
  }
}

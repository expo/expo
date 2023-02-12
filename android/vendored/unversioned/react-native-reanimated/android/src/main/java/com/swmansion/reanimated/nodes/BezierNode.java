package com.swmansion.reanimated.nodes;

import android.graphics.PointF;
import com.facebook.react.bridge.ReadableMap;
import com.swmansion.reanimated.MapUtils;
import com.swmansion.reanimated.NodesManager;

public class BezierNode extends Node {

  private static class CubicBezierInterpolator {

    protected PointF start;
    protected PointF end;
    protected PointF a = new PointF();
    protected PointF b = new PointF();
    protected PointF c = new PointF();

    public CubicBezierInterpolator(PointF start, PointF end) {
      this.start = start;
      this.end = end;
    }

    public CubicBezierInterpolator(float startX, float startY, float endX, float endY) {
      this(new PointF(startX, startY), new PointF(endX, endY));
    }

    public float getInterpolation(float time) {
      return getBezierCoordinateY(getXForTime(time));
    }

    protected float getBezierCoordinateY(float time) {
      c.y = 3 * start.y;
      b.y = 3 * (end.y - start.y) - c.y;
      a.y = 1 - c.y - b.y;
      return time * (c.y + time * (b.y + time * a.y));
    }

    protected float getXForTime(float time) {
      float x = time;
      float z;
      for (int i = 1; i < 14; i++) {
        z = getBezierCoordinateX(x) - time;
        if (Math.abs(z) < 1e-3) {
          break;
        }
        x -= z / getXDerivate(x);
      }
      return x;
    }

    private float getXDerivate(float t) {
      return c.x + t * (2 * b.x + 3 * a.x * t);
    }

    private float getBezierCoordinateX(float time) {
      c.x = 3 * start.x;
      b.x = 3 * (end.x - start.x) - c.x;
      a.x = 1 - c.x - b.x;
      return time * (c.x + time * (b.x + time * a.x));
    }
  }

  private final int mInputID;
  private final CubicBezierInterpolator mInterpolator;

  public BezierNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);

    mInputID =
        MapUtils.getInt(
            config,
            "input",
            "Reanimated: Argument passed to bezier node is either of wrong type or is missing.");

    float startX = (float) config.getDouble("mX1");
    float startY = (float) config.getDouble("mY1");
    float endX = (float) config.getDouble("mX2");
    float endY = (float) config.getDouble("mY2");
    mInterpolator = new CubicBezierInterpolator(startX, startY, endX, endY);
  }

  @Override
  protected Double evaluate() {
    Double in = (Double) mNodesManager.getNodeValue(mInputID);
    return Double.valueOf(mInterpolator.getInterpolation(in.floatValue()));
  }
}

package expo.modules.ar.serializer;

import android.os.Bundle;
import android.os.Parcelable;

import com.google.ar.core.Anchor;
import com.google.ar.core.AugmentedImage;
import com.google.ar.core.Frame;
import com.google.ar.core.LightEstimate;
import com.google.ar.core.Plane;
import com.google.ar.core.Point;
import com.google.ar.core.PointCloud;
import com.google.ar.core.Trackable;

import java.nio.FloatBuffer;
import java.nio.IntBuffer;
import java.util.ArrayList;
import java.util.Collection;

import expo.modules.ar.arguments.ARFrameAttribute;
import expo.modules.ar.arguments.ARFrameSerializationAttributes;

public class ARFrameSerializer {
  private long mFrameTimestamp;
  private ArrayList<Bundle> mRawFeaturePoints;
  private Bundle mAnchors;
  private Bundle mLightEstimate;
  private ArrayList<Bundle> mPlanes;

  public Bundle serializeAcquiredFrame(ARFrameSerializationAttributes attributes) {
    Bundle output = new Bundle();

    output.putDouble("timestamp", mFrameTimestamp);

    if (attributes.shouldSerializeAnchors()) {
      output.putBundle(ARFrameAttribute.ANCHORS.toString(), mAnchors);
    }

    if (attributes.shouldSerializeRawFeaturePoints()) {
      output.putParcelableArrayList(ARFrameAttribute.RAW_FEATURES_POINT.toString(), mRawFeaturePoints);
    }

    if (attributes.shouldSerializePlanes()) {
      output.putParcelableArrayList(ARFrameAttribute.PLANES.toString(), mPlanes);
    }

    if (attributes.shouldSerializeLightEstimation()) {
      output.putBundle(ARFrameAttribute.LIGHT_ESTIMATION.toString(), mLightEstimate);
    }

    return output;
  }

  public void storeFrameData(Frame frame) {
    mFrameTimestamp = frame.getTimestamp();

    PointCloud pointCloud = frame.acquirePointCloud();
    mRawFeaturePoints = serializePointCloud(pointCloud);
    pointCloud.release();

    mAnchors = serializeAnchorsWithTrackables(frame);

    mPlanes = serializePlanes(frame);

    mLightEstimate = serializeLightEstimation(frame);
  }

  // ---------------------------------------------------------------------------------------------
  //                                     Light estimation
  // ---------------------------------------------------------------------------------------------

  private Bundle serializeLightEstimation(Frame frame) {
    LightEstimate lightEstimate = frame.getLightEstimate();
    float[] matrix = new float[16];
    lightEstimate.getColorCorrection(matrix, 0);

    Bundle result = new Bundle();
    result.putString("state", serializeLightEstimationState(lightEstimate.getState()));
    result.putDouble("intensity", lightEstimate.getPixelIntensity());
    result.putFloatArray("color", matrix);
    return result;
  }

  private String serializeLightEstimationState(LightEstimate.State state) {
    switch (state) {
      case VALID:
        return "valid";
      default:
        return "invalid";
    }
  }

  // ---------------------------------------------------------------------------------------------
  //                                          Planes
  // ---------------------------------------------------------------------------------------------

  private ArrayList<Bundle> serializePlanes(Frame frame) {
    ArrayList<Bundle> output = new ArrayList<>();
    Collection<Plane> planes = frame.getUpdatedTrackables(Plane.class);
    for (Plane plane : planes) {
      output.add(serializePlane(plane));
    }
    return output;
  }

  private Bundle serializePlane(Plane plane) {
    Bundle output = new Bundle();

    output.putInt("id", plane.hashCode());
    output.putFloatArray("worldTransform", ARSerializerCommons.serializePose(plane.getCenterPose()));

    output.putParcelable("center", encodeVec3(plane.getCenterPose().getTranslation()));

    Bundle extent = new Bundle();
    extent.putFloat("width", plane.getExtentX());
    extent.putFloat("length", plane.getExtentZ());
    output.putBundle("extent", extent);

    Plane parent = plane.getSubsumedBy();
    if (parent != null) {
      output.putBundle("parent", serializePlane(parent));
    }

    output.putString("planeType", serializePlaneType(plane.getType()));
    ArrayList anchors = ARSerializerCommons.serializeAnchors(plane.getAnchors());
    if (anchors != null) {
      output.putParcelableArrayList("anchors", anchors);
    }

    return output;
  }

  private Bundle encodeVec3(float[] vec3) {
    Bundle output = new Bundle();
    output.putFloat("x", vec3[0]);
    output.putFloat("y", vec3[1]);
    output.putFloat("z", vec3[2]);
    return output;
  }

  private String serializePlaneType(Plane.Type type) {
    switch (type) {
      case VERTICAL:
        return "vertical";
      case HORIZONTAL_UPWARD_FACING:
        return "horizontalUpwardFacing";
      case HORIZONTAL_DOWNWARD_FACING:
        return "horizontalDownwardFacing";
      default:
        return null;
    }
  }

  // ---------------------------------------------------------------------------------------------
  //                            Point Cloud / Raw Features Points
  // ---------------------------------------------------------------------------------------------

  private ArrayList<Bundle> serializePointCloud(PointCloud pointCloud) {
    FloatBuffer pointsBuffer = pointCloud.getPoints();
    float[] points = new float[pointsBuffer.limit()];
    pointsBuffer.get(points);
    IntBuffer idsBuffer = pointCloud.getIds();
    int[] ids = new int[idsBuffer.limit()];
    idsBuffer.get(ids);

    ArrayList<Bundle> rawFeaturePoints = new ArrayList<>();
    for (int i = 0; i < ids.length && 4 * i < points.length; i++) {
      Bundle point = new Bundle();
      point.putFloat("x", points[4 * i]);
      point.putFloat("y", points[4 * i + 1]);
      point.putFloat("z", points[4 * i + 2]);
      point.putFloat("confidence", points[4 * i + 3]);
      point.putInt("id", ids[i]);
      rawFeaturePoints.add(point);
    }
    return rawFeaturePoints;
  }

  // ---------------------------------------------------------------------------------------------
  //                                   Anchors / Trackables
  // ---------------------------------------------------------------------------------------------

  private Bundle serializeAnchorsWithTrackables(Frame frame) {
    Bundle anchorsBundle = new Bundle();
    Collection<Anchor> anchors = frame.getUpdatedAnchors();
    Collection<AugmentedImage> images = frame.getUpdatedTrackables(AugmentedImage.class);
    Collection<Point> points = frame.getUpdatedTrackables(Point.class);
    if (anchors.size() > 0) {
      anchorsBundle.putParcelableArrayList("anchors", ARSerializerCommons.serializeAnchors(anchors));
    }
    if (images.size() > 0) {
      anchorsBundle.putParcelableArrayList("images", serializeTrackables(images));
    }
    if (points.size() > 0) {
      anchorsBundle.putParcelableArrayList("points", serializeTrackables(points));
    }
    return anchorsBundle;
  }

  private ArrayList<? extends Parcelable> serializeTrackables(Collection<? extends Trackable> trackables) {
    ArrayList<Bundle> output = new ArrayList<>();
    for (Trackable trackable : trackables) {
      output.add(ARSerializerCommons.serializeTrackable(trackable));
    }
    return output;
  }

}

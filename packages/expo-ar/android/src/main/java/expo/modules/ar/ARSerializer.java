package expo.modules.ar;

import android.os.Bundle;
import android.os.Parcelable;

import com.google.ar.core.Anchor;
import com.google.ar.core.AugmentedImage;
import com.google.ar.core.Frame;
import com.google.ar.core.HitResult;
import com.google.ar.core.LightEstimate;
import com.google.ar.core.Plane;
import com.google.ar.core.Point;
import com.google.ar.core.PointCloud;
import com.google.ar.core.Pose;
import com.google.ar.core.Trackable;
import com.google.ar.core.TrackingState;

import java.nio.FloatBuffer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public class ARSerializer {
  public Bundle serializeFrame(Frame frame, Map<String, Object> attributes) {
    Bundle output = new Bundle();
//    Pose pose = frame.getAndroidSensorPose();
//    pose.toMatrix(poseMatrix, 0);
    output.putDouble("timestamp", frame.getTimestamp());

    if (attributes.containsKey("anchors")) {
      Object anchorProps = attributes.get("anchors");
      Boolean prevent = (anchorProps instanceof Boolean) && !((Boolean) anchorProps);
      if (!prevent) {
        Bundle anchorOutput = new Bundle();
        Collection<Anchor> anchors = frame.getUpdatedAnchors();

        if (anchors.size() > 0)
          anchorOutput.putParcelableArrayList("anchors", serializeAnchors(anchors));
        Collection<Plane> planes = frame.getUpdatedTrackables(Plane.class);
        if (planes.size() > 0)
          anchorOutput.putParcelableArrayList("planes", serializeTrackables(planes));
        Collection<AugmentedImage> images = frame.getUpdatedTrackables(AugmentedImage.class);
        if (images.size() > 0)
          anchorOutput.putParcelableArrayList("images", serializeTrackables(images));
        Collection<Point> points = frame.getUpdatedTrackables(Point.class);
        if (points.size() > 0)
          anchorOutput.putParcelableArrayList("points", serializeTrackables(points));

        output.putBundle("anchors", anchorOutput);
      }
    }

    if (attributes.containsKey("rawFeaturePoints") && attributes.get("rawFeaturePoints") instanceof Boolean) {
      Boolean shouldReturn = (Boolean) attributes.get("rawFeaturePoints");
      if (shouldReturn) {
        PointCloud pointCloud = frame.acquirePointCloud();
        output.putBundle("rawFeaturePoints", serializePointCloud(pointCloud));
        pointCloud.release();
      }
    }

    if (attributes.containsKey("lightEstimation") && attributes.get("lightEstimation") instanceof Boolean) {
      Boolean shouldReturn = (Boolean) attributes.get("lightEstimation");
      if (shouldReturn) {
        LightEstimate lightEstimate = frame.getLightEstimate();
        output.putBundle("lightEstimation", serializeLightEstimation(lightEstimate));
      }
    }

    //TODO: Evan: Throwing UnsupportedOperationException
//      output.putMap("pointCloud", serializePointCloud(pointCloud));
//      output.putArray("anchors", serializeAnchors(anchors));
    return output;
  }

  private String serializeLightEstimationState(LightEstimate.State state) {
    switch (state) {
      case VALID:
        return "valid";
      default:
        return "invalid";
    }
  }

  private Bundle serializeLightEstimation(LightEstimate lightEstimate) {
    float[] matrix = new float[16];
    lightEstimate.getColorCorrection(matrix, 0);

    Bundle result = new Bundle();
    result.putString("state", serializeLightEstimationState(lightEstimate.getState()));
    result.putDouble("intensity", lightEstimate.getPixelIntensity());
    result.putFloatArray("color", matrix);
    return result;
  }

  private String serializeCloudAnchorState(Anchor.CloudAnchorState state) {
    switch (state) {
      case TASK_IN_PROGRESS:
        return "taskInProgress";
      case SUCCESS:
        return "success";
      case ERROR_INTERNAL:
        return "errorInternal";
      case ERROR_NOT_AUTHORIZED:
        return "errorNotAuthorized";
      case ERROR_SERVICE_UNAVAILABLE:
        return "errorServiceUnavailable";
      case ERROR_RESOURCE_EXHAUSTED:
        return "errorResourceExhausted";
      case ERROR_HOSTING_DATASET_PROCESSING_FAILED:
        return "errorHostingDatasetProcessingFailed";
      case ERROR_CLOUD_ID_NOT_FOUND:
        return "errorCloudIdNotFound";
      case ERROR_RESOLVING_LOCALIZATION_NO_MATCH:
        return "errorResolvingLocalizationNoMatch";
      case ERROR_RESOLVING_SDK_VERSION_TOO_OLD:
        return "errorResolvingSdkVersionTooOld";
      case ERROR_RESOLVING_SDK_VERSION_TOO_NEW:
        return "errorResolvingSdkVersionTooNew";
      default:
        return "none";
    }
  }

  private ArrayList<? extends Parcelable> serializeTrackables(Collection<? extends Trackable> trackables) {
    ArrayList<Bundle> output = new ArrayList<>();
    for (Trackable trackable : trackables) {
      output.add(serializeTrackable(trackable));
    }
    return output;
  }

  private Bundle serializeTrackable(Trackable trackable) {
    Bundle output = new Bundle();
    output.putInt("id", trackable.hashCode());
    output.putString("state", serializeTrackingState(trackable.getTrackingState()));

    if (trackable instanceof Plane) {
      return serializePlane((Plane)trackable, output);
    } else if (trackable instanceof AugmentedImage) {
      return serializeImage((AugmentedImage) trackable, output);
    } else if (trackable instanceof Point) {
      return serializePoint((Point) trackable, output);
    }
    output.putString("type", "trackable");
    return output;
  }

  public List<Bundle> serializeHitResults(List<HitResult> hitResults) {
    List<Bundle> results = new ArrayList<>();
    for (HitResult hitResult : hitResults) {
      Bundle result = new Bundle();
      // common with iOS
      result.putBundle("anchor", serializeTrackable(hitResult.getTrackable()));
      result.putFloat("distance", hitResult.getDistance());

      // Android-specific
      result.putInt("id", hitResult.hashCode());
      result.putFloatArray("transform", serializePose(hitResult.getHitPose()));

      results.add(result);
    }
    return results;
  }

  private String serializeTrackingState(TrackingState trackingState) {
    switch (trackingState) {
      case PAUSED:
        return "paused";
      case TRACKING:
        return "tracking";
      case STOPPED:
        return "stopped";
      default:
        return "none";
    }
  }

  private ArrayList<Bundle> serializeAnchors(Collection<Anchor> anchors) {
    ArrayList<Bundle> output = new ArrayList<>();
    for (Anchor anchor : anchors) {
      output.add(serializeAnchor(anchor, new Bundle()));
    }
    if (output.size() > 0)
      return output;
    return null;
  }

  private Bundle serializeAnchor(Anchor anchor, Bundle output) {
    Anchor.CloudAnchorState state = anchor.getCloudAnchorState();
    TrackingState trackingState = anchor.getTrackingState();

    Pose pose = anchor.getPose();

    output.putInt("id", anchor.hashCode());
    output.putString("type", "anchor");
    output.putFloatArray("transform", serializePose(pose)); //TODO:Bacon: Prolly not right
    output.putString("cloudId", anchor.getCloudAnchorId());
    output.putString("cloudState", serializeCloudAnchorState(state));
    output.putString("state", serializeTrackingState(trackingState));
    return output;
  }

  private String serializeOrientationMode(Point.OrientationMode orientation) {
    switch (orientation) {
      case ESTIMATED_SURFACE_NORMAL:
        return "estimatedSurfaceNormal";
      case INITIALIZED_TO_IDENTITY:
        return "initializedToIdentity";
      default:
        return null;
    }
  }

  private Bundle serializePoint(Point point, Bundle output) {
    output.putString("type", "point");
    output.putString("mode", serializeOrientationMode(point.getOrientationMode()));
    ArrayList anchors = serializeAnchors(point.getAnchors());
    if (anchors != null) output.putParcelableArrayList("anchors", anchors);
    return output;
  }

  private Bundle serializeImage(AugmentedImage image, Bundle output) {
    output.putString("type", "image");
    output.putFloatArray("transform", serializePose(image.getCenterPose()));
    Bundle extent = new Bundle();
    extent.putFloat("x", image.getExtentX());
    extent.putFloat("z", image.getExtentZ());
    output.putBundle("extent", extent);
    output.putInt("index", image.getIndex());
    output.putString("name", image.getName());
    ArrayList anchors = serializeAnchors(image.getAnchors());
    if (anchors != null) output.putParcelableArrayList("anchors", anchors);
    return output;
  }

  private float[] serializePose(Pose pose) {
    float[] matrix = new float[16];
    pose.toMatrix(matrix, 0);
    return matrix;
  }

  private String serializePlaneType(Plane.Type type) {
    switch (type) {
      case VERTICAL:
        return "vertical";
      case HORIZONTAL_UPWARD_FACING:
        return "horizontalUpward";
      case HORIZONTAL_DOWNWARD_FACING:
        return "horizontalDownward";
      default:
        return null;
    }
  }

  private Bundle serializePlane(Plane plane, Bundle output) {
    output.putFloatArray("transform", serializePose(plane.getCenterPose()));

    Bundle extent = new Bundle();
    extent.putFloat("x", plane.getExtentX());
    extent.putFloat("z", plane.getExtentZ());
    output.putBundle("extent", extent);

    Plane parent = plane.getSubsumedBy();
    if (parent != null) {
      output.putBundle("parent", serializePlane(parent, new Bundle()));
    }

    output.putString("type", "plane");
    output.putString("planeType", serializePlaneType(plane.getType()));
    ArrayList anchors = serializeAnchors(plane.getAnchors());
    if (anchors != null) output.putParcelableArrayList("anchors", anchors);

    output.putInt("id", plane.hashCode());
    //TODO:Bacon: should we add this?
//    plane.getPolygon();
    return output;
  }

  private Bundle serializePointCloud(PointCloud pointCloud) {

    FloatBuffer floatBuffer = pointCloud.getPoints();
    float[] points = new float[floatBuffer.limit()];
    floatBuffer.get(points);
    double timestamp = pointCloud.getTimestamp();
    float[] pointsArray = new float[points.length / 4];

    int counter = 0;
    for (int i = 0; i < points.length; i += 4) {
      float buffers = points[i];
      pointsArray[counter++] = buffers;
    }
    Bundle map = new Bundle();
    map.putDouble("timestamp", timestamp);
    map.putFloatArray("points", pointsArray);

    return map;
  }

}

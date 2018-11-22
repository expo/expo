package expo.modules.ar.serializer;

import android.os.Bundle;

import com.google.ar.core.Anchor;
import com.google.ar.core.AugmentedImage;
import com.google.ar.core.Point;
import com.google.ar.core.Pose;
import com.google.ar.core.Trackable;
import com.google.ar.core.TrackingState;

import java.util.ArrayList;
import java.util.Collection;

class ARSerializerCommons {
  static float[] serializePose(Pose pose) {
    float[] matrix = new float[16];
    pose.toMatrix(matrix, 0);
    return matrix;
  }

  static Bundle serializeTrackable(Trackable trackable) {
    Bundle output = new Bundle();
    output.putInt("id", trackable.hashCode());
    output.putString("state", serializeTrackingState(trackable.getTrackingState()));

    if (trackable instanceof AugmentedImage) {
      return serializeImage((AugmentedImage) trackable, output);
    } else if (trackable instanceof Point) {
      return serializePoint((Point) trackable, output);
    }
    output.putString("type", "trackable");
    return output;
  }

  private static String serializeTrackingState(TrackingState trackingState) {
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

  private static Bundle serializePoint(Point point, Bundle output) {
    output.putString("type", "point");
    output.putString("mode", serializeOrientationMode(point.getOrientationMode()));
    ArrayList anchors = serializeAnchors(point.getAnchors());
    if (anchors != null) output.putParcelableArrayList("anchors", anchors);
    return output;
  }

  private static Bundle serializeImage(AugmentedImage image, Bundle output) {
    output.putString("type", "image");
    output.putFloatArray("transform", ARSerializerCommons.serializePose(image.getCenterPose()));
    Bundle extent = new Bundle();
    extent.putFloat("x", image.getExtentX());
    extent.putFloat("z", image.getExtentZ());
    output.putBundle("extent", extent);
    output.putInt("index", image.getIndex());
    output.putString("name", image.getName());
    ArrayList anchors = serializeAnchors(image.getAnchors());
    if (anchors != null) {
      output.putParcelableArrayList("anchors", anchors);
    }
    return output;
  }

  private static String serializeOrientationMode(Point.OrientationMode orientation) {
    switch (orientation) {
      case ESTIMATED_SURFACE_NORMAL:
        return "estimatedSurfaceNormal";
      case INITIALIZED_TO_IDENTITY:
        return "initializedToIdentity";
      default:
        return null;
    }
  }


  static ArrayList<Bundle> serializeAnchors(Collection<Anchor> anchors) {
    ArrayList<Bundle> output = new ArrayList<>();
    for (Anchor anchor : anchors) {
      output.add(serializeAnchor(anchor));
    }
    return output.size() > 0 ? output : null;
  }

  private static Bundle serializeAnchor(Anchor anchor) {
    Bundle output = new Bundle();
    Anchor.CloudAnchorState state = anchor.getCloudAnchorState();
    TrackingState trackingState = anchor.getTrackingState();

    Pose pose = anchor.getPose();

    output.putInt("id", anchor.hashCode());
    output.putString("type", "anchor");
    output.putFloatArray("transformWorld", ARSerializerCommons.serializePose(pose)); //TODO:Bacon: Prolly not right
    output.putString("cloudId", anchor.getCloudAnchorId());
    output.putString("cloudState", serializeCloudAnchorState(state));
    output.putString("state", ARSerializerCommons.serializeTrackingState(trackingState));
    return output;
  }

  private static String serializeCloudAnchorState(Anchor.CloudAnchorState state) {
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

}

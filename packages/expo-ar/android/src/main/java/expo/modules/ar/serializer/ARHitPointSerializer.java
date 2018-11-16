package expo.modules.ar.serializer;

import android.os.Bundle;

import com.google.ar.core.HitResult;
import com.google.ar.core.Plane;
import com.google.ar.core.Point;
import com.google.ar.core.Trackable;

import java.util.ArrayList;
import java.util.List;

public class ARHitPointSerializer {
  public static List<Bundle> serializeHitResults(List<HitResult> hitResults) {
    List<Bundle> results = new ArrayList<>();
    for (HitResult hitResult : hitResults) {
      results.add(serializeHitResult(hitResult));
    }
    return results;
  }

  private static Bundle serializeHitResult(HitResult hitResult) {
    Bundle result = new Bundle();

    Trackable trackable = hitResult.getTrackable();
    if ((trackable instanceof Plane
        && ((Plane) trackable).isPoseInPolygon(hitResult.getHitPose()))
//            && (PlaneRenderer.calculateDistanceToPlane(hit.getHitPose(), camera.getPose()) > 0))
        || (trackable instanceof Point
        && ((Point) trackable).getOrientationMode() == Point.OrientationMode.ESTIMATED_SURFACE_NORMAL)) {
      result.putBundle("anchor", ARSerializer.serializeTrackable(trackable));
    } else {
      result.putBundle("anchor", null);
    }
    result.putFloat("distance", hitResult.getDistance());

    // Android-specific
    result.putInt("id", hitResult.hashCode());
    result.putFloatArray("transform", ARSerializer.serializePose(hitResult.getHitPose()));
    return result;
  }
}

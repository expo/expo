package expo.modules.ar.serializer;

import android.os.Bundle;

import com.google.ar.core.HitResult;
import com.google.ar.core.Plane;
import com.google.ar.core.Point;
import com.google.ar.core.Trackable;

import java.util.ArrayList;
import java.util.List;

public class ARHitTestSerializer {
  public static List<Bundle> serializeHitResults(List<HitResult> hitResults) {
    List<Bundle> results = new ArrayList<>();
    for (HitResult hitResult : hitResults) {
      results.add(serializeHitResult(hitResult));
    }
    return results;
  }

  private static Bundle serializeHitResult(HitResult hitResult) {
    Bundle result = new Bundle();

    result.putFloatArray("worldTransform", ARSerializerCommons.serializePose(hitResult.getHitPose()));
    result.putFloat("distance", hitResult.getDistance());

    Trackable trackable = hitResult.getTrackable();
    if ((trackable instanceof Plane
        && ((Plane) trackable).isPoseInPolygon(hitResult.getHitPose()))
//            && (PlaneRenderer.calculateDistanceToPlane(hit.getHitPose(), camera.getPose()) > 0))
        || (trackable instanceof Point
        && ((Point) trackable).getOrientationMode() == Point.OrientationMode.ESTIMATED_SURFACE_NORMAL)) {
      result.putBundle("anchor", ARSerializerCommons.serializeTrackable(trackable));
    }


    // Android specific
    result.putInt("id", hitResult.hashCode());
    return result;
  }
}

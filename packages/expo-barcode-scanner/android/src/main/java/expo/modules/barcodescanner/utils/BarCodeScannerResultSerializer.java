package expo.modules.barcodescanner.utils;

import android.os.Bundle;
import android.util.Pair;

import org.unimodules.interfaces.barcodescanner.BarCodeScannerResult;

import java.util.ArrayList;
import java.util.List;

public class BarCodeScannerResultSerializer {

  public static Bundle toBundle(BarCodeScannerResult result, float density) {
    Bundle resultBundle = new Bundle();
    resultBundle.putString("data", result.getValue());
    resultBundle.putInt("type", result.getType());
    if (!result.getCornerPoints().isEmpty()) {
      Pair<ArrayList<Bundle>, Bundle> cornerPointsAndBoundingBox = getCornerPointsAndBoundingBox(result.getCornerPoints(), density);
      resultBundle.putParcelableArrayList("cornerPoints", cornerPointsAndBoundingBox.first);
      resultBundle.putBundle("bounds", cornerPointsAndBoundingBox.second);
    }

    return resultBundle;
  }

  private static Pair<ArrayList<Bundle>, Bundle> getCornerPointsAndBoundingBox(List<Integer> cornerPoints, float density) {
    ArrayList<Bundle> convertedCornerPoints = new ArrayList<>();
    Bundle boundingBox = new Bundle();

    float minX = Float.MAX_VALUE;
    float minY = Float.MAX_VALUE;
    float maxX = Float.MIN_VALUE;
    float maxY = Float.MIN_VALUE;

    for (int i = 0; i < cornerPoints.size(); i += 2) {
      float x = ((float) cornerPoints.get(i)) / density;
      float y = ((float) cornerPoints.get(i + 1)) / density;

      // finding bounding-box Coordinates
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      convertedCornerPoints.add(getPoint(x, y));
    }

    boundingBox.putParcelable("origin", getPoint(minX, minY));
    boundingBox.putParcelable("size", getSize(maxX - minX, maxY - minY));

    return new Pair<>(convertedCornerPoints, boundingBox);
  }

  private static Bundle getSize(float width, float height) {
    Bundle size = new Bundle();
    size.putFloat("width", width);
    size.putFloat("height", height);
    return size;
  }

  private static Bundle getPoint(float x, float y) {
    Bundle point = new Bundle();
    point.putFloat("x", x);
    point.putFloat("y", y);
    return point;
  }
}

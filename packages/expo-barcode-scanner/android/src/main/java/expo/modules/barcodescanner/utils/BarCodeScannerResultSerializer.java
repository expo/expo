package expo.modules.barcodescanner.utils;

import android.os.Bundle;
import android.util.Pair;

import org.unimodules.interfaces.barcodescanner.BarCodeScannerResult;

import java.util.ArrayList;
import java.util.List;

public class BarCodeScannerResultSerializer {

  public static Bundle toBundle(BarCodeScannerResult result) {
    Bundle resultBundle = new Bundle();
    resultBundle.putString("data", result.getValue());
    resultBundle.putInt("type", result.getType());
    if (!result.getCornerPoints().isEmpty()) {
      Pair<ArrayList<Bundle>, Bundle> cornerPointsAndBoundingBox = getCornerPointsAndBoundingBox(result.getCornerPoints());
      resultBundle.putParcelableArrayList("cornerPoints", cornerPointsAndBoundingBox.first);
      resultBundle.putBundle("bounds", cornerPointsAndBoundingBox.second);
    }

    return resultBundle;
  }

  private static Pair<ArrayList<Bundle>, Bundle> getCornerPointsAndBoundingBox(List<Integer> cornerPoints) {
    ArrayList<Bundle> convertedCornerPoints = new ArrayList<>();
    Bundle boundingBox = new Bundle();

    int minX = Integer.MAX_VALUE;
    int minY = Integer.MAX_VALUE;
    int maxX = Integer.MIN_VALUE;
    int maxY = Integer.MIN_VALUE;

    for (int i = 0; i < cornerPoints.size(); i += 2) {
      int x = cornerPoints.get(i);
      int y = cornerPoints.get(i + 1);

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

  private static Bundle getSize(int width, int height) {
    Bundle size = new Bundle();
    size.putInt("width", width);
    size.putInt("height", height);
    return size;
  }

  private static Bundle getPoint(int x, int y) {
    Bundle point = new Bundle();
    point.putInt("x", x);
    point.putInt("y", y);
    return point;
  }
}

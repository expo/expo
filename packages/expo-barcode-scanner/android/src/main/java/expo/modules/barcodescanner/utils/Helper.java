package expo.modules.barcodescanner.utils;

import android.os.Bundle;
import android.util.Pair;

import java.util.ArrayList;
import java.util.List;

public class Helper {

  public static Pair<List<Bundle>,Bundle> getCornerPointsAndBoundingBox(List<Integer> cornerPoints, float density) {
    List<Bundle> convertedCornerPoints = new ArrayList<>();
    Bundle boundingBox = new Bundle();

    float minX = (float)1e9;
    float minY = (float)1e9;
    float maxX = -1;
    float maxY = -1;

    for(int i = 0; i < cornerPoints.size(); i += 2) {
      float x = ((float)cornerPoints.get(i))/density;
      float y = ((float)cornerPoints.get(i+1))/density;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      convertedCornerPoints.add(getPoint(x,y));
    }

    boundingBox.putParcelable("origin", getPoint(minX, minY));
    boundingBox.putParcelable("size", getSize(maxX-minX, maxY-minY));

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

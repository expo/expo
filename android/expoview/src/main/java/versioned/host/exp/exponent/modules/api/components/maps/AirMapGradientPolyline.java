package versioned.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Shader;
import android.util.Log;

import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Tile;
import com.google.android.gms.maps.model.TileOverlay;
import com.google.android.gms.maps.model.TileOverlayOptions;
import com.google.android.gms.maps.model.TileProvider;
import com.google.maps.android.SphericalUtil;
import com.google.maps.android.geometry.Point;
import com.google.maps.android.projection.SphericalMercatorProjection;

import java.io.ByteArrayOutputStream;
import java.util.List;


/**
 * Tile overlay used to display a colored polyline as a replacement for the
 * non-existence of gradient polylines for google maps. Implementation borrowed
 * from Dagothig/ColoredPolylineOverlay
 * (https://gist.github.com/Dagothig/5f9cf0a4a7a42901a7b2)
 */
public class AirMapGradientPolyline extends AirMapFeature {
  private List<LatLng> points;
  private int[] colors;
  private float zIndex;
  private float width;

  private GoogleMap map;

  private TileOverlay tileOverlay;
  protected final Context context;

  public AirMapGradientPolyline(Context context) {
    super(context);
    this.context = context;
  }

  public void setCoordinates(List<LatLng> coordinates) {
    this.points = coordinates;
    if (tileOverlay != null) {
      tileOverlay.remove();
    }
    if (map != null) {
      tileOverlay = map.addTileOverlay(createTileOverlayOptions());
    }
  }

  public void setStrokeColors(int[] colors) {
    this.colors = colors;
    if (tileOverlay != null) {
      tileOverlay.remove();
    }
    if (map != null) {
      tileOverlay = map.addTileOverlay(createTileOverlayOptions());
    }
  }

  public void setZIndex(float zIndex) {
    this.zIndex = zIndex;
    if (tileOverlay != null) {
      tileOverlay.setZIndex(zIndex);
    }
  }

  public void setWidth(float width) {
    this.width = width;
    if (tileOverlay != null) {
      tileOverlay.remove();
    }
    if (map != null) {
      tileOverlay = map.addTileOverlay(createTileOverlayOptions());
    }
  }

  private TileOverlayOptions createTileOverlayOptions() {
    TileOverlayOptions options = new TileOverlayOptions();
    options.zIndex(zIndex);
    AirMapGradientPolylineProvider tileProvider = new AirMapGradientPolylineProvider(context, points, colors, width);
    options.tileProvider(tileProvider);
    return options;
  }

  public static int interpolateColor(int[] colors, float proportion) {
    int rTotal = 0, gTotal = 0, bTotal = 0;
    // We correct the ratio to colors.length - 1 so that
    // for i == colors.length - 1 and p == 1, then the final ratio is 1 (see below)
    float p = proportion * (colors.length - 1);

    for (int i = 0; i < colors.length; i++) {
      // The ratio mostly resides on the 1 - Math.abs(p - i) calculation :
      // Since for p == i, then the ratio is 1 and for p == i + 1 or p == i -1, then the ratio is 0
      // This calculation works BECAUSE p lies within [0, length - 1] and i lies within [0, length - 1] as well
      float iRatio = Math.max(1 - Math.abs(p - i), 0.0f);
      rTotal += (int) (Color.red(colors[i]) * iRatio);
      gTotal += (int) (Color.green(colors[i]) * iRatio);
      bTotal += (int) (Color.blue(colors[i]) * iRatio);
    }

    return Color.rgb(rTotal, gTotal, bTotal);
  }

  public class AirMapGradientPolylineProvider implements TileProvider {

    public static final int BASE_TILE_SIZE = 256;

    protected final List<LatLng> points;
    protected final int[] colors;
    protected final float width;
    protected final float density;
    protected final int tileDimension;
    protected final SphericalMercatorProjection projection;

    // Caching calculation-related stuff
    protected LatLng[] trailLatLngs;
    protected Point[] projectedPts;
    protected Point[] projectedPtMids;

    public AirMapGradientPolylineProvider(Context context, List<LatLng> points, int[] colors,
        float width) {
      super();

      this.points = points;
      this.colors = colors;
      this.width = width;
      density = context.getResources().getDisplayMetrics().density;
      tileDimension = (int) (BASE_TILE_SIZE * density);
      projection = new SphericalMercatorProjection(BASE_TILE_SIZE);
      calculatePoints();
    }

    public void calculatePoints() {
      trailLatLngs = new LatLng[points.size()];
      projectedPts = new Point[points.size()];
      projectedPtMids = new Point[Math.max(points.size() - 1, 0)];

      for (int i = 0; i < points.size(); i++) {
        LatLng latLng = points.get(i);
        trailLatLngs[i] = latLng;
        projectedPts[i] = projection.toPoint(latLng);

        // Mids
        if (i > 0) {
          LatLng previousLatLng = points.get(i - 1);
          LatLng latLngMid = SphericalUtil.interpolate(previousLatLng, latLng, 0.5);
          projectedPtMids[i - 1] = projection.toPoint(latLngMid);
        }
      }
    }

    @Override
    public Tile getTile(int x, int y, int zoom) {
      // Because getTile can be called asynchronously by multiple threads, none of the info we keep in the class will be modified
      // (getTile is essentially side-effect-less) :
      // Instead, we create the bitmap, the canvas and the paints specifically for the call to getTile

      Bitmap bitmap = Bitmap.createBitmap(tileDimension, tileDimension, Bitmap.Config.ARGB_8888);

      // Normally, instead of the later calls for drawing being offset, we would offset them using scale() and translate() right here
      // However, there seems to be funky issues related to float imprecisions that happen at large scales when using this method, so instead
      // The points are offset properly when drawing
      Canvas canvas = new Canvas(bitmap);

      Matrix shaderMat = new Matrix();
      Paint gradientPaint = new Paint();
      gradientPaint.setStyle(Paint.Style.STROKE);
      gradientPaint.setStrokeWidth(width);
      gradientPaint.setStrokeCap(Paint.Cap.BUTT);
      gradientPaint.setStrokeJoin(Paint.Join.ROUND);
      gradientPaint.setFlags(Paint.ANTI_ALIAS_FLAG);
      gradientPaint.setShader(new LinearGradient(0, 0, 1, 0, colors, null,
          Shader.TileMode.CLAMP));
      gradientPaint.getShader().setLocalMatrix(shaderMat);

      Paint colorPaint = new Paint();
      colorPaint.setStyle(Paint.Style.STROKE);
      colorPaint.setStrokeWidth(width);
      colorPaint.setStrokeCap(Paint.Cap.BUTT);
      colorPaint.setStrokeJoin(Paint.Join.ROUND);
      colorPaint.setFlags(Paint.ANTI_ALIAS_FLAG);

      // See https://developers.google.com/maps/documentation/android/views#zoom for handy info regarding what zoom is
      float scale = (float) (Math.pow(2, zoom) * density);

      renderTrail(canvas, shaderMat, gradientPaint, colorPaint, scale, x, y);

      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, baos);
      return new Tile(tileDimension, tileDimension, baos.toByteArray());
    }

    public void renderTrail(Canvas canvas, Matrix shaderMat, Paint gradientPaint, Paint colorPaint,
        float scale, int x, int y) {
      MutPoint pt1 = new MutPoint(), pt2 = new MutPoint(), pt3 = new MutPoint(), pt1mid2 =
          new MutPoint(), pt2mid3 = new MutPoint();

      if (points.size() == 1) {
        pt1.set(projectedPts[0], scale, x, y, tileDimension);

        colorPaint.setStyle(Paint.Style.FILL);
        colorPaint.setColor(interpolateColor(colors, 1));
        canvas
            .drawCircle((float) pt1.x, (float) pt1.y, colorPaint.getStrokeWidth() / 2f, colorPaint);
        colorPaint.setStyle(Paint.Style.STROKE);

        return;
      }


      if (points.size() == 2) {
        pt1.set(projectedPts[0], scale, x, y, tileDimension);
        pt2.set(projectedPts[1], scale, x, y, tileDimension);

        drawLine(canvas, colorPaint, pt1, pt2, 0);

        return;
      }

      for (int i = 2; i < points.size(); i++) {
        pt1.set(projectedPts[i - 2], scale, x, y, tileDimension);
        pt2.set(projectedPts[i - 1], scale, x, y, tileDimension);
        pt3.set(projectedPts[i], scale, x, y, tileDimension);

        // Because we want to split the lines in two to ease over the corners, we need the middle points
        pt1mid2.set(projectedPtMids[i - 2], scale, x, y, tileDimension);
        pt2mid3.set(projectedPtMids[i - 1], scale, x, y, tileDimension);

        float interp1 = ((float)i - 2) / points.size();
        float interp2 = ((float)i - 1) / points.size();
        float interp1to2 = (interp1 + interp2) / 2;

        Log.d("AirMapGradientPolyline", String.valueOf(interp1to2));

        // Circle for the corner (removes the weird empty corners that occur otherwise)
        colorPaint.setStyle(Paint.Style.FILL);
        colorPaint.setColor(interpolateColor(colors, interp1to2));
        canvas
            .drawCircle((float) pt2.x, (float) pt2.y, colorPaint.getStrokeWidth() / 2f, colorPaint);
        colorPaint.setStyle(Paint.Style.STROKE);

        // Corner
        // Note that since for the very first point and the very last point we don't split it in two, we used them instead.
        drawLine(canvas, shaderMat, gradientPaint, colorPaint, i - 2 == 0 ? pt1 : pt1mid2,
            pt2, interp1, interp1to2);
        drawLine(canvas, shaderMat, gradientPaint, colorPaint, pt2, i == points.size() - 1 ?
            pt3 : pt2mid3, interp1to2, interp2);
      }
    }

    /**
     * Note: it is assumed the shader is 0, 0, 1, 0 (horizontal) so that it lines up with the rotation
     * (rotations are usually setup so that the angle 0 points right)
     */
    public void drawLine(Canvas canvas, Matrix shaderMat, Paint gradientPaint, Paint colorPaint,
        MutPoint pt1, MutPoint pt2, float ratio1, float ratio2) {
      // Degenerate case: both ratios are the same; we just handle it using the colorPaint (handling it using the shader is just messy and ineffective)
      if (ratio1 == ratio2) {
        drawLine(canvas, colorPaint, pt1, pt2, ratio1);
        return;
      }
      shaderMat.reset();

      // PS: don't ask me why this specfic orders for calls works but other orders will fuck up
      // Since every call is pre, this is essentially ordered as (or my understanding is that it is):
      // ratio translate -> ratio scale -> scale to pt length -> translate to pt start -> rotate
      // (my initial intuition was to use only post calls and to order as above, but it resulted in odd corruptions)

      // Setup based on points:
      // We translate the shader so that it is based on the first point, rotated towards the second and since the length of the
      // gradient is 1, then scaling to the length of the distance between the points makes it exactly as long as needed
      shaderMat.preRotate((float) Math.toDegrees(Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x)),
          (float) pt1.x, (float) pt1.y);
      shaderMat.preTranslate((float) pt1.x, (float) pt1.y);
      float scale = (float) Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
      shaderMat.preScale(scale, scale);

      // Setup based on ratio
      // By basing the shader to the first ratio, we ensure that the start of the gradient corresponds to it
      // The inverse scaling of the shader means that it takes the full length of the call to go to the second ratio
      // For instance; if d(ratio1, ratio2) is 0.5, then the shader needs to be twice as long so that an entire call (1)
      // Results in only half of the gradient being used
      shaderMat.preScale(1f / (ratio2 - ratio1), 1f / (ratio2 - ratio1));
      shaderMat.preTranslate(-ratio1, 0);

      gradientPaint.getShader().setLocalMatrix(shaderMat);

      canvas.drawLine(
          (float) pt1.x,
          (float) pt1.y,
          (float) pt2.x,
          (float) pt2.y,
          gradientPaint
      );
    }

    public void drawLine(Canvas canvas, Paint colorPaint, MutPoint pt1, MutPoint pt2, float ratio) {
      colorPaint.setColor(interpolateColor(colors, ratio));
      canvas.drawLine(
          (float) pt1.x,
          (float) pt1.y,
          (float) pt2.x,
          (float) pt2.y,
          colorPaint
      );
    }
  }

  @Override
  public Object getFeature() {
    return tileOverlay;
  }

  @Override
  public void addToMap(GoogleMap map) {
    Log.d("AirMapGradientPolyline", "ADDTOMAP");
    this.map = map;
    this.tileOverlay = map.addTileOverlay(createTileOverlayOptions());
  }

  @Override
  public void removeFromMap(GoogleMap map) {
    tileOverlay.remove();
  }

  public static class MutPoint {
    public double x, y;

    public MutPoint set(Point point, float scale, int x, int y, int tileDimension) {
      this.x = point.x * scale - x * tileDimension;
      this.y = point.y * scale - y * tileDimension;
      return this;
    }
  }
}
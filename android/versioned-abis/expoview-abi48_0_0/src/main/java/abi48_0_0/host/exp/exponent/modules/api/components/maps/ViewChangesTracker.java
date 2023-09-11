package abi48_0_0.host.exp.exponent.modules.api.components.maps;

import android.os.Handler;
import android.os.Looper;

import java.util.LinkedList;

public class ViewChangesTracker {

  private static ViewChangesTracker instance;
  private final Handler handler;
  private final LinkedList<AirMapMarker> markers = new LinkedList<>();
  private boolean hasScheduledFrame = false;
  private final Runnable updateRunnable;
  private final long fps = 40;

  private ViewChangesTracker() {
    handler = new Handler(Looper.myLooper());
    updateRunnable = new Runnable() {
      @Override
      public void run() {
        hasScheduledFrame = false;
        update();

        if (markers.size() > 0) {
          handler.postDelayed(updateRunnable, fps);
        }
      }
    };
  }

  static ViewChangesTracker getInstance() {
    if (instance == null) {
      synchronized (ViewChangesTracker.class) {
        instance = new ViewChangesTracker();
      }
    }

    return instance;
  }

  public void addMarker(AirMapMarker marker) {
    markers.add(marker);

    if (!hasScheduledFrame) {
      hasScheduledFrame = true;
      handler.postDelayed(updateRunnable, fps);
    }
  }

  public void removeMarker(AirMapMarker marker) {
    markers.remove(marker);
  }

  public boolean containsMarker(AirMapMarker marker) {
    return markers.contains(marker);
  }

  private final LinkedList<AirMapMarker> markersToRemove = new LinkedList<>();

  public void update() {
    for (AirMapMarker marker : markers) {
      if (!marker.updateCustomForTracking()) {
        markersToRemove.add(marker);
      }
    }

    // Remove markers that are not active anymore
    if (markersToRemove.size() > 0) {
      markers.removeAll(markersToRemove);
      markersToRemove.clear();
    }
  }

}

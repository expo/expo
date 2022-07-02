package versioned.host.exp.exponent.modules.api.reanimated.sensor;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import versioned.host.exp.exponent.modules.api.reanimated.NativeProxy;

public class ReanimatedSensorListener implements SensorEventListener {

  private NativeProxy.SensorSetter setter;
  private double lastRead = (double) System.currentTimeMillis();
  private final double interval;

  ReanimatedSensorListener(NativeProxy.SensorSetter setter, double interval) {
    this.setter = setter;
    this.interval = interval;
  }

  @Override
  public void onSensorChanged(SensorEvent event) {
    double current = (double) System.currentTimeMillis();
    if (current - lastRead < interval) {
      return;
    }
    lastRead = current;
    setter.sensorSetter(event.values);
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}

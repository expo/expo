package expo.modules.ar;

import android.os.Bundle;

interface ARSessionManagerDelegate {
  void didUpdateWithEvent(String eventName, Bundle payload);
}

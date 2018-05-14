package expo.core;

import android.content.Context;
import android.view.View;

import java.util.List;

public interface ViewManager<V extends View> extends ModuleRegistryConsumer {
  String getName();
  V createViewInstance(Context context);
  List<String> getExportedEventNames();
  void onDropViewInstance(V view);
}

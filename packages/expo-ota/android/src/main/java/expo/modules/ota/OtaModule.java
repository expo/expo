package expo.modules.ota;

import java.util.Map;

import android.content.Context;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

public class OtaModule extends ExportedModule {
  private static final String NAME = "ExpoOta";
  private static final String TAG = OtaModule.class.getSimpleName();

  private ModuleRegistry mModuleRegistry;

  public OtaModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }


  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    this.mModuleRegistry = mModuleRegistry;
  }

  @ExpoMethod
  public void someGreatMethodAsync(Map<String, Object> options, final Promise promise) {
  }
}

package expo.modules.imagepicker;

import android.content.Context;

import org.unimodules.core.BasePackage;
import org.unimodules.core.ExportedModule;

import java.util.Collections;
import java.util.List;

public class ImagePickerPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new ImagePickerModule(context));
  }
}

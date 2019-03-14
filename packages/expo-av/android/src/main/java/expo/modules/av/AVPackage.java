package expo.modules.av;

import android.content.Context;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;
import expo.core.ViewManager;
import expo.core.interfaces.InternalModule;
import expo.modules.av.player.datasource.SharedCookiesDataSourceFactoryProvider;
import expo.modules.av.video.VideoManager;
import expo.modules.av.video.VideoViewManager;

public class AVPackage extends BasePackage {

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Arrays.asList(
        new AVManager(context),
        new SharedCookiesDataSourceFactoryProvider()
    );
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Arrays.<ExportedModule>asList(
        new AVModule(context),
        new VideoManager(context)
    );
  }

  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Collections.singletonList((ViewManager) new VideoViewManager());
  }
}

package expo.modules.av;

import android.content.Context;

import java.util.Arrays;
import java.util.List;

import expo.modules.av.player.datasource.SharedCookiesDataSourceFactoryProvider;
import expo.modules.core.BasePackage;
import expo.modules.core.interfaces.InternalModule;

public class AVPackage extends BasePackage {

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Arrays.asList(
        new AVManager(context),
        new SharedCookiesDataSourceFactoryProvider()
    );
  }
}

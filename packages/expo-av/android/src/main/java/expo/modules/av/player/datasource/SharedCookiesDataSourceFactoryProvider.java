package expo.modules.av.player.datasource;

import android.content.Context;

import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.TransferListener;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import expo.modules.core.ModuleRegistry;
import expo.modules.core.interfaces.InternalModule;

public class SharedCookiesDataSourceFactoryProvider implements InternalModule, DataSourceFactoryProvider {
  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) DataSourceFactoryProvider.class);
  }

  @Override
  public DataSource.Factory createFactory(Context reactApplicationContext, ModuleRegistry moduleRegistry, String userAgent, Map<String, Object> requestHeaders, TransferListener transferListener) {
    return new SharedCookiesDataSourceFactory(reactApplicationContext, userAgent, requestHeaders, transferListener);
  }
}

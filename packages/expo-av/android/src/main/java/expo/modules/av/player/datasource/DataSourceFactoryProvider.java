package expo.modules.av.player.datasource;

import android.content.Context;

import com.google.android.exoplayer2.upstream.DataSource;

import java.util.Map;

import org.unimodules.core.ModuleRegistry;

public interface DataSourceFactoryProvider {
  DataSource.Factory createFactory(Context reactApplicationContext, ModuleRegistry moduleRegistry, String userAgent, Map<String, Object> requestHeaders);
}

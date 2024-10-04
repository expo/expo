package abi47_0_0.expo.modules.av.player.datasource;

import android.content.Context;

import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.TransferListener;

import java.util.Map;

import abi47_0_0.expo.modules.core.ModuleRegistry;

public interface DataSourceFactoryProvider {
  DataSource.Factory createFactory(Context reactApplicationContext, ModuleRegistry moduleRegistry, String userAgent, Map<String, Object> requestHeaders, TransferListener transferListener);
}

package expo.modules.av.player;

import android.content.Context;
import android.net.Uri;

import com.google.android.exoplayer2.upstream.DataSource;

import java.util.Map;

public class SharedCookiesDataSourceFactory implements DataSource.Factory {
  private final DataSource.Factory mDataSourceFactory;

  public SharedCookiesDataSourceFactory(Uri uri, Context reactApplicationContext, String userAgent, Map<String, Object> requestHeaders) {
    // TODO: Use NetworkingModule
//    OkHttpClient reactNativeOkHttpClient = reactApplicationContext.getNativeModule(NetworkingModule.class).mClient;
//    mDataSourceFactory = new DefaultDataSourceFactory(reactApplicationContext, null, new CustomHeadersOkHttpDataSourceFactory(reactNativeOkHttpClient, userAgent, requestHeaders));
    mDataSourceFactory = null;
  }

  @Override
  public DataSource createDataSource() {
    return mDataSourceFactory.createDataSource();
  }
}

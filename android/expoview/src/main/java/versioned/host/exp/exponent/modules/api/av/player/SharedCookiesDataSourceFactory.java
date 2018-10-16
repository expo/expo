package versioned.host.exp.exponent.modules.api.av.player;

import android.net.Uri;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.network.NetworkingModule;
import com.google.android.exoplayer2.ext.okhttp.OkHttpDataSourceFactory;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultDataSourceFactory;

import expolib_v1.okhttp3.OkHttpClient;

public class SharedCookiesDataSourceFactory implements DataSource.Factory {
  private final DataSource.Factory mDataSourceFactory;

  public SharedCookiesDataSourceFactory(Uri uri, ReactContext reactApplicationContext, String userAgent) {
    if ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme())) {
      OkHttpClient reactNativeOkHttpClient = reactApplicationContext.getNativeModule(NetworkingModule.class).mClient;
      mDataSourceFactory = new OkHttpDataSourceFactory(reactNativeOkHttpClient, userAgent, null);
    } else {
      mDataSourceFactory = new DefaultDataSourceFactory(reactApplicationContext, userAgent);
    }
  }

  @Override
  public DataSource createDataSource() {
    return mDataSourceFactory.createDataSource();
  }
}

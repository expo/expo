package expo.modules.av.player.datasource;

import android.content.Context;

import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultDataSourceFactory;
import com.google.android.exoplayer2.upstream.TransferListener;

import java.util.Map;

import expo.modules.av.ForwardingCookieHandler;
import okhttp3.JavaNetCookieJar;
import okhttp3.OkHttpClient;

public class SharedCookiesDataSourceFactory implements DataSource.Factory {
  private final DataSource.Factory mDataSourceFactory;

  public SharedCookiesDataSourceFactory(Context reactApplicationContext, String userAgent, Map<String, Object> requestHeaders, TransferListener transferListener) {
    OkHttpClient.Builder builder = new OkHttpClient.Builder();
    builder.cookieJar(new JavaNetCookieJar(new ForwardingCookieHandler()));
    OkHttpClient client = builder.build();
    mDataSourceFactory = new DefaultDataSourceFactory(reactApplicationContext, transferListener, new CustomHeadersOkHttpDataSourceFactory(client, userAgent, requestHeaders));
  }

  @Override
  public DataSource createDataSource() {
    return mDataSourceFactory.createDataSource();
  }
}

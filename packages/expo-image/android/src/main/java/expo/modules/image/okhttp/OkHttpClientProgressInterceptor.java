package expo.modules.image.okhttp;

import com.facebook.react.modules.network.ProgressListener;
import com.facebook.react.modules.network.ProgressResponseBody;

import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;

import androidx.annotation.NonNull;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Response;

public class OkHttpClientProgressInterceptor implements Interceptor {
  private Map<String, Collection<WeakReference<ProgressListener>>> mProgressListeners;

  private OkHttpClientProgressInterceptor() {
    mProgressListeners = new HashMap<>();
  }

  private static OkHttpClientProgressInterceptor sInstance;

  public static OkHttpClientProgressInterceptor getInstance() {
    synchronized (OkHttpClientProgressInterceptor.class) {
      if (sInstance == null) {
        sInstance = new OkHttpClientProgressInterceptor();
      }
    }
    return sInstance;
  }

  /**
   * Mostly copied from https://github.com/square/okhttp/blob/97a5e7a9e0cdafd2bb7cbc9a8bb1931082aaa0e4/samples/guide/src/main/java/okhttp3/recipes/Progress.java#L62-L69
   *
   * @return An instance of {@link OkHttpClient.Builder} configured for notifying
   * {@link OkHttpClientProgressInterceptor} of new request information.
   */
  @NonNull
  @Override
  public Response intercept(Chain chain) throws IOException {
    final WeakReference<OkHttpClientProgressInterceptor> weakThis = new WeakReference<>(this);
    final String requestUrl = chain.call().request().url().toString();
    Response originalResponse = chain.proceed(chain.request());

    return originalResponse.newBuilder()
        .body(new ProgressResponseBody(originalResponse.body(), new ProgressListener() {
          @Override
          public void onProgress(long bytesWritten, long contentLength, boolean done) {
            OkHttpClientProgressInterceptor strongThis = weakThis.get();
            if (strongThis != null) {
              Collection<WeakReference<ProgressListener>> urlListeners = strongThis.mProgressListeners.get(requestUrl);

              if (urlListeners != null) {
                for (WeakReference<ProgressListener> listenerReference : urlListeners) {
                  ProgressListener listener = listenerReference.get();
                  if (listener != null) {
                    listener.onProgress(bytesWritten, contentLength, done);
                  }
                }
              }

              if (done) {
                strongThis.mProgressListeners.remove(requestUrl);
              }
            }
          }
        }))
        .build();
  }

  public void registerProgressListener(String requestUrl, ProgressListener requestListener) {
    Collection<WeakReference<ProgressListener>> requestListeners = mProgressListeners.get(requestUrl);
    if (requestListeners == null) {
      requestListeners = new HashSet<>();
      mProgressListeners.put(requestUrl, requestListeners);
    }
    requestListeners.add(new WeakReference<>(requestListener));
  }
}

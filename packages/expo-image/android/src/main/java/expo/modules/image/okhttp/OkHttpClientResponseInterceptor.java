package expo.modules.image.okhttp;

import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;

import androidx.annotation.NonNull;
import okhttp3.Interceptor;
import okhttp3.Response;

public class OkHttpClientResponseInterceptor implements Interceptor {
  private Map<String, Collection<WeakReference<ResponseListener>>> mResponseListeners;

  private OkHttpClientResponseInterceptor() {
    mResponseListeners = new HashMap<>();
  }

  private static OkHttpClientResponseInterceptor sInstance;

  public static OkHttpClientResponseInterceptor getInstance() {
    synchronized (OkHttpClientResponseInterceptor.class) {
      if (sInstance == null) {
        sInstance = new OkHttpClientResponseInterceptor();
      }
    }
    return sInstance;
  }

  @NonNull
  @Override
  public Response intercept(Interceptor.Chain chain) throws IOException {
    final String requestUrl = chain.call().request().url().toString();
    Response response = chain.proceed(chain.request());

    Collection<WeakReference<ResponseListener>> responseListeners = mResponseListeners.get(requestUrl);
    if (responseListeners != null) {
      for (WeakReference<ResponseListener> responseListenerReference : responseListeners) {
        ResponseListener listener = responseListenerReference.get();
        if (listener != null) {
          listener.onResponse(requestUrl, response);
        }
      }
    }

    return response;
  }

  public void registerResponseListener(String requestUrl, ResponseListener responseListener) {
    Collection<WeakReference<ResponseListener>> responseListeners = mResponseListeners.get(requestUrl);
    if (responseListeners == null) {
      responseListeners = new HashSet<>();
      mResponseListeners.put(requestUrl, responseListeners);
    }
    responseListeners.add(new WeakReference<>(responseListener));
  }
}

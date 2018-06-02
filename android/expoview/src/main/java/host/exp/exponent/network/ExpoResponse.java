package host.exp.exponent.network;

import java.io.IOException;
import java.io.InputStream;

public class ExpoResponse {

  expolib_v1.okhttp3.Response mOkHttpResponse;

  public ExpoResponse(expolib_v1.okhttp3.Response response) {
    mOkHttpResponse = response;
  }

  public class ExpoBody {

    expolib_v1.okhttp3.ResponseBody mResponseBody;

    public ExpoBody(expolib_v1.okhttp3.ResponseBody responseBody) {
      mResponseBody = responseBody;
    }

    public String string() throws IOException {
      return mResponseBody.string();
    }

    public InputStream byteStream() {
      return mResponseBody.byteStream();
    }

  }

  public class ExpoHeaders {

    expolib_v1.okhttp3.Headers mHeaders;

    public ExpoHeaders(expolib_v1.okhttp3.Headers headers) {
      mHeaders = headers;
    }

    public String get(String name) {
      return mHeaders.get(name);
    }
  }

  public boolean isSuccessful() {
    return mOkHttpResponse.isSuccessful();
  }

  public ExpoBody body() {
    return new ExpoBody(mOkHttpResponse.body());
  }

  public int code() {
    return mOkHttpResponse.code();
  }

  public ExpoHeaders headers() {
    return new ExpoHeaders(mOkHttpResponse.headers());
  }

  public ExpoResponse networkResponse() {
    return new ExpoResponse(mOkHttpResponse.networkResponse());
  }
}

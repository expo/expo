package host.exp.exponent.network;

import java.io.IOException;
import java.io.InputStream;

public class OkHttpV1ExpoResponse implements ExpoResponse {

  expolib_v1.okhttp3.Response mOkHttpResponse;

  public OkHttpV1ExpoResponse(expolib_v1.okhttp3.Response response) {
    mOkHttpResponse = response;
  }

  class OkHttpV1ExpoBody implements ExpoBody {
    expolib_v1.okhttp3.ResponseBody mResponseBody;

    public OkHttpV1ExpoBody(expolib_v1.okhttp3.ResponseBody responseBody) {
      mResponseBody = responseBody;
    }

    @Override
    public String string() throws IOException {
      return mResponseBody.string();
    }

    @Override
    public InputStream byteStream() {
      return mResponseBody.byteStream();
    }

    @Override
    public byte[] bytes() throws IOException {
      return mResponseBody.bytes();
    }
  }

  public class OkHttpV1ExpoHeaders implements ExpoHeaders {
    expolib_v1.okhttp3.Headers mHeaders;

    public OkHttpV1ExpoHeaders(expolib_v1.okhttp3.Headers headers) {
      mHeaders = headers;
    }

    @Override
    public String get(String name) {
      return mHeaders.get(name);
    }
  }

  @Override
  public boolean isSuccessful() {
    return mOkHttpResponse.isSuccessful();
  }

  @Override
  public ExpoBody body() {
    return new OkHttpV1ExpoBody(mOkHttpResponse.body());
  }

  @Override
  public int code() {
    return mOkHttpResponse.code();
  }

  @Override
  public ExpoHeaders headers() {
    return new OkHttpV1ExpoHeaders(mOkHttpResponse.headers());
  }

  @Override
  public ExpoResponse networkResponse() {
    if (mOkHttpResponse.networkResponse() == null) {
      return null;
    } else {
      return new OkHttpV1ExpoResponse(mOkHttpResponse.networkResponse());
    }
  }
}

package host.exp.exponent.network;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Map;

public class ManualExpoResponse implements ExpoResponse {

  private boolean mIsSuccessful = true;
  private ExpoBody mBody = null;
  private int mCode = 200;
  private ManualExpoHeaders mHeaders = new ManualExpoHeaders();
  private ExpoResponse mNetworkResponse = null;

  class ManualExpoBody implements ExpoBody {

    private String mString;

    ManualExpoBody(String string) {
      mString = string;
    }

    @Override
    public String string() throws IOException {
      return mString;
    }

    @Override
    public InputStream byteStream() {
      return new ByteArrayInputStream(mString.getBytes());
    }

    @Override
    public byte[] bytes() throws IOException {
      return mString.getBytes();
    }
  }

  class ManualExpoHeaders implements ExpoHeaders {

    Map<String, String> headers = new HashMap<>();

    @Override
    public String get(String name) {
      return headers.get(name);
    }
  }

  public void setIsSuccessful(final boolean isSuccessful) {
    mIsSuccessful = isSuccessful;
  }

  public void setBody(final String string) {
    mBody = new ManualExpoBody(string);
  }

  public void setCode(final int code) {
    mCode = code;
  }

  public void setHeader(final String key, final String value) {
    mHeaders.headers.put(key, value);
  }

  public void setNetworkResponse(final ExpoResponse expoResponse) {
    mNetworkResponse = expoResponse;
  }

  @Override
  public boolean isSuccessful() {
    return mIsSuccessful;
  }

  @Override
  public ExpoBody body() {
    return mBody;
  }

  @Override
  public int code() {
    return mCode;
  }

  @Override
  public ExpoHeaders headers() {
    return mHeaders;
  }

  @Override
  public ExpoResponse networkResponse() {
    return mNetworkResponse;
  }
}

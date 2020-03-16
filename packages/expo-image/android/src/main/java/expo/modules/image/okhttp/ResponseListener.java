package expo.modules.image.okhttp;

import okhttp3.Response;

public interface ResponseListener {
  void onResponse(String requestUrl, Response response);
}

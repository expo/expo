package host.exp.exponent.network;

import java.io.IOException;

public interface ExpoHttpCallback {
  void onFailure(IOException e);
  void onResponse(ExpoResponse response) throws IOException;
}

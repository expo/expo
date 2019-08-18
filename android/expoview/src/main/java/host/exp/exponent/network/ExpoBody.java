package host.exp.exponent.network;

import java.io.IOException;
import java.io.InputStream;

public interface ExpoBody {
  String string() throws IOException;
  InputStream byteStream();
  byte[] bytes() throws IOException;
}

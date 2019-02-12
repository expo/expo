package expo.modules.crypto;

import android.content.Context;
import android.util.Base64;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.Promise;

public class CryptoModule extends ExportedModule implements ModuleRegistryConsumer {

  public CryptoModule(Context context) {
    super(context);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
  }

  @Override
  public String getName() {
    return "ExpoCrypto";
  }

  @ExpoMethod
  public void digestStringAsync(String algorithm, String data, final Map<String, Object> options, final Promise promise) {
    // hex
    String encoding = (String)options.get("encoding");

    try { 
      MessageDigest md = MessageDigest.getInstance(algorithm);
      md.update(data.getBytes());
      byte[] digest = md.digest();
      if (encoding.equals("base64")) {
        String output = Base64.encodeToString(digest, Base64.DEFAULT);
        promise.resolve(output);
      } else if (encoding.equals("hex")) {
        StringBuilder stringBuilder = new StringBuilder();
        for (int i=0; i < digest.length; i++) {
          stringBuilder.append(Integer.toString((digest[i] & 0xff) +
              0x100, 16).substring(1));
        }
        String output = stringBuilder.toString();
        promise.resolve(output);
      } else {
        promise.reject("ERR_CRYPTO", "Invalid encoding type provided.");
      }
    } catch (NoSuchAlgorithmException e) {
      promise.reject("ERR_DIGEST", e);
    }
  }
}

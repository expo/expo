package expo.modules.crypto;

import android.content.Context;
import android.util.Base64;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

public class CryptoModule extends ExportedModule {

  public CryptoModule(Context context) {
    super(context);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
  }

  @Override
  public String getName() {
    return "ExpoCrypto";
  }

  @ExpoMethod
  public void digestStringAsync(String algorithm, String data, final Map<String, Object> options, final Promise promise) {
    String encoding = (String) options.get("encoding");

    MessageDigest md;
    try {
      md = MessageDigest.getInstance(algorithm);
      md.update(data.getBytes());
    } catch (NoSuchAlgorithmException e) {
      promise.reject("ERR_CRYPTO_DIGEST", e);
      return;
    }

    byte[] digest = md.digest();
    if (encoding.equals("base64")) {
      String output = Base64.encodeToString(digest, Base64.NO_WRAP);
      promise.resolve(output);
    } else if (encoding.equals("hex")) {
      StringBuilder stringBuilder = new StringBuilder(digest.length * 2);
      for (int i = 0; i < digest.length; i++) {
        stringBuilder.append(Integer.toString((digest[i] & 0xff) +
            0x100, 16).substring(1));
      }
      String output = stringBuilder.toString();
      promise.resolve(output);
    } else {
      promise.reject("ERR_CRYPTO_DIGEST", "Invalid encoding type provided.");
    }
  }
}

package versioned.host.exp.exponent.modules.api.cognito;

import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

import android.util.Base64;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Callback;
import java.math.BigInteger;

public class RNAWSCognitoModule extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;

  private static final String HEX_N = "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1"
          + "29024E088A67CC74020BBEA63B139B22514A08798E3404DD"
          + "EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245"
          + "E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED"
          + "EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D"
          + "C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F"
          + "83655D23DCA3AD961C62F356208552BB9ED529077096966D"
          + "670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B"
          + "E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9"
          + "DE2BCBF6955817183995497CEA956AE515D2261898FA0510"
          + "15728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64"
          + "ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7"
          + "ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6B"
          + "F12FFA06D98A0864D87602733EC86A64521F2B18177B200C"
          + "BBE117577A615D6C770988C0BAD946E208E24FA074E5AB31"
          + "43DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF";

  private static final BigInteger N = new BigInteger(HEX_N, 16);

  public RNAWSCognitoModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "RNAWSCognito";
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String getRandomBase64(int byteLength) throws NoSuchAlgorithmException {
    byte[] data = new byte[byteLength];
    SecureRandom random = new SecureRandom();

    random.nextBytes(data);

    return Base64.encodeToString(data, Base64.NO_WRAP);
  }

  @ReactMethod
  public void computeModPow(final ReadableMap values, final Callback callback) {
    try {
      final BigInteger target = new BigInteger(values.getString("target"), 16);
      final BigInteger value = new BigInteger(values.getString("value"), 16);
      final BigInteger modifier = new BigInteger(values.getString("modifier"), 16);
      final BigInteger result = target.modPow(value, modifier);
      callback.invoke(null, result.toString(16));
    } catch (final Exception e) {
      callback.invoke(e.getMessage(), null);
    }
  }

  @ReactMethod
  public void computeS(final ReadableMap values, final Callback callback) {
    try {
      final BigInteger g = new BigInteger(values.getString("g"), 16);
      final BigInteger x = new BigInteger(values.getString("x"), 16);
      final BigInteger k = new BigInteger(values.getString("k"), 16);
      final BigInteger a = new BigInteger(values.getString("a"), 16);
      final BigInteger b = new BigInteger(values.getString("b"), 16);
      final BigInteger u = new BigInteger(values.getString("u"), 16);
      final BigInteger exp = a.add(u.multiply(x));
      final BigInteger base = b.subtract(k.multiply(g.modPow(x, N)));
      final BigInteger result = base.modPow(exp, N).mod(N);
      callback.invoke(null, result.toString(16));
    } catch (final Exception e) {
      callback.invoke(e.getMessage(), null);
    }
  }
}
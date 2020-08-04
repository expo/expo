package expo.modules.updates.loader;

import android.annotation.SuppressLint;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.Signature;
import java.security.SignatureException;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;

import okhttp3.CacheControl;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Request;
import okhttp3.Response;

public class Crypto {

  public interface RSASignatureListener {
    void onError(Exception exception, boolean isNetworkError);
    void onCompleted(boolean isValid);
  }

  private static String PUBLIC_KEY_URL = "https://exp.host/--/manifest-public-key";

  public static void verifyPublicRSASignature(final String plainText, final String cipherText, final RSASignatureListener listener) {
    fetchPublicKeyAndVerifyPublicRSASignature(true, plainText, cipherText, listener);
  }

  // On first attempt use cache. If verification fails try a second attempt without
  // cache in case the keys were actually rotated.
  // On second attempt reject promise if it fails.
  private static void fetchPublicKeyAndVerifyPublicRSASignature(final boolean isFirstAttempt, final String plainText, final String cipherText, final RSASignatureListener listener) {
    final CacheControl cacheControl = isFirstAttempt ? CacheControl.FORCE_CACHE : CacheControl.FORCE_NETWORK;

    final Request request = new Request.Builder()
            .url(PUBLIC_KEY_URL)
            .cacheControl(cacheControl)
            .build();

    FileDownloader.downloadData(request, new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        listener.onError(e, true);
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        Exception exception;

        try {
          boolean isValid = verifyPublicRSASignature(response.body().string(), plainText, cipherText);
          listener.onCompleted(isValid);
          return;
        } catch (Exception e) {
          exception = e;
        }

        if (isFirstAttempt) {
          fetchPublicKeyAndVerifyPublicRSASignature(false, plainText, cipherText, listener);
        } else {
          listener.onError(exception, false);
        }
      }
    });
  }

  private static boolean verifyPublicRSASignature(String publicKey, String plainText, String cipherText)
          throws NoSuchAlgorithmException, InvalidKeySpecException, InvalidKeyException, SignatureException {
    // remove comments from public key
    String publicKeySplit[] = publicKey.split("\\r?\\n");
    String publicKeyNoComments = "";
    for (String line : publicKeySplit) {
      if (!line.contains("PUBLIC KEY-----")) {
        publicKeyNoComments += line + "\n";
      }
    }

    Signature signature = Signature.getInstance("SHA256withRSA");
    byte[] decodedPublicKey = Base64.decode(publicKeyNoComments, Base64.DEFAULT);
    X509EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(decodedPublicKey);
    @SuppressLint("InlinedApi") KeyFactory keyFactory = KeyFactory.getInstance(KeyProperties.KEY_ALGORITHM_RSA);
    PublicKey key = keyFactory.generatePublic(publicKeySpec);

    signature.initVerify(key);
    signature.update(plainText.getBytes());
    return signature.verify(Base64.decode(cipherText, Base64.DEFAULT));
  }
}

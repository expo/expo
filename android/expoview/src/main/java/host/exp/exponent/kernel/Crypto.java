// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import org.spongycastle.util.encoders.Base64;

import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.Signature;
import java.security.SignatureException;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;

import javax.crypto.BadPaddingException;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.inject.Inject;
import javax.inject.Singleton;

import host.exp.exponent.network.ExpoHttpCallback;
import host.exp.exponent.network.ExpoResponse;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.expoview.Exponent;
import expolib_v1.okhttp3.CacheControl;
import expolib_v1.okhttp3.Call;
import expolib_v1.okhttp3.Callback;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.Response;

@Singleton
public class Crypto {

  public interface RSASignatureListener {
    void onError(String errorMessage, boolean isNetworkError);
    void onCompleted(boolean isValid);
  }

  ExponentNetwork mExponentNetwork;

  @Inject
  public Crypto(ExponentNetwork exponentNetwork) {
    mExponentNetwork = exponentNetwork;
  }

  public void verifyPublicRSASignature(final String publicKeyUrl, final String plainText, final String cipherText, final RSASignatureListener listener) {
    fetchPublicKeyAndVerifyPublicRSASignature(true, publicKeyUrl, plainText, cipherText, listener);
  }

  // On first attempt use cache. If verification fails try a second attempt without
  // cache in case the keys were actually rotated.
  // On second attempt reject promise if it fails.
  private void fetchPublicKeyAndVerifyPublicRSASignature(final boolean isFirstAttempt, final String publicKeyUrl, final String plainText, final String cipherText, final RSASignatureListener listener) {
    final CacheControl cacheControl = isFirstAttempt ? CacheControl.FORCE_CACHE : CacheControl.FORCE_NETWORK;

    final Request request = new Request.Builder()
        .url(publicKeyUrl)
        .cacheControl(cacheControl)
        .build();

    mExponentNetwork.getClient().call(request, new ExpoHttpCallback() {
      @Override
      public void onFailure(IOException e) {
        listener.onError(e.toString(), true);
      }

      @Override
      public void onResponse(ExpoResponse response) throws IOException {
        String errorMessage;

        try {
          boolean isValid = verifyPublicRSASignature(response.body().string(), plainText, cipherText);
          listener.onCompleted(isValid);
          return;
        } catch (NoSuchPaddingException e) {
          errorMessage = "Error with RSA key.";
        } catch (NoSuchAlgorithmException e) {
          errorMessage = "Error with RSA key.";
        } catch (InvalidKeySpecException e) {
          errorMessage = "Error verifying.";
        } catch (InvalidKeyException e) {
          errorMessage = "Error verifying.";
        } catch (BadPaddingException e) {
          errorMessage = "Error verifying.";
        } catch (IllegalBlockSizeException e) {
          errorMessage = "Error verifying.";
        } catch (Exception e) {
          errorMessage = "Error verifying.";
        }

        if (isFirstAttempt) {
          fetchPublicKeyAndVerifyPublicRSASignature(false, publicKeyUrl, plainText, cipherText, listener);
        } else {
          listener.onError(errorMessage, false);
        }
      }
    });
  }

  private boolean verifyPublicRSASignature(String publicKey, String plainText, String cipherText) throws NoSuchPaddingException,
      NoSuchAlgorithmException, InvalidKeySpecException, InvalidKeyException, BadPaddingException, IllegalBlockSizeException, SignatureException {
    // remove comments
    String publicKeySplit[] = publicKey.split("\\r?\\n");
    String publicKeyNoComments = "";
    for (String line : publicKeySplit) {
      if (!line.contains("PUBLIC KEY-----")) {
        publicKeyNoComments += line + "\n";
      }
    }

    Signature signature = Signature.getInstance("SHA256withRSA", Exponent.getBouncyCastleProvider());
    byte[] decodedPublicKey = Base64.decode(publicKeyNoComments);
    X509EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(decodedPublicKey);
    KeyFactory keyFactory = KeyFactory.getInstance(publicKeySpec.getFormat());
    PublicKey key = keyFactory.generatePublic(publicKeySpec);

    signature.initVerify(key);
    signature.update(plainText.getBytes());
    return signature.verify(Base64.decode(cipherText));
  }
}

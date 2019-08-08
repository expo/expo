package versioned.host.exp.exponent.modules.universal;

import android.content.Context;
import android.security.KeyPairGeneratorSpec;
import android.security.keystore.KeyProperties;

import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.Provider;
import java.security.Security;
import java.security.UnrecoverableEntryException;
import java.security.spec.AlgorithmParameterSpec;
import java.util.Arrays;
import java.util.Date;

import javax.security.auth.x500.X500Principal;

import org.unimodules.core.arguments.ReadableArguments;
import expo.modules.securestore.SecureStoreModule;
import host.exp.expoview.Exponent;

public class SecureStoreModuleBinding extends SecureStoreModule {
  public SecureStoreModuleBinding(Context context) {
    super(context);
    mHybridAESEncrypter = new ExponentHybridAESEncrypter(context, mAESEncrypter);
  }

  protected class ExponentHybridAESEncrypter extends HybridAESEncrypter {
    public ExponentHybridAESEncrypter(Context context, SecureStoreModule.AESEncrypter aesEncrypter) {
      super(context, aesEncrypter);
    }

    @Override
    public KeyStore.PrivateKeyEntry initializeKeyStoreEntry(KeyStore keyStore, ReadableArguments options) throws GeneralSecurityException {
      String keystoreAlias = getKeyStoreAlias(options);
      // See https://tools.ietf.org/html/rfc1779#section-2.3 for the DN grammar
      String escapedCommonName = '"' + keystoreAlias.replace("\\", "\\\\").replace("\"", "\\\"") + '"';
      AlgorithmParameterSpec algorithmSpec = new KeyPairGeneratorSpec.Builder(mContext)
          .setAlias(keystoreAlias)
          .setSubject(new X500Principal("CN=" + escapedCommonName + ", OU=SecureStore"))
          .setSerialNumber(new BigInteger(X509_SERIAL_NUMBER_LENGTH_BITS, mSecureRandom))
          .setStartDate(new Date(0))
          .setEndDate(new Date(Long.MAX_VALUE))
          .build();

      KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, keyStore.getProvider());
      keyPairGenerator.initialize(algorithmSpec);

      // Before Android M, only the AndroidOpenSSL provider doesn't throw an exception when
      // generating the key pair. Since we give the Spongy Castle provider the highest priority, we
      // need to tell Android not to use it here. Unfortunately generateKeyPair() generates a
      // certificate without passing in an explicit provider, which means Android chooses a provider
      // based on priority and uses Spongy Castle: https://android.googlesource.com/platform/frameworks/base/+/android-5.0.0_r7/keystore/java/android/security/AndroidKeyPairGenerator.java#133
      // So, we temporarily remove Spongy Castle, generate the key pair, and then add it back.
      Provider spongyCastleProvider = Exponent.getBouncyCastleProvider();
      // Security providers are 1-indexed
      int spongyCastleProviderPosition = Arrays.asList(Security.getProviders()).indexOf(spongyCastleProvider) + 1;
      if (spongyCastleProviderPosition > 0) {
        Security.removeProvider(spongyCastleProvider.getName());
      }
      try {
        keyPairGenerator.generateKeyPair();
      } finally {
        if (spongyCastleProviderPosition > 0) {
          Security.insertProviderAt(spongyCastleProvider, spongyCastleProviderPosition);
        }
      }

      KeyStore.PrivateKeyEntry keyStoreEntry = (KeyStore.PrivateKeyEntry) keyStore.getEntry(keystoreAlias, null);
      if (keyStoreEntry == null) {
        throw new UnrecoverableEntryException("Could not retrieve the newly generated private key entry");
      }

      return keyStoreEntry;
    }
  }
}

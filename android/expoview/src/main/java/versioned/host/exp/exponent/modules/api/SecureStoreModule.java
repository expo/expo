// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.security.KeyPairGeneratorSpec;
import android.text.TextUtils;
import android.util.Base64;
import android.util.Log;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.security.InvalidAlgorithmParameterException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.UnrecoverableEntryException;
import java.security.cert.CertificateException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.GregorianCalendar;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.security.auth.x500.X500Principal;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.network.OkHttpClientProvider;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.utils.ScopedContext;
import host.exp.exponent.kernel.ExperienceId;

public class SecureStoreModule extends ReactContextBaseJavaModule {
  private static final String TAG = SecureStoreModule.class.getSimpleName();
  private static final String KEYSTORE = "AndroidKeyStore";
  private static final String ALIAS = "MY_APP";
  private static final String ALIAS_KEY = "keychainService";
  private static final String TYPE_RSA = "RSA";
  private static final String CYPHER = "RSA/ECB/PKCS1Padding";
  private static final String ENCODING = "UTF-8";

  private ScopedContext mScopedContext;
  private ExperienceId mExperienceId;
  private Promise mPromise;
  
  public SecureStoreModule(ReactApplicationContext reactContext, ScopedContext scopedContext, ExperienceId experienceId) {
    super(reactContext);
    mScopedContext = scopedContext;
    mExperienceId = experienceId;
  }

  private String scopedKey(final String key) {
    return key.trim().length() > 0 ? mExperienceId + key:null;
  }

  private void set(final String key, final String value, final ReadableMap options) {
    SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mScopedContext);
    if (value == null) {
      prefs.edit().putString(key, null).apply();
      this.mPromise.resolve(null);
    } else {
      try {
        prefs.edit().putString(key, encryptString(value, options)).apply();
        this.mPromise.resolve(null);
      } catch (Exception e) {
        e.printStackTrace();
        this.mPromise.reject("E_SECURESTORE_SETVALUEFAIL", "Set value encountered an error.", e);
      }
    }
  } 

  private void get(final String key, final ReadableMap options) {
    SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mScopedContext);
    final String pref = prefs.getString(key, "");
    
    if (!TextUtils.isEmpty(pref)) {
      try {
        String decrpytedValue = decryptString(pref, options);
        this.mPromise.resolve(decrpytedValue);
        return;
      } catch (Exception e) {
        this.mPromise.reject("E_SECURESTORE_GETVALUEFAIL", "Get value encountered an error.", e);
        return;
      }
    }
      
    this.mPromise.reject("E_SECURESTORE_GETVALUEFAIL", "The specified item could not be found in the keychain.");
  }
  
  private void delete(final String key) {
    SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mScopedContext);
    try {
      prefs.edit().remove(key).commit();
      this.mPromise.resolve(null);
    } catch (Exception e) {
      e.printStackTrace();
      this.mPromise.reject("E_SECURESTORE_DELETEVALUEFAIL", "Delete value encountered an error.", e);
      return;
    }
  }
  
  private String encryptString(final String toEncrypt, final ReadableMap options) throws Exception {
    try {
      final KeyStore.PrivateKeyEntry privateKeyEntry = getPrivateKey(options);
      if (privateKeyEntry != null) {
        final PublicKey publicKey = privateKeyEntry.getCertificate().getPublicKey();
        
        Cipher input = Cipher.getInstance(CYPHER);
        input.init(Cipher.ENCRYPT_MODE, publicKey);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        CipherOutputStream cipherOutputStream = new CipherOutputStream(outputStream, input);
        cipherOutputStream.write(toEncrypt.getBytes(ENCODING));
        cipherOutputStream.close();

        byte[] vals = outputStream.toByteArray();
        return Base64.encodeToString(vals, Base64.DEFAULT);
      }
    } catch (Exception e) {
      Log.e(TAG, Log.getStackTraceString(e));
      throw e;
    }
    
    return null;
  }

  private String decryptString(final String encrypted, final ReadableMap options) throws Exception {
    try {
      KeyStore.PrivateKeyEntry privateKeyEntry = getPrivateKey(options);
      if (privateKeyEntry != null) {
        final PrivateKey privateKey = privateKeyEntry.getPrivateKey();
        
        Cipher output = Cipher.getInstance(CYPHER);
        output.init(Cipher.DECRYPT_MODE, privateKey);

        CipherInputStream cipherInputStream = new CipherInputStream(
        new ByteArrayInputStream(Base64.decode(encrypted, Base64.DEFAULT)), output);
        ArrayList<Byte> values = new ArrayList<>();
        int nextByte;
        
        while ((nextByte = cipherInputStream.read()) != -1) {
          values.add((byte) nextByte);
        }

        byte[] bytes = new byte[values.size()];
        for (int i = 0; i < bytes.length; i++) {
          bytes[i] = values.get(i);
        }

        return new String(bytes, 0, bytes.length, ENCODING);
      }
    } catch (Exception e) {
      Log.e(TAG, Log.getStackTraceString(e));
      throw e;
    }

    return null;
  }

  private KeyStore.PrivateKeyEntry getPrivateKey(final ReadableMap options) throws KeyStoreException,
                                                          CertificateException,
                                                          NoSuchAlgorithmException,
                                                          IOException,
                                                          UnrecoverableEntryException,
                                                          NoSuchProviderException,
                                                          InvalidAlgorithmParameterException {
    KeyStore ks = KeyStore.getInstance(KEYSTORE);
    ks.load(null);
    final String alias = options.hasKey(ALIAS_KEY) ? options.getString(ALIAS_KEY) : ALIAS;
    KeyStore.Entry entry = ks.getEntry(alias, null);

    if (entry == null) {
      Log.w(TAG, "No key found under alias: " + alias);
      Log.w(TAG, "Generating new key...");
      
      try {
        createKeys(options);
        ks = KeyStore.getInstance(KEYSTORE);
        ks.load(null);
        entry = ks.getEntry(alias, null);

        if (entry == null) {
          Log.w(TAG, "Generating new key failed...");
          return null;
        }
      } catch (NoSuchProviderException e) {
        Log.w(TAG, "Generating new key failed...");
        e.printStackTrace();
        throw e;
      } catch (InvalidAlgorithmParameterException e) {
        Log.w(TAG, "Generating new key failed...");
        e.printStackTrace();
        throw e;
      }
    }
    
    if (!(entry instanceof KeyStore.PrivateKeyEntry)) {
      Log.w(TAG, "Not an instance of a PrivateKeyEntry");
      Log.w(TAG, "Exiting signData()...");
      return null;
    }

    return (KeyStore.PrivateKeyEntry) entry;
  }

  private void createKeys(final ReadableMap options) throws NoSuchProviderException,
                                   NoSuchAlgorithmException,
                                   InvalidAlgorithmParameterException {
    Calendar start = new GregorianCalendar();
    Calendar end = new GregorianCalendar();
    end.add(Calendar.YEAR, 100);

    final String alias = options.hasKey(ALIAS_KEY) ? options.getString(ALIAS_KEY) : ALIAS;

    KeyPairGeneratorSpec spec =
      new KeyPairGeneratorSpec.Builder(mScopedContext)
        .setAlias(alias)
        .setSubject(new X500Principal("CN=" + alias))
        .setSerialNumber(BigInteger.valueOf(1337))
        .setStartDate(start.getTime())
        .setEndDate(end.getTime())
        .build();

    final KeyPairGenerator kpGenerator = KeyPairGenerator.getInstance(TYPE_RSA, KEYSTORE);
    kpGenerator.initialize(spec);

    final KeyPair kp = kpGenerator.generateKeyPair();
    Log.d(TAG, "Public Key is: " + kp.getPublic().toString());
  }

  @Override
  public String getName() {
    return "ExponentSecureStore";
  }

  @ReactMethod
  public void setValueWithKeyAsync(final String value, final String key, final ReadableMap options, final Promise promise) {
    this.mPromise = promise;
    this.set(key, value, options);
  }

  @ReactMethod
  public void getValueWithKeyAsync(final String key, final ReadableMap options, final Promise promise) {
    this.mPromise = promise;
    this.get(key, options);
  }

  @ReactMethod
  public void deleteValueWithKeyAsync(String key, ReadableMap options, Promise promise) {
    this.mPromise = promise;
    this.delete(key);
  }
}

// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.security.KeyPairGeneratorSpec;
import android.text.TextUtils;
import android.util.Base64;
import android.util.Log;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import javax.security.cert.CertificateException;
import java.security.InvalidAlgorithmParameterException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.KeyStore.Entry;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.UnrecoverableEntryException;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.GregorianCalendar;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.KeyGenerator;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;

import java.security.InvalidKeyException;
import java.security.KeyStore.SecretKeyEntry;
import java.security.KeyStore.PrivateKeyEntry;

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
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.utils.ScopedContext;

public class SecureStoreModule extends ReactContextBaseJavaModule {
  private static final String TAG = SecureStoreModule.class.getSimpleName();
  private static final String KEYSTORE = "AndroidKeyStore";
  private static final String ALIAS = "MY_APP";
  private static final String ALIAS_KEY = "keychainService";
  private static final String TYPE_AES = "AES";
  private static final String AES_CIPHER = "AES/CBC/PKCS7Padding";
  private static final String RSA_CIPHER = "RSA/ECB/PKCS1Padding";
  private static final String ENCODING = "UTF-8";
  private static final String IV_PREFIX = "iv:";
  private final int AES_BIT_LENGTH = 256;

  private ScopedContext mScopedContext;
  private ExperienceId mExperienceId;
  private Promise mPromise;
  
  public SecureStoreModule(ReactApplicationContext reactContext, ScopedContext scopedContext, ExperienceId experienceId) {
    super(reactContext);
    mScopedContext = scopedContext;
    mExperienceId = experienceId;
  }

  private String ivKey(final String key) {
    return IV_PREFIX + key;
  } 

  private void set(final String key, final String value, final ReadableMap options) {
    SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mScopedContext);
    if (value == null) {
      prefs.edit().putString(key, null).apply();
      this.mPromise.resolve(null);
    } else {
      try {
        //The Cipher used to encrypt the value generates a random IV (Initialization Vector) that is required for decryption.
        //The IV is stored in `SharedPrefs` with the same key as the stored value prefixed with "iv:"
        final EncryptionResult result = encryptAES(value, options);
        prefs.edit().putString(key, result.encryptedString).putString(ivKey(key), result.iv).apply();
        this.mPromise.resolve(null);
      } catch (Exception e) {
        e.printStackTrace();
        this.mPromise.reject("E_SECURESTORE_SETVALUEFAIL", "Error setting value in SecureStore", e);
      }
    }
  }

  private void get(final String key, final ReadableMap options) {
    try {
      String decryptedValue = tryDecrypt(key, options);
      this.mPromise.resolve(decryptedValue);
      return;
    } catch (Exception e) {
      this.mPromise.reject("E_SECURESTORE_GETVALUEFAIL", "Error getting value in SecureStore", e);
      return;
    }
  }
  
  private void delete(final String key) {
    SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mScopedContext);
    try {
      prefs.edit().remove(key).commit();
      this.mPromise.resolve(null);
    } catch (Exception e) {
      e.printStackTrace();
      this.mPromise.reject("E_SECURESTORE_DELETEVALUEFAIL", "Error deleting a value in SecureStore", e);
      return;
    }
  }
   
  private EncryptionResult encryptAES(final String toEncrypt, final ReadableMap options) throws KeyStoreException,
                                                                                                NoSuchAlgorithmException,
                                                                                                InvalidAlgorithmParameterException,
                                                                                                UnsupportedEncodingException,
                                                                                                IllegalBlockSizeException,
                                                                                                BadPaddingException,
                                                                                                NoSuchPaddingException,
                                                                                                InvalidKeyException,
                                                                                                CertificateException,
                                                                                                IOException,
                                                                                                UnrecoverableEntryException,
                                                                                                NoSuchProviderException,
                                                                                                Exception  {
    final KeyStore.SecretKeyEntry secretKeyEntry = (KeyStore.SecretKeyEntry) getSecretKeyEntry(options);
    if (secretKeyEntry != null) {
      final SecretKey secretKey = secretKeyEntry.getSecretKey();
      Cipher c = Cipher.getInstance(AES_CIPHER);
      c.init(Cipher.ENCRYPT_MODE, secretKey);
      byte[] encodedBytes = c.doFinal(toEncrypt.getBytes(ENCODING));
      final String encryptedString = Base64.encodeToString(encodedBytes, Base64.NO_WRAP);
      final String ivString = Base64.encodeToString(c.getIV(), Base64.DEFAULT);
      return new EncryptionResult(encryptedString, ivString);
    } else {
      throw new KeyStoreException("SecureStore could not locate or create a key entry.");
    }
  }

  //Determine if there is a legacy KeyStore.PrivateKeyEntry created with SDK 20 and use legacy methods if applicable.
  private String tryDecrypt(final String key, final ReadableMap options) throws KeyStoreException,
                                                                                NoSuchAlgorithmException,
                                                                                InvalidAlgorithmParameterException,
                                                                                UnsupportedEncodingException,
                                                                                IllegalBlockSizeException,
                                                                                BadPaddingException,
                                                                                NoSuchPaddingException,
                                                                                InvalidKeyException,
                                                                                CertificateException,
                                                                                IOException,
                                                                                UnrecoverableEntryException,
                                                                                NoSuchProviderException,
                                                                                Exception {
    final KeyStore.Entry entry = getKeyEntry(options);
    if (entry != null) {
      //If the entry exists, and is an instance of `KeyStore.PrivateKeyEntry`, check if the key was ever encrypted with AES.
      if (entry instanceof KeyStore.PrivateKeyEntry) {
        //If an entry in SharedPreferences exists for the IVKey, the value has been encrypted with AES and needs to be decrypted with decryptAES(...)
        //If there's no entry in SharedPreferences for the IVKey, the value needs to be decrypted with decryptRSA(...).
        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mScopedContext);
        final String ivString = prefs.getString(ivKey(key), null);
        if (TextUtils.isEmpty(ivString)) {
          return decryptRSA(key, options);
        } else {
          return decryptAES(key, options);
        }
      } else {
        return decryptAES(key, options);
      }
    }  else {
      throw new KeyStoreException("SecureStore could not locate or create a key entry.");
    }
  }

  private String decryptAES(final String key, final ReadableMap options) throws KeyStoreException,
                                                                                NoSuchAlgorithmException,
                                                                                InvalidAlgorithmParameterException,
                                                                                UnsupportedEncodingException,
                                                                                IllegalBlockSizeException,
                                                                                BadPaddingException,
                                                                                NoSuchPaddingException,
                                                                                InvalidKeyException,
                                                                                CertificateException,
                                                                                IOException,
                                                                                UnrecoverableEntryException,
                                                                                NoSuchProviderException,
                                                                                Exception {
    SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mScopedContext);
    final String encrypted = prefs.getString(key, null);
    final String ivString = prefs.getString(ivKey(key), null);
    if (TextUtils.isEmpty(encrypted)) {
      return null;
    }
    KeyStore.SecretKeyEntry secretKeyEntry = getSecretKeyEntry(options);
    if (secretKeyEntry != null) {
      final SecretKey secretKey = secretKeyEntry.getSecretKey();
      Cipher c = Cipher.getInstance(AES_CIPHER);
      byte[] ivBytes = Base64.decode(ivString, Base64.DEFAULT);
      IvParameterSpec spec = new IvParameterSpec(ivBytes);
      c.init(Cipher.DECRYPT_MODE, secretKey, spec);
      byte[] decodedValue = Base64.decode(encrypted.getBytes(), Base64.NO_WRAP);
      byte[] decodedBytes = c.doFinal(decodedValue);
      return new String(decodedBytes, 0, decodedBytes.length, ENCODING);
    } else {
      throw new KeyStoreException("SecureStore could not locate or create a key entry.");
    }
  }

  //Legacy decryption method if there was a KeyStore.Entry created with SDK 20
  private String decryptRSA(final String key, final ReadableMap options) throws KeyStoreException,
                                                                                NoSuchAlgorithmException,
                                                                                InvalidAlgorithmParameterException,
                                                                                UnsupportedEncodingException,
                                                                                IllegalBlockSizeException,
                                                                                BadPaddingException,
                                                                                NoSuchPaddingException,
                                                                                InvalidKeyException,
                                                                                CertificateException,
                                                                                IOException,
                                                                                UnrecoverableEntryException,
                                                                                NoSuchProviderException,
                                                                                Exception {
    SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mScopedContext);
    final String encrypted = prefs.getString(key, null);
    if (TextUtils.isEmpty(encrypted)) {
      return null;
    }
    KeyStore.PrivateKeyEntry privateKeyEntry = (KeyStore.PrivateKeyEntry) getKeyEntry(options);
    if (privateKeyEntry != null) {
      final PrivateKey privateKey = privateKeyEntry.getPrivateKey();
      Cipher c = Cipher.getInstance(RSA_CIPHER);
      c.init(Cipher.DECRYPT_MODE, privateKey);
      byte[] decodedValue = Base64.decode(encrypted.getBytes(), Base64.NO_WRAP);
      byte[] decodedBytes = c.doFinal(decodedValue);
      return new String(decodedBytes, 0, decodedBytes.length, ENCODING);
    } else {
      throw new KeyStoreException("SecureStore could not locate or create a key entry.");
    }
  }

  private KeyStore.Entry getKeyEntry(final ReadableMap options) throws KeyStoreException,
                                                                       CertificateException,
                                                                       NoSuchAlgorithmException,
                                                                       IOException,
                                                                       UnrecoverableEntryException,
                                                                       NoSuchProviderException,
                                                                       InvalidAlgorithmParameterException,
                                                                       Exception {
    KeyStore ks = KeyStore.getInstance(KEYSTORE);
    ks.load(null);
    final String alias = options.hasKey(ALIAS_KEY) ? options.getString(ALIAS_KEY) : ALIAS;
    KeyStore.Entry entry = ks.getEntry(alias, null);

    if (entry == null) {
      Log.w(TAG, "No key found under alias: " + alias);
      Log.w(TAG, "Generating new key...");
      
      try {
        createSecretKey(options);
        ks = KeyStore.getInstance(KEYSTORE);
        ks.load(null);
        entry = ks.getEntry(alias, null);

        if (entry == null) {
          Log.w(TAG, "Generating new key failed...");
          return null;
        }
      } catch (InvalidAlgorithmParameterException e) {
        Log.w(TAG, "Generating new key failed...");
        e.printStackTrace();
        throw e;
      }
    }
    
    if (!(entry instanceof KeyStore.Entry)) {
      Log.w(TAG, "Not an instance of a KeyStore.Entry");
      Log.w(TAG, "Exiting signData()...");
      return null;
    }

    return entry;
  }

  private KeyStore.SecretKeyEntry getSecretKeyEntry(final ReadableMap options) throws KeyStoreException,
                                                                                      CertificateException,
                                                                                      NoSuchAlgorithmException,
                                                                                      IOException,
                                                                                      UnrecoverableEntryException,
                                                                                      NoSuchProviderException,
                                                                                      InvalidAlgorithmParameterException,
                                                                                      Exception {
    KeyStore ks = KeyStore.getInstance(KEYSTORE);
    ks.load(null);
    final String alias = options.hasKey(ALIAS_KEY) ? (AES_CIPHER + options.getString(ALIAS_KEY)) : (AES_CIPHER + ALIAS);
    KeyStore.Entry entry = ks.getEntry(alias, null);

    if (entry == null) {
      Log.w(TAG, "No key found under alias: " + alias);
      Log.w(TAG, "Generating new key...");
      
      try {
        createSecretKey(options);
        ks = KeyStore.getInstance(KEYSTORE);
        ks.load(null);
        entry = ks.getEntry(alias, null);

        if (entry == null) {
          Log.w(TAG, "Generating new key failed...");
          return null;
        }
      } catch (InvalidAlgorithmParameterException e) {
        Log.w(TAG, "Generating new key failed...");
        e.printStackTrace();
        throw e;
      }
    }
    
    if (!(entry instanceof KeyStore.SecretKeyEntry)) {
      Log.w(TAG, "Not an instance of a KeyStore.SecretKeyEntry");
      Log.w(TAG, "Exiting signData()...");
      return null;
    }

    return (KeyStore.SecretKeyEntry) entry;
  }

  private SecretKey createSecretKey(final ReadableMap options) throws NullPointerException,
                                                                      NoSuchAlgorithmException,
                                                                      NoSuchProviderException,
                                                                      InvalidAlgorithmParameterException {
    final String alias = options.hasKey(ALIAS_KEY) ? (AES_CIPHER + options.getString(ALIAS_KEY)) : (AES_CIPHER + ALIAS);
    KeyGenerator keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE);
    keyGenerator.init(
      new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
      .setKeySize(AES_BIT_LENGTH)
      .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
      .build());
    return keyGenerator.generateKey();
  }

  private static class EncryptionResult {
    final String encryptedString;
    final String iv;

    public EncryptionResult(final String encrypted, final String iv) {
      this.encryptedString = encrypted;
      this.iv = iv;
    }
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

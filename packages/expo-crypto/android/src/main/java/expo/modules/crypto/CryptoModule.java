package expo.modules.crypto;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.URLUtil;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.security.InvalidKeyException;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.net.URL;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.interfaces.ActivityProvider;
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
    String encoding = options.get("encoding");

    try { 
      MessageDigest md = MessageDigest.getInstance(algorithm);
      md.update(data.getBytes());
      byte[] digest = md.digest();
      String output = Base64.encodeToString(digest, Base64.DEFAULT);
      promise.resolve(output);
    } catch (Exception e) {
      promise.reject("ERR_DIGEST", e);
    }
  }
}

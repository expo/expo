package expo.modules.appauth;

/*
 * Copyright 2016 The AppAuth for Android Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */


import android.annotation.SuppressLint;
import android.net.Uri;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import net.openid.appauth.Preconditions;
import net.openid.appauth.connectivity.ConnectionBuilder;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import java.util.concurrent.TimeUnit;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

/**
 * An implementation of {@link ConnectionBuilder} that permits connecting to http
 * links, and ignores certificates for https connections. *THIS SHOULD NOT BE USED IN PRODUCTION
 * CODE*. It is intended to facilitate easier testing of AppAuth against development servers
 * only.
 */
public final class UnsafeConnectionBuilder implements ConnectionBuilder {

  public static final UnsafeConnectionBuilder INSTANCE = new UnsafeConnectionBuilder();

  private static final String TAG = "ConnBuilder";

  private static final int CONNECTION_TIMEOUT_MS = (int) TimeUnit.SECONDS.toMillis(15);
  private static final int READ_TIMEOUT_MS = (int) TimeUnit.SECONDS.toMillis(10);

  private static final String HTTP = "http";
  private static final String HTTPS = "https";

  @SuppressLint("TrustAllX509TrustManager")
  private static final TrustManager[] ANY_CERT_MANAGER = new TrustManager[]{
      new X509TrustManager() {
        public X509Certificate[] getAcceptedIssuers() {
          return null;
        }

        public void checkClientTrusted(X509Certificate[] certs, String authType) {
        }

        public void checkServerTrusted(X509Certificate[] certs, String authType) {
        }
      }
  };

  @SuppressLint("BadHostnameVerifier")
  private static final HostnameVerifier ANY_HOSTNAME_VERIFIER = new HostnameVerifier() {
    public boolean verify(String hostname, SSLSession session) {
      return true;
    }
  };

  @Nullable
  private static final SSLContext TRUSTING_CONTEXT;

  static {
    SSLContext context;
    try {
      context = SSLContext.getInstance("SSL");
    } catch (NoSuchAlgorithmException e) {
      Log.e("ConnBuilder", "Unable to acquire SSL context");
      context = null;
    }

    SSLContext initializedContext = null;
    if (context != null) {
      try {
        context.init(null, ANY_CERT_MANAGER, new java.security.SecureRandom());
        initializedContext = context;
      } catch (KeyManagementException e) {
        Log.e(TAG, "Failed to initialize trusting SSL context");
      }
    }

    TRUSTING_CONTEXT = initializedContext;
  }

  private UnsafeConnectionBuilder() {
    // no need to construct new instances
  }

  @NonNull
  @Override
  public HttpURLConnection openConnection(@NonNull Uri uri) throws IOException {
    Preconditions.checkNotNull(uri, "url must not be null");
    Preconditions.checkArgument(HTTP.equals(uri.getScheme()) || HTTPS.equals(uri.getScheme()),
        "scheme or uri must be http or https");
    HttpURLConnection conn = (HttpURLConnection) new URL(uri.toString()).openConnection();
    conn.setConnectTimeout(CONNECTION_TIMEOUT_MS);
    conn.setReadTimeout(READ_TIMEOUT_MS);
    conn.setInstanceFollowRedirects(false);

    if (conn instanceof HttpsURLConnection && TRUSTING_CONTEXT != null) {
      HttpsURLConnection httpsConn = (HttpsURLConnection) conn;
      httpsConn.setSSLSocketFactory(TRUSTING_CONTEXT.getSocketFactory());
      httpsConn.setHostnameVerifier(ANY_HOSTNAME_VERIFIER);
    }

    return conn;
  }
}
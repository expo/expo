/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.modules.network;

import android.os.Build;
import com.facebook.common.logging.FLog;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import javax.annotation.Nullable;
import okhttp3.ConnectionSpec;
import okhttp3.OkHttpClient;
import okhttp3.TlsVersion;

/**
 * Helper class that provides the same OkHttpClient instance that will be used for all networking
 * requests.
 */
public class OkHttpClientProvider {

    // Centralized OkHttpClient for all networking requests.
    @Nullable
    public static OkHttpClient sClient;

    // User-provided OkHttpClient factory
    @Nullable
    public static OkHttpClientFactory sFactory;

    public static void setOkHttpClientFactory(OkHttpClientFactory factory) {
        sFactory = factory;
    }

    public static OkHttpClient getOkHttpClient() {
        if (sClient == null) {
            sClient = createClient();
        }
        return sClient;
    }

    // okhttp3 OkHttpClient is immutable
    // This allows app to init an OkHttpClient with custom settings.
    public static void replaceOkHttpClient(OkHttpClient client) {
        sClient = client;
    }

    public static OkHttpClient createClient() {
        try {
            return (OkHttpClient) Class.forName("host.exp.exponent.ReactNativeStaticHelpers").getMethod("getOkHttpClient", Class.class).invoke(null, OkHttpClientProvider.class);
        } catch (Exception expoHandleErrorException) {
            expoHandleErrorException.printStackTrace();
            return null;
        }
    }

    public static OkHttpClient.Builder createClientBuilder() {
        // No timeouts by default
        OkHttpClient.Builder client = new OkHttpClient.Builder().connectTimeout(0, TimeUnit.MILLISECONDS).readTimeout(0, TimeUnit.MILLISECONDS).writeTimeout(0, TimeUnit.MILLISECONDS).cookieJar(new ReactCookieJarContainer());
        return client;
    }
}

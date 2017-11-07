/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
package com.facebook.react.devsupport;

import android.content.Context;
import android.os.AsyncTask;
import android.os.Handler;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.network.OkHttpCallUtil;
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback;
import com.facebook.react.devsupport.interfaces.StackFrame;
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers;
import com.facebook.react.packagerconnection.FileIoHandler;
import com.facebook.react.packagerconnection.JSPackagerClient;
import com.facebook.react.packagerconnection.NotificationOnlyHandler;
import com.facebook.react.packagerconnection.RequestHandler;
import com.facebook.react.packagerconnection.RequestOnlyHandler;
import com.facebook.react.packagerconnection.Responder;
import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import javax.annotation.Nullable;
import expolib_v1.okhttp3.Call;
import expolib_v1.okhttp3.Callback;
import expolib_v1.okhttp3.ConnectionPool;
import expolib_v1.okhttp3.MediaType;
import expolib_v1.okhttp3.OkHttpClient;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.RequestBody;
import expolib_v1.okhttp3.Response;
import expolib_v1.okhttp3.ResponseBody;
import expolib_v1.okio.Okio;
import expolib_v1.okio.Sink;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Helper class for all things about the debug server running in the engineer's host machine.
 *
 * One can use 'debug_http_host' shared preferences key to provide a host name for the debug server.
 * If the setting is empty we support and detect two basic configuration that works well for android
 * emulators connectiong to debug server running on emulator's host:
 *  - Android stock emulator with standard non-configurable local loopback alias: 10.0.2.2,
 *  - Genymotion emulator with default settings: 10.0.3.2
 */
public class DevServerHelper {

    public static String RELOAD_APP_EXTRA_JS_PROXY = "jsproxy";

    public static String RELOAD_APP_ACTION_SUFFIX = ".RELOAD_APP_ACTION";

    public static String BUNDLE_URL_FORMAT = "http://%s/%s.bundle?platform=android&dev=%s&minify=%s";

    public static String RESOURCE_URL_FORMAT = "http://%s/%s";

    public static String SOURCE_MAP_URL_FORMAT = BUNDLE_URL_FORMAT.replaceFirst("\\.bundle", ".map");

    public static String LAUNCH_JS_DEVTOOLS_COMMAND_URL_FORMAT = "http://%s/launch-js-devtools";

    public static String ONCHANGE_ENDPOINT_URL_FORMAT = "http://%s/onchange";

    public static String WEBSOCKET_PROXY_URL_FORMAT = "ws://%s/debugger-proxy?role=client";

    public static String PACKAGER_STATUS_URL_FORMAT = "http://%s/status";

    public static String HEAP_CAPTURE_UPLOAD_URL_FORMAT = "http://%s/jscheapcaptureupload";

    public static String INSPECTOR_DEVICE_URL_FORMAT = "http://%s/inspector/device?name=%s&app=%s";

    public static String SYMBOLICATE_URL_FORMAT = "http://%s/symbolicate";

    public static String OPEN_STACK_FRAME_URL_FORMAT = "http://%s/open-stack-frame";

    public static String PACKAGER_OK_STATUS = "packager-status:running";

    // 2 mins
    public static int LONG_POLL_KEEP_ALIVE_DURATION_MS = 2 * 60 * 1000;

    public static int LONG_POLL_FAILURE_DELAY_MS = 5000;

    public static int HTTP_CONNECT_TIMEOUT_MS = 5000;

    public static String DEBUGGER_MSG_DISABLE = "{ \"id\":1,\"method\":\"Debugger.disable\" }";

    public interface OnServerContentChangeListener {

        void onServerContentChanged();
    }

    public interface PackagerCommandListener {

        void onPackagerReloadCommand();

        void onPackagerDevMenuCommand();

        void onCaptureHeapCommand(final Responder responder);

        void onPokeSamplingProfilerCommand(final Responder responder);
    }

    public interface SymbolicationListener {

        void onSymbolicationComplete(@Nullable Iterable<StackFrame> stackFrames);
    }

    public final DevInternalSettings mSettings;

    public final OkHttpClient mClient;

    public final Handler mRestartOnChangePollingHandler;

    public final BundleDownloader mBundleDownloader;

    public final String mPackageName;

    public boolean mOnChangePollingEnabled;

    @Nullable
    public JSPackagerClient mPackagerClient;

    @Nullable
    public InspectorPackagerConnection mInspectorPackagerConnection;

    @Nullable
    public OkHttpClient mOnChangePollingClient;

    @Nullable
    public OnServerContentChangeListener mOnServerContentChangeListener;

    public DevServerHelper(DevInternalSettings settings, String packageName) {
        mSettings = settings;
        mClient = new OkHttpClient.Builder().connectTimeout(HTTP_CONNECT_TIMEOUT_MS, TimeUnit.MILLISECONDS).readTimeout(0, TimeUnit.MILLISECONDS).writeTimeout(0, TimeUnit.MILLISECONDS).build();
        mBundleDownloader = new BundleDownloader(mClient);
        mRestartOnChangePollingHandler = new Handler();
        mPackageName = packageName;
    }

    public void openPackagerConnection(final String clientId, final PackagerCommandListener commandListener) {
        if (mPackagerClient != null) {
            FLog.w(ReactConstants.TAG, "Packager connection already open, nooping.");
            return;
        }
        new AsyncTask<Void, Void, Void>() {

            @Override
            protected Void doInBackground(Void... backgroundParams) {
                Map<String, RequestHandler> handlers = new HashMap<>();
                handlers.put("reload", new NotificationOnlyHandler() {

                    @Override
                    public void onNotification(@Nullable Object params) {
                        commandListener.onPackagerReloadCommand();
                    }
                });
                handlers.put("devMenu", new NotificationOnlyHandler() {

                    @Override
                    public void onNotification(@Nullable Object params) {
                        commandListener.onPackagerDevMenuCommand();
                    }
                });
                handlers.put("captureHeap", new RequestOnlyHandler() {

                    @Override
                    public void onRequest(@Nullable Object params, Responder responder) {
                        commandListener.onCaptureHeapCommand(responder);
                    }
                });
                handlers.put("pokeSamplingProfiler", new RequestOnlyHandler() {

                    @Override
                    public void onRequest(@Nullable Object params, Responder responder) {
                        commandListener.onPokeSamplingProfilerCommand(responder);
                    }
                });
                handlers.putAll(new FileIoHandler().handlers());
                mPackagerClient = new JSPackagerClient(clientId, mSettings.getPackagerConnectionSettings(), handlers);
                mPackagerClient.init();
                return null;
            }
        }.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
    }

    public void closePackagerConnection() {
        new AsyncTask<Void, Void, Void>() {

            @Override
            protected Void doInBackground(Void... params) {
                if (mPackagerClient != null) {
                    mPackagerClient.close();
                    mPackagerClient = null;
                }
                return null;
            }
        }.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
    }

    public void openInspectorConnection() {
        if (mInspectorPackagerConnection != null) {
            FLog.w(ReactConstants.TAG, "Inspector connection already open, nooping.");
            return;
        }
        new AsyncTask<Void, Void, Void>() {

            @Override
            protected Void doInBackground(Void... params) {
                mInspectorPackagerConnection = new InspectorPackagerConnection(getInspectorDeviceUrl(), mPackageName);
                mInspectorPackagerConnection.connect();
                return null;
            }
        }.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
    }

    public void sendEventToAllConnections(String event) {
        if (mInspectorPackagerConnection != null) {
            mInspectorPackagerConnection.sendEventToAllConnections(event);
        }
    }

    public void disableDebugger() {
        if (mInspectorPackagerConnection != null) {
            mInspectorPackagerConnection.sendEventToAllConnections(DEBUGGER_MSG_DISABLE);
        }
    }

    public void closeInspectorConnection() {
        new AsyncTask<Void, Void, Void>() {

            @Override
            protected Void doInBackground(Void... params) {
                if (mInspectorPackagerConnection != null) {
                    mInspectorPackagerConnection.closeQuietly();
                    mInspectorPackagerConnection = null;
                }
                return null;
            }
        }.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
    }

    public void symbolicateStackTrace(Iterable<StackFrame> stackFrames, final SymbolicationListener listener) {
        try {
            final String symbolicateURL = createSymbolicateURL(mSettings.getPackagerConnectionSettings().getDebugServerHost());
            final JSONArray jsonStackFrames = new JSONArray();
            for (final StackFrame stackFrame : stackFrames) {
                jsonStackFrames.put(stackFrame.toJSON());
            }
            final Request request = new Request.Builder().url(symbolicateURL).post(RequestBody.create(MediaType.parse("application/json"), new JSONObject().put("stack", jsonStackFrames).toString())).build();
            Call symbolicateCall = Assertions.assertNotNull(mClient.newCall(request));
            symbolicateCall.enqueue(new Callback() {

                @Override
                public void onFailure(Call call, IOException e) {
                    FLog.w(ReactConstants.TAG, "Got IOException when attempting symbolicate stack trace: " + e.getMessage());
                    listener.onSymbolicationComplete(null);
                }

                @Override
                public void onResponse(Call call, final Response response) throws IOException {
                    try {
                        listener.onSymbolicationComplete(Arrays.asList(StackTraceHelper.convertJsStackTrace(new JSONObject(response.body().string()).getJSONArray("stack"))));
                    } catch (JSONException exception) {
                        listener.onSymbolicationComplete(null);
                    }
                }
            });
        } catch (JSONException e) {
            FLog.w(ReactConstants.TAG, "Got JSONException when attempting symbolicate stack trace: " + e.getMessage());
        }
    }

    public void openStackFrameCall(StackFrame stackFrame) {
        final String openStackFrameURL = createOpenStackFrameURL(mSettings.getPackagerConnectionSettings().getDebugServerHost());
        final Request request = new Request.Builder().url(openStackFrameURL).post(RequestBody.create(MediaType.parse("application/json"), stackFrame.toJSON().toString())).build();
        Call symbolicateCall = Assertions.assertNotNull(mClient.newCall(request));
        symbolicateCall.enqueue(new Callback() {

            @Override
            public void onFailure(Call call, IOException e) {
                FLog.w(ReactConstants.TAG, "Got IOException when attempting to open stack frame: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, final Response response) throws IOException {
            // We don't have a listener for this.
            }
        });
    }

    /** Intent action for reloading the JS */
    public static String getReloadAppAction(Context context) {
        return context.getPackageName() + RELOAD_APP_ACTION_SUFFIX;
    }

    public String getWebsocketProxyURL() {
        return String.format(Locale.US, WEBSOCKET_PROXY_URL_FORMAT, mSettings.getPackagerConnectionSettings().getDebugServerHost());
    }

    public String getHeapCaptureUploadUrl() {
        return String.format(Locale.US, HEAP_CAPTURE_UPLOAD_URL_FORMAT, mSettings.getPackagerConnectionSettings().getDebugServerHost());
    }

    public String getInspectorDeviceUrl() {
        return String.format(Locale.US, INSPECTOR_DEVICE_URL_FORMAT, mSettings.getPackagerConnectionSettings().getInspectorServerHost(), AndroidInfoHelpers.getFriendlyDeviceName(), mPackageName);
    }

    public BundleDownloader getBundleDownloader() {
        return mBundleDownloader;
    }

    /**
   * @return the host to use when connecting to the bundle server from the host itself.
   */
    private String getHostForJSProxy() {
        // Use custom port if configured. Note that host stays "localhost".
        String host = Assertions.assertNotNull(mSettings.getPackagerConnectionSettings().getDebugServerHost());
        int portOffset = host.lastIndexOf(':');
        if (portOffset > -1) {
            return "localhost" + host.substring(portOffset);
        } else {
            return AndroidInfoHelpers.DEVICE_LOCALHOST;
        }
    }

    /**
   * @return whether we should enable dev mode when requesting JS bundles.
   */
    private boolean getDevMode() {
        return mSettings.isJSDevModeEnabled();
    }

    /**
   * @return whether we should request minified JS bundles.
   */
    private boolean getJSMinifyMode() {
        return mSettings.isJSMinifyEnabled();
    }

    private String createBundleURL(String host, String jsModulePath, boolean devMode, boolean jsMinify) {
        try {
            return (String) Class.forName("host.exp.exponent.ReactNativeStaticHelpers").getMethod("getBundleUrlForActivityId", int.class, String.class, String.class, boolean.class, boolean.class).invoke(null, mSettings.exponentActivityId, host, jsModulePath, devMode, jsMinify);
        } catch (Exception expoHandleErrorException) {
            expoHandleErrorException.printStackTrace();
            return null;
        }
    }

    private static String createResourceURL(String host, String resourcePath) {
        return String.format(Locale.US, RESOURCE_URL_FORMAT, host, resourcePath);
    }

    private static String createSymbolicateURL(String host) {
        return String.format(Locale.US, SYMBOLICATE_URL_FORMAT, host);
    }

    private static String createOpenStackFrameURL(String host) {
        return String.format(Locale.US, OPEN_STACK_FRAME_URL_FORMAT, host);
    }

    public String getDevServerBundleURL(final String jsModulePath) {
        return createBundleURL(mSettings.getPackagerConnectionSettings().getDebugServerHost(), jsModulePath, getDevMode(), getJSMinifyMode());
    }

    public void isPackagerRunning(final PackagerStatusCallback callback) {
        String statusURL = createPackagerStatusURL(mSettings.getPackagerConnectionSettings().getDebugServerHost());
        Request request = new Request.Builder().url(statusURL).build();
        mClient.newCall(request).enqueue(new Callback() {

            @Override
            public void onFailure(Call call, IOException e) {
                FLog.w(ReactConstants.TAG, "The packager does not seem to be running as we got an IOException requesting " + "its status: " + e.getMessage());
                callback.onPackagerStatusFetched(false);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                    FLog.e(ReactConstants.TAG, "Got non-success http code from packager when requesting status: " + response.code());
                    callback.onPackagerStatusFetched(false);
                    return;
                }
                ResponseBody body = response.body();
                if (body == null) {
                    FLog.e(ReactConstants.TAG, "Got null body response from packager when requesting status");
                    callback.onPackagerStatusFetched(false);
                    return;
                }
                if (!PACKAGER_OK_STATUS.equals(body.string())) {
                    FLog.e(ReactConstants.TAG, "Got unexpected response from packager when requesting status: " + body.string());
                    callback.onPackagerStatusFetched(false);
                    return;
                }
                callback.onPackagerStatusFetched(true);
            }
        });
    }

    private static String createPackagerStatusURL(String host) {
        return String.format(Locale.US, PACKAGER_STATUS_URL_FORMAT, host);
    }

    public void stopPollingOnChangeEndpoint() {
        mOnChangePollingEnabled = false;
        mRestartOnChangePollingHandler.removeCallbacksAndMessages(null);
        if (mOnChangePollingClient != null) {
            OkHttpCallUtil.cancelTag(mOnChangePollingClient, this);
            mOnChangePollingClient = null;
        }
        mOnServerContentChangeListener = null;
    }

    public void startPollingOnChangeEndpoint(OnServerContentChangeListener onServerContentChangeListener) {
        if (mOnChangePollingEnabled) {
            // polling already enabled
            return;
        }
        mOnChangePollingEnabled = true;
        mOnServerContentChangeListener = onServerContentChangeListener;
        mOnChangePollingClient = new OkHttpClient.Builder().connectionPool(new ConnectionPool(1, LONG_POLL_KEEP_ALIVE_DURATION_MS, TimeUnit.MINUTES)).connectTimeout(HTTP_CONNECT_TIMEOUT_MS, TimeUnit.MILLISECONDS).build();
        enqueueOnChangeEndpointLongPolling();
    }

    private void handleOnChangePollingResponse(boolean didServerContentChanged) {
        if (mOnChangePollingEnabled) {
            if (didServerContentChanged) {
                UiThreadUtil.runOnUiThread(new Runnable() {

                    @Override
                    public void run() {
                        if (mOnServerContentChangeListener != null) {
                            mOnServerContentChangeListener.onServerContentChanged();
                        }
                    }
                });
            }
            enqueueOnChangeEndpointLongPolling();
        }
    }

    private void enqueueOnChangeEndpointLongPolling() {
        Request request = new Request.Builder().url(createOnChangeEndpointUrl()).tag(this).build();
        Assertions.assertNotNull(mOnChangePollingClient).newCall(request).enqueue(new Callback() {

            @Override
            public void onFailure(Call call, IOException e) {
                if (mOnChangePollingEnabled) {
                    // this runnable is used by onchange endpoint poller to delay subsequent requests in case
                    // of a failure, so that we don't flood network queue with frequent requests in case when
                    // dev server is down
                    FLog.d(ReactConstants.TAG, "Error while requesting /onchange endpoint", e);
                    mRestartOnChangePollingHandler.postDelayed(new Runnable() {

                        @Override
                        public void run() {
                            handleOnChangePollingResponse(false);
                        }
                    }, LONG_POLL_FAILURE_DELAY_MS);
                }
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                handleOnChangePollingResponse(response.code() == 205);
            }
        });
    }

    private String createOnChangeEndpointUrl() {
        return String.format(Locale.US, ONCHANGE_ENDPOINT_URL_FORMAT, mSettings.getPackagerConnectionSettings().getDebugServerHost());
    }

    private String createLaunchJSDevtoolsCommandUrl() {
        return String.format(Locale.US, LAUNCH_JS_DEVTOOLS_COMMAND_URL_FORMAT, mSettings.getPackagerConnectionSettings().getDebugServerHost());
    }

    public void launchJSDevtools() {
        Request request = new Request.Builder().url(createLaunchJSDevtoolsCommandUrl()).build();
        mClient.newCall(request).enqueue(new Callback() {

            @Override
            public void onFailure(Call call, IOException e) {
            // ignore HTTP call response, this is just to open a debugger page and there is no reason
            // to report failures from here
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
            // ignore HTTP call response - see above
            }
        });
    }

    public String getSourceMapUrl(String mainModuleName) {
        return String.format(Locale.US, SOURCE_MAP_URL_FORMAT, mSettings.getPackagerConnectionSettings().getDebugServerHost(), mainModuleName, getDevMode(), getJSMinifyMode());
    }

    public String getSourceUrl(String mainModuleName) {
        return String.format(Locale.US, BUNDLE_URL_FORMAT, mSettings.getPackagerConnectionSettings().getDebugServerHost(), mainModuleName, getDevMode(), getJSMinifyMode());
    }

    public String getJSBundleURLForRemoteDebugging(String mainModuleName) {
        // host itself.
        return createBundleURL(getHostForJSProxy(), mainModuleName, getDevMode(), getJSMinifyMode());
    }

    /**
   * This is a debug-only utility to allow fetching a file via packager.
   * It's made synchronous for simplicity, but should only be used if it's absolutely
   * necessary.
   * @return the file with the fetched content, or null if there's any failure.
   */
    @Nullable
    public File downloadBundleResourceFromUrlSync(final String resourcePath, final File outputFile) {
        final String resourceURL = createResourceURL(mSettings.getPackagerConnectionSettings().getDebugServerHost(), resourcePath);
        final Request request = new Request.Builder().url(resourceURL).build();
        try {
            Response response = mClient.newCall(request).execute();
            if (!response.isSuccessful()) {
                return null;
            }
            Sink output = null;
            try {
                output = Okio.sink(outputFile);
                Okio.buffer(response.body().source()).readAll(output);
            } finally {
                if (output != null) {
                    output.close();
                }
            }
            return outputFile;
        } catch (Exception ex) {
            FLog.e(ReactConstants.TAG, "Failed to fetch resource synchronously - resourcePath: \"%s\", outputFile: \"%s\"", resourcePath, outputFile.getAbsolutePath(), ex);
            return null;
        }
    }
}

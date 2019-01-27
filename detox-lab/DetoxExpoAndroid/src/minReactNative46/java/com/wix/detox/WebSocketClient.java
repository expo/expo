package com.wix.detox;

import android.util.Log;

import com.wix.detox.systeminfo.Environment;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import expolib_v1.okhttp3.OkHttpClient;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.Response;
import expolib_v1.okhttp3.WebSocket;
import expolib_v1.okhttp3.WebSocketListener;
import expolib_v1.okio.ByteString;

/**
 * Created by rotemm on 27/12/2016.
 */

public class WebSocketClient extends WebSocketListener {

    @Override
    public void onOpen(WebSocket webSocket, Response response) {
        Log.i(LOG_TAG, "At onOpen");
        HashMap params = new HashMap();
        params.put("sessionId", sessionId);
        params.put("role", "testee");
        sendAction("login", params, 0L);
        actionHandler.onConnect();
    }

    @Override
    public void onFailure(WebSocket webSocket, Throwable t, Response response) {
//        Log.e(LOG_TAG, "Detox Error: ", t);

        //OKHttp won't recover from failure if it got ConnectException,
        // this is a workaround to make the websocket client try reconnecting when failed.
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e2) {
            Log.d(LOG_TAG, "interrupted", e2);
        }
        Log.d(LOG_TAG, "Retrying...");
        connectToServer(url, sessionId);
    }

    @Override
    public void onMessage(WebSocket webSocket, String text) {
        Log.i(LOG_TAG, "At onMessage");
        receiveAction(websocket, text);
    }

    @Override
    public void onMessage(WebSocket webSocket, ByteString bytes) {
        Log.e(LOG_TAG, "Unexpected binary ws message from detox server.");
    }

    private volatile boolean closing = false;

    @Override
    public void onClosed(WebSocket webSocket, int code, String reason) {
        Log.d(LOG_TAG, "Detox WS Closed: " + code + " " + reason);
        closing = true;
        actionHandler.onClosed();
    }

    @Override
    public void onClosing(WebSocket webSocket, int code, String reason) {
        Log.i(LOG_TAG, "At onClose");
        closing = true;
        websocket.close(NORMAL_CLOSURE_STATUS, null);
    }

    public void close() {
        if (closing) return;
        closing = true;
        websocket.close(NORMAL_CLOSURE_STATUS, null);
    }

    private static final String LOG_TAG = "WebSocketClient";

    private String url;
    private String sessionId;
    private OkHttpClient client;
    private WebSocket websocket = null;
    private ActionHandler actionHandler;

    private static final int NORMAL_CLOSURE_STATUS = 1000;

    public WebSocketClient(ActionHandler actionHandler) {
        this.actionHandler = actionHandler;
    }

    public void connectToServer(String sessionId) {

        connectToServer(Environment.getServerHost(), sessionId);
    }

    public void connectToServer(String url, String sessionId) {
        Log.i(LOG_TAG, "At connectToServer");
        this.url = url;
        this.sessionId = sessionId;

        client = new OkHttpClient.Builder().
                retryOnConnectionFailure(true).
                connectTimeout(1500, TimeUnit.MILLISECONDS).
                readTimeout(0, TimeUnit.MILLISECONDS).build();

        Request request = new Request.Builder().url(url).build();

        this.websocket = client.newWebSocket(request, this);

        client.dispatcher().executorService().shutdown();
    }

    public void sendAction(String type, Map params, Long messageId) {
        Log.i(LOG_TAG, "At sendAction");
        HashMap data = new HashMap();
        data.put("type", type);
        data.put("params", params);
        data.put("messageId", messageId);
        JSONObject json = new JSONObject(data);

        websocket.send(json.toString());
        Log.d(LOG_TAG, "Detox Action Sent: " + type);
    }

    public void receiveAction(WebSocket webSocket,  String json) {
        Log.i(LOG_TAG, "At receiveAction");
        try {
            JSONObject object = new JSONObject(json);

            String type = (String) object.get("type");
            if (type == null) {
                Log.e(LOG_TAG, "Detox Error: receiveAction missing type");
                return;
            }

            Object params = object.get("params");
            if (params != null && !(params instanceof JSONObject)) {
                Log.d(LOG_TAG, "Detox Error: receiveAction invalid params");
            }
            long messageId = object.getLong("messageId");

            Log.d(LOG_TAG, "Detox Action Received: " + type);

            if (actionHandler != null) actionHandler.onAction(type, params.toString(), messageId);
        } catch (JSONException e) {
            Log.e(LOG_TAG, "Detox Error: receiveAction decode - " + e.toString());
        }
    }

    /**
     * These methods are called on an inner worker thread.
     * @see <a href="https://medium.com/@jakewharton/listener-messages-are-called-on-a-background-thread-since-okhttp-is-agnostic-with-respect-to-5fdc5182e240">OkHTTP</a>
     */
    public interface ActionHandler {
        void onAction(String type, String params, long messageId);
        void onConnect();
        void onClosed();
    }
}

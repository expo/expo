package com.wix.detox;

import android.util.Log;

import com.wix.detox.systeminfo.Environment;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import expolib_v1.okhttp3.OkHttpClient;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.RequestBody;
import expolib_v1.okhttp3.Response;
import expolib_v1.okhttp3.ResponseBody;
import expolib_v1.okhttp3.ws.WebSocket;
import expolib_v1.okhttp3.ws.WebSocketCall;
import expolib_v1.okhttp3.ws.WebSocketListener;
import expolib_v1.okio.Buffer;

import static okhttp3.ws.WebSocket.TEXT;

/**
 * Created by rotemm on 27/12/2016.
 */

public class WebSocketClient implements WebSocketListener {

    @Override
    public void onOpen(WebSocket webSocket, Response response) {
        Log.i(LOG_TAG, "At onOpen");
        this.websocket = webSocket;
        HashMap params = new HashMap();
        params.put("sessionId", sessionId);
        params.put("role", "testee");
        sendAction("login", params, 0L);
        actionHandler.onConnect();
    }

    @Override
    public void onFailure(IOException e, Response response) {
        Log.e(LOG_TAG, "Detox Error: ", e);

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
    public void onMessage(ResponseBody message) throws IOException {
        Log.i(LOG_TAG, "At onMessage");
        if (message.contentType() == WebSocket.TEXT) {
            StringBuffer sb = new StringBuffer();
            String line;
            BufferedReader buffer = new BufferedReader(message.charStream());
            while ((line = buffer.readLine()) != null) {
                sb.append(line);
            }
            receiveAction(websocket, sb.toString());
        }
        message.close();
    }

    @Override
    public void onPong(Buffer payload) {
        // empty
    }

    private volatile boolean closing = false;

    @Override
    public void onClose(int code, String reason) {
        Log.i(LOG_TAG, "At onClose");
        Log.d(LOG_TAG, "Detox Closed: " + code + " " + reason);
        closing = true;
        actionHandler.onClosed();
    }

    public void close() {
        if (closing) {
            return;
        }
        closing = true;
        try {
            websocket.close(NORMAL_CLOSURE_STATUS, null);
        } catch (IOException e) {
            Log.i(LOG_TAG, "WS close", e);
        } catch (IllegalStateException e) {
            Log.i(LOG_TAG, "WS close", e);
        }
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

        WebSocketCall.create(client, request).enqueue(this);

        client.dispatcher().executorService().shutdown();
    }

    public void sendAction(String type, Map params, Long messageId) {
        Log.i(LOG_TAG, "At sendAction");
        HashMap data = new HashMap();
        data.put("type", type);
        data.put("params", params);
        data.put("messageId", messageId);

        JSONObject json = new JSONObject(data);
        try {
            websocket.sendMessage(RequestBody.create(TEXT, json.toString()));
        } catch (IOException e) {
            Log.e(LOG_TAG, "Error sending msg through WS", e);
        }

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

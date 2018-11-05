package expo.modules.firebase.messaging;

// TODO: Evan: Remove React Native - Bundle = WritableMap.
import android.os.Bundle;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class MessagingSerializer {
  public static WritableMap parseRemoteMessage(RemoteMessage message) {
    WritableMap messageMap = Arguments.createMap();
    WritableMap dataMap = Arguments.createMap();

    if (message.getCollapseKey() != null) {
      messageMap.putString("collapseKey", message.getCollapseKey());
    }

    if (message.getData() != null) {
      for (Map.Entry<String, String> e : message
          .getData()
          .entrySet()) {
        dataMap.putString(e.getKey(), e.getValue());
      }
    }
    messageMap.putMap("data", dataMap);

    if (message.getFrom() != null) {
      messageMap.putString("from", message.getFrom());
    }
    if (message.getMessageId() != null) {
      messageMap.putString("messageId", message.getMessageId());
    }
    if (message.getMessageType() != null) {
      messageMap.putString("messageType", message.getMessageType());
    }
    messageMap.putDouble("sentTime", message.getSentTime());
    if (message.getTo() != null) {
      messageMap.putString("to", message.getTo());
    }
    messageMap.putDouble("ttl", message.getTtl());

    return messageMap;
  }


  public static Bundle parseRemoteMessageToBundle(RemoteMessage message) {
    Bundle messageMap = new Bundle();
    Bundle dataMap = new Bundle();

    if (message.getCollapseKey() != null) {
      messageMap.putString("collapseKey", message.getCollapseKey());
    }

    if (message.getData() != null) {
      for (Map.Entry<String, String> e : message
          .getData()
          .entrySet()) {
        dataMap.putString(e.getKey(), e.getValue());
      }
    }
    messageMap.putBundle("data", dataMap);

    if (message.getFrom() != null) {
      messageMap.putString("from", message.getFrom());
    }
    if (message.getMessageId() != null) {
      messageMap.putString("messageId", message.getMessageId());
    }
    if (message.getMessageType() != null) {
      messageMap.putString("messageType", message.getMessageType());
    }
    messageMap.putDouble("sentTime", message.getSentTime());
    if (message.getTo() != null) {
      messageMap.putString("to", message.getTo());
    }
    messageMap.putDouble("ttl", message.getTtl());

    return messageMap;
  }
}
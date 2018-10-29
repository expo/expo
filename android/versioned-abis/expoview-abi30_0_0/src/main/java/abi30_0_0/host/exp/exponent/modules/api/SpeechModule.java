package abi30_0_0.host.exp.exponent.modules.api;

import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import abi30_0_0.com.facebook.react.bridge.Arguments;
import abi30_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi30_0_0.com.facebook.react.bridge.Promise;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi30_0_0.com.facebook.react.bridge.ReactMethod;
import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import abi30_0_0.com.facebook.react.bridge.WritableMap;
import abi30_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayDeque;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Queue;

public class SpeechModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  private TextToSpeech mTextToSpeech;
  private boolean mTtsReady = false;
  private Queue<Map<String, Object>> mDelayedUtterances = new ArrayDeque<>();

  public SpeechModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return "ExponentSpeech";
  }

  @ReactMethod
  public void speak(final String id, final String text, final ReadableMap options) {
    if (mTtsReady) {
      speakOut(id, text, options);
    } else {
      mDelayedUtterances.add(Collections.unmodifiableMap(new HashMap<String, Object>() {
        {
          put("id", id);
          put("text", text);
          put("options", options);
        }
      }));
      // init TTS, speaking will be available only after onInit
      getTextToSpeech();
    }
  }

  private void speakOut(final String id, final String text, final ReadableMap options) {
    TextToSpeech textToSpeech = getTextToSpeech();
    if (options.hasKey("language")) {
      Locale locale = new Locale(options.getString("language"));
      int languageAvailable = textToSpeech.isLanguageAvailable(locale);
      if (languageAvailable != TextToSpeech.LANG_MISSING_DATA &&
          languageAvailable != TextToSpeech.LANG_NOT_SUPPORTED) {
        textToSpeech.setLanguage(locale);
      } else {
        textToSpeech.setLanguage(Locale.getDefault());
      }
    } else {
      textToSpeech.setLanguage(Locale.getDefault());
    }
    if (options.hasKey("pitch")) {
      textToSpeech.setPitch((float) options.getDouble("pitch"));
    }
    if (options.hasKey("rate")) {
      textToSpeech.setSpeechRate((float) options.getDouble("rate"));
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      textToSpeech.speak(
          text,
          TextToSpeech.QUEUE_ADD,
          null,
          id
      );
    } else {
      HashMap<String, String> params = new HashMap<>();
      params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, id);
      textToSpeech.speak(
          text,
          TextToSpeech.QUEUE_ADD,
          params
      );
    }
  }

  @ReactMethod
  public void isSpeaking(Promise promise) {
    promise.resolve(getTextToSpeech().isSpeaking());
  }

  @ReactMethod
  public void stop() {
    getTextToSpeech().stop();
  }

  private TextToSpeech getTextToSpeech() {
    if (mTextToSpeech == null) {
      mTextToSpeech = new TextToSpeech(getReactApplicationContext(), new TextToSpeech.OnInitListener() {
        @Override
        public void onInit(int status) {
          if (status == TextToSpeech.SUCCESS) {
            // synchronize because in some cases this runs on another thread and mTTS is null
            synchronized (SpeechModule.this) {
              mTtsReady = true;
              mTextToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                  getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("Exponent.speakingStarted", idToMap(utteranceId));
                }

                @Override
                public void onDone(String utteranceId) {
                  getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("Exponent.speakingDone", idToMap(utteranceId));
                }

                @Override
                public void onStop(String utteranceId, boolean interrupted) {
                  getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("Exponent.speakingStopped", idToMap(utteranceId));
                }

                @Override
                public void onError(String utteranceId) {
                  getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("Exponent.speakingError", idToMap(utteranceId));
                }
              });

              for (Map<String, Object> arguments : mDelayedUtterances) {
                speakOut(
                  (String) arguments.get("id"),
                  (String) arguments.get("text"),
                  (ReadableMap) arguments.get("options")
                );
              }
            }
          }
        }
      });
    }
    return mTextToSpeech;
  }

  @Override
  public void onHostResume() { }

  @Override
  public void onHostPause() { }

  @Override
  public void onHostDestroy() {
    getTextToSpeech().shutdown();
  }

  private WritableMap idToMap(String id) {
    WritableMap map = Arguments.createMap();
    map.putString("id", id);
    return map;
  }
}

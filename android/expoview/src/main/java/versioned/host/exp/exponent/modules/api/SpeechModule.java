package versioned.host.exp.exponent.modules.api;

import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Locale;

public class SpeechModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  private TextToSpeech mTextToSpeech;
  private boolean mTtsReady = false;

  public SpeechModule(ReactApplicationContext reactContext) {
    super(reactContext);

    mTextToSpeech = new TextToSpeech(getReactApplicationContext(), new TextToSpeech.OnInitListener() {
      @Override
      public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
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
        }
      }
    });
  }

  @Override
  public String getName() {
    return "ExponentSpeech";
  }

  @ReactMethod
  public void speak(final String id, final String text, final ReadableMap options) {
    if (mTtsReady) {
      if (options.hasKey("language")) {
        Locale locale = new Locale(options.getString("language"));
        int languageAvailable = mTextToSpeech.isLanguageAvailable(locale);
        if (languageAvailable != TextToSpeech.LANG_MISSING_DATA &&
            languageAvailable != TextToSpeech.LANG_NOT_SUPPORTED) {
          mTextToSpeech.setLanguage(locale);
        } else {
          mTextToSpeech.setLanguage(Locale.getDefault());
        }
      } else {
        mTextToSpeech.setLanguage(Locale.getDefault());
      }
      if (options.hasKey("pitch")) {
        mTextToSpeech.setPitch((float) options.getDouble("pitch"));
      }
      if (options.hasKey("rate")) {
        mTextToSpeech.setSpeechRate((float) options.getDouble("rate"));
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        mTextToSpeech.speak(
            text,
            TextToSpeech.QUEUE_ADD,
            null,
            id
        );
      } else {
        HashMap<String, String> params = new HashMap<>();
        params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, id);
        mTextToSpeech.speak(
            text,
            TextToSpeech.QUEUE_ADD,
            params
        );
      }
    }
  }

  @ReactMethod
  public void isSpeaking(Promise promise) {
    promise.resolve(mTtsReady && mTextToSpeech.isSpeaking());
  }

  @ReactMethod
  public void stop() {
    if (mTtsReady) {
      mTextToSpeech.stop();
    }
  }

  @Override
  public void onHostResume() { }

  @Override
  public void onHostPause() { }

  @Override
  public void onHostDestroy() {
    mTextToSpeech.shutdown();
  }

  private WritableMap idToMap(String id) {
    WritableMap map = Arguments.createMap();
    map.putString("id", id);
    return map;
  }
}

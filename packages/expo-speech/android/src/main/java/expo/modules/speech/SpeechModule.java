package expo.modules.speech;

import android.content.Context;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;


import java.util.ArrayDeque;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Queue;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.LifecycleEventListener;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.EventEmitter;
import org.unimodules.core.interfaces.services.UIManager;

public class SpeechModule extends ExportedModule implements ModuleRegistryConsumer, LifecycleEventListener {

  private TextToSpeech mTextToSpeech;
  private boolean mTtsReady = false;
  private Queue<Map<String, Object>> mDelayedUtterances = new ArrayDeque<>();
  private Context mContext;
  private ModuleRegistry mModuleRegistry;

  public SpeechModule(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  public String getName() {
    return "ExponentSpeech";
  }

  @ExpoMethod
  public void speak(final String id, final String text, final Map<String, Object> options, final Promise promise) {
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
    promise.resolve(null);
  }

  private void speakOut(final String id, final String text, final Map<String, Object> options) {
    TextToSpeech textToSpeech = getTextToSpeech();
    if (options.containsKey("language")) {
      Locale locale = new Locale((String) options.get("language"));
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
    if (options.containsKey("pitch")) {
      textToSpeech.setPitch(((Number) options.get("pitch")).floatValue());
    }
    if (options.containsKey("rate")) {
      textToSpeech.setSpeechRate(((Number) options.get("rate")).floatValue());
    }

    textToSpeech.speak(
        text,
        TextToSpeech.QUEUE_ADD,
        null,
        id
    );
  }

  @ExpoMethod
  public void isSpeaking(Promise promise) {
    promise.resolve(getTextToSpeech().isSpeaking());
  }

  @ExpoMethod
  public void stop(final Promise promise) {
    getTextToSpeech().stop();
    promise.resolve(null);
  }

  private TextToSpeech getTextToSpeech() {
    if (mTextToSpeech == null) {
      mTextToSpeech = new TextToSpeech(mContext, new TextToSpeech.OnInitListener() {
        @Override
        public void onInit(int status) {
          if (status == TextToSpeech.SUCCESS) {
            // synchronize because in some cases this runs on another thread and mTTS is null
            synchronized (SpeechModule.this) {
              mTtsReady = true;
              mTextToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                  EventEmitter emitter = mModuleRegistry.getModule(EventEmitter.class);
                  emitter.emit("Exponent.speakingStarted", idToMap(utteranceId));
                }

                @Override
                public void onDone(String utteranceId) {
                  EventEmitter emitter = mModuleRegistry.getModule(EventEmitter.class);
                  emitter.emit("Exponent.speakingDone", idToMap(utteranceId));
                }

                @Override
                public void onStop(String utteranceId, boolean interrupted) {
                  EventEmitter emitter = mModuleRegistry.getModule(EventEmitter.class);
                  emitter.emit("Exponent.speakingStopped", idToMap(utteranceId));
                }

                @Override
                public void onError(String utteranceId) {
                  EventEmitter emitter = mModuleRegistry.getModule(EventEmitter.class);
                  emitter.emit("Exponent.speakingError", idToMap(utteranceId));
                }
              });

              for (Map<String, Object> arguments : mDelayedUtterances) {
                speakOut(
                  (String) arguments.get("id"),
                  (String) arguments.get("text"),
                  (Map<String, Object>) arguments.get("options")
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

  private Bundle idToMap(String id) {
    Bundle map = new Bundle();
    map.putString("id", id);
    return map;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    // Unregister from old UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).unregisterLifecycleEventListener(this);
    }

    mModuleRegistry = moduleRegistry;

    // Register to new UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).registerLifecycleEventListener(this);
    }
  }
}

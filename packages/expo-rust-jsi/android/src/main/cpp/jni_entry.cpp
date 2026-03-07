#include <jni.h>
#include <jsi/jsi.h>
#include <android/log.h>

// Rust entry point - defined in Rust lib.rs with #[no_mangle]
extern "C" void expo_rust_jsi_install(void* runtime_ptr);

#define LOG_TAG "ExpoRustJSI"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

extern "C"
JNIEXPORT void JNICALL
Java_expo_modules_rustjsi_ExpoRustJsiModule_nativeInstall(
    JNIEnv* env,
    jobject thiz,
    jlong jsi_runtime_ptr) {

  auto* runtime = reinterpret_cast<facebook::jsi::Runtime*>(jsi_runtime_ptr);
  if (!runtime) {
    LOGE("Failed to install Rust JSI modules: null runtime pointer");
    return;
  }

  try {
    LOGI("Installing Rust JSI modules...");
    expo_rust_jsi_install(reinterpret_cast<void*>(runtime));
    LOGI("Rust JSI modules installed successfully");
  } catch (const std::exception& e) {
    LOGE("Failed to install Rust JSI modules: %s", e.what());
  } catch (...) {
    LOGE("Failed to install Rust JSI modules: unknown error");
  }
}

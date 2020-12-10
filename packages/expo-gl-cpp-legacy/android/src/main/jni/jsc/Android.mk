# android-jsc dependency

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := jsc
LOCAL_SRC_FILES := $(JSC_DIR)/jni/$(TARGET_ARCH_ABI)/libjsc.so
LOCAL_EXPORT_C_INCLUDES := $(JSC_DIR)

include $(PREBUILT_SHARED_LIBRARY)

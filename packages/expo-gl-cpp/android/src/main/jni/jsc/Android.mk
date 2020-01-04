# android-jsc dependency

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := jsc
LOCAL_SRC_FILES := $(LOCAL_PATH)/jni/$(TARGET_ARCH_ABI)/libjsc.so
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

include $(PREBUILT_SHARED_LIBRARY)

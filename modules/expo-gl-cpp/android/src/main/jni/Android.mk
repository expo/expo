LOCAL_PATH := $(call my-dir)

# We need to reference JSC functions but don't need to explicitly build and
# package libjsc.so ourselves because React Native already does so. So we
# just stub out the JSC dependency and allow undefined symbols (they
# will resolve at runtime).


# JSC dependency stub

include $(CLEAR_VARS)
LOCAL_MODULE := libjsc
LOCAL_EXPORT_C_INCLUDES := $(JSC_DIR)
include $(BUILD_SHARED_LIBRARY)


# expo-gl module

include $(CLEAR_VARS)
LOCAL_MODULE := expo-gl

LOCAL_C_INCLUDES += ../../../../cpp/
LOCAL_SRC_FILES := \
  ../../../../cpp/UEXGL.cpp \
  ../../../../cpp/EXJSUtils.c \
  ../../../../cpp/EXJSConvertTypedArray.c \
  EXGL.cpp

# weird hack that lets us mix C++ with -std=c++11 and C with -std=c99
LOCAL_C99_FILES := $(filter %.c, $(LOCAL_SRC_FILES))
TARGET-process-src-files-tags += $(call add-src-files-target-cflags, $(LOCAL_C99_FILES), -std=c99)

LOCAL_ALLOW_UNDEFINED_SYMBOLS := true
LOCAL_SHARED_LIBRARIES := libjsc

include $(BUILD_SHARED_LIBRARY)

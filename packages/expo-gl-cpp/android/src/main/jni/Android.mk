# expo-gl module

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)
LOCAL_MODULE := expo-gl

LOCAL_C_INCLUDES += ../../../../cpp/
LOCAL_SRC_FILES := \
  ../../../../cpp/UEXGL.cpp \
  ../../../../cpp/EXGLImageUtils.cpp \
  ../../../../cpp/EXGLContext.cpp \
  ../../../../cpp/EXGLNativeMethods.cpp \
  EXGL.cpp

LOCAL_CFLAGS := -fexceptions -frtti -O3
LOCAL_STATIC_LIBRARIES := libjsi
LOCAL_SHARED_LIBRARIES := libfolly_json glog

include $(BUILD_SHARED_LIBRARY)

$(call import-module,jsi)
$(call import-module,glog)
$(call import-module,folly)

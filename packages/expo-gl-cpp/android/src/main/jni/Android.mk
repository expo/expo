# expo-gl module

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)
LOCAL_MODULE := expo-gl

LOCAL_C_INCLUDES += ../../../../cpp/
LOCAL_SRC_FILES := \
  ../../../../cpp/UEXGL.cpp \
  ../../../../cpp/EXJSUtils.cpp \
  ../../../../cpp/EXGLContext.cpp \
  ../../../../cpp/EXGLInstallMethods.cpp \
  ../../../../cpp/EXGLInstallConstants.cpp \
  ../../../../cpp/EXGLNativeMethods.cpp \
  ../../../../cpp/TypedArrayJSC.cpp \
  EXGL.cpp
  # ../../../../cpp/TypedArrayJSCHack.cpp

# weird hack that lets us mix C++ with -std=c++11 and C with -std=c99
#LOCAL_C99_FILES := $(filter %.c, $(LOCAL_SRC_FILES))
#TARGET-process-src-files-tags += $(call add-src-files-target-cflags, $(LOCAL_C99_FILES), -std=c99)

# LOCAL_ALLOW_UNDEFINED_SYMBOLS := true
LOCAL_STATIC_LIBRARIES := libjsi
LOCAL_SHARED_LIBRARIES := libjsc libfolly_json glog

include $(BUILD_SHARED_LIBRARY)

$(call import-module,jsc)
$(call import-module,jsi)
$(call import-module,glog)
$(call import-module,folly)

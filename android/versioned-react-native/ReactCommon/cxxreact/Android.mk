LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := libreactnativefb

LOCAL_SRC_FILES := \
  CxxNativeModule.cpp \
  Executor.cpp \
  Instance.cpp \
  JSCExecutor.cpp \
  JSCHelpers.cpp \
  JSCLegacyProfiler.cpp \
  JSCLegacyTracing.cpp \
  JSCMemory.cpp \
  JSCPerfStats.cpp \
  JSCTracing.cpp \
  JSCWebWorker.cpp \
  MethodCall.cpp \
  ModuleRegistry.cpp \
  NativeToJsBridge.cpp \
  Value.cpp \
  Platform.cpp \
  Unicode.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)/..
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"

LOCAL_CFLAGS += -Wall -Werror -fexceptions -frtti
LOCAL_CFLAGS += $(CXX11_FLAGS)
CXX11_FLAGS := -std=c++11
LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS)

LOCAL_SHARED_LIBRARIES := libfb_abi11_0_0 libfolly_json_abi11_0_0 libjsc libglog_abi11_0_0

include $(BUILD_STATIC_LIBRARY)
$(call import-module,fb)

$(call import-module,folly)
$(call import-module,jsc)
$(call import-module,glog)


LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := libreactnativefb

LOCAL_SRC_FILES := \
  CxxNativeModule.cpp \
  JSCExecutor.cpp \
  Instance.cpp \
  JSBigString.cpp \
  JSBundleType.cpp \
  JSCLegacyProfiler.cpp \
  JSCLegacyTracing.cpp \
  JSCMemory.cpp \
  JSCNativeModules.cpp \
  JSCPerfStats.cpp \
  JSCTracing.cpp \
  JSIndexedRAMBundle.cpp \
  MethodCall.cpp \
  ModuleRegistry.cpp \
  NativeToJsBridge.cpp \
  Platform.cpp \
	JSCUtils.cpp \

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)
LOCAL_C_INCLUDES := $(LOCAL_PATH)/..

  -DLOG_TAG=\"ReactNative\"
LOCAL_CFLAGS := \

LOCAL_CFLAGS += -Wall -Werror -fexceptions -frtti
CXX11_FLAGS := -std=c++11
LOCAL_CFLAGS += $(CXX11_FLAGS)

LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS)
LOCAL_STATIC_LIBRARIES := jschelpers_abi18_0_0
LOCAL_SHARED_LIBRARIES := libfb_abi18_0_0 libfolly_json_abi18_0_0 libjsc libglog_abi18_0_0

include $(BUILD_STATIC_LIBRARY)

$(call import-module,fb)
$(call import-module,folly)
$(call import-module,jsc)
$(call import-module,glog)
$(call import-module,jschelpers)


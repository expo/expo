THIS_DIR := $(call my-dir)

include $(REACT_ANDROID_DIR)/Android-prebuilt.mk

include ${GENERATED_SRC_DIR}/codegen/jni/Android.mk

include $(CLEAR_VARS)

LOCAL_PATH := $(THIS_DIR)

# Define the library name here.
LOCAL_MODULE := ${CODEGEN_MODULE_NAME}_registration

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_SHARED_LIBRARIES := \
  libfabricjni \
  libfbjni \
  libglog \
  libjsi \
  libreact_codegen_rncore \
  libreact_codegen_${CODEGEN_MODULE_NAME} \
  libreact_debug \
  libreact_nativemodule_core \
  libreact_render_componentregistry \
  libreact_render_core \
  libreact_render_debug \
  libreact_render_graphics \
  librrc_view \
  libruntimeexecutor \
  libturbomodulejsijni \
  libyoga

ifneq ($(filter $(call modules-get-list),folly_runtime),)
  LOCAL_SHARED_LIBRARIES += libfolly_runtime # since react-native@0.69
else
  LOCAL_SHARED_LIBRARIES += libfolly_futures libfolly_json # react-native@0.68
endif

LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\" \
  -DCODEGEN_COMPONENT_DESCRIPTOR_H="<react/renderer/components/${CODEGEN_MODULE_NAME}/ComponentDescriptors.h>"
LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

include $(BUILD_SHARED_LIBRARY)
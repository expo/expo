# expo-av module

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)
LOCAL_MODULE := expo-gl

LOCAL_C_INCLUDES += ../cpp/
LOCAL_SRC_FILES := \
  ../cpp/EXAV.cpp \
  ../cpp/JAVManager.cpp \
  ../cpp/JPlayerData.cpp

LOCAL_CFLAGS := -fexceptions -frtti -Wall -Wextra -Wno-unused-parameter -Wshorten-64-to-32 -Wstrict-prototypes

LOCAL_STATIC_LIBRARIES := libjsi
LOCAL_SHARED_LIBRARIES := libfolly_json glog

include $(BUILD_SHARED_LIBRARY)

$(call import-module,jsi)
$(call import-module,glog)
$(call import-module,folly)

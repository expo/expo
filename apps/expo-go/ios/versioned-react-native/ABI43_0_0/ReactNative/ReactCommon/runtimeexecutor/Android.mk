# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := runtimeexecutor

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/ReactCommon/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)/ReactCommon
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS += -fexceptions -frtti -std=c++14 -Wall

include $(BUILD_STATIC_LIBRARY)

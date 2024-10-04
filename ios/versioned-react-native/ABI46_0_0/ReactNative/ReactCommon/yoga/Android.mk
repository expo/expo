# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := yogacore

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/yoga/*.cpp)
LOCAL_SRC_FILES += $(wildcard $(LOCAL_PATH)/yoga/*/*.cpp)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := -fexceptions -frtti -O3

include $(BUILD_STATIC_LIBRARY)

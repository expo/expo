APP_BUILD_SCRIPT := Android.mk

APP_ABI := armeabi-v7a x86 arm64-v8a x86_64
APP_PLATFORM := android-18

APP_MK_DIR := $(dir $(lastword $(MAKEFILE_LIST)))

NDK_MODULE_PATH := $(THIRD_PARTY_NDK_DIR)

APP_STL := c++_shared
APP_CPPFLAGS := -std=c++1z -fexceptions -pthread
# Make sure every shared lib includes a .note.gnu.build-id header
APP_LDFLAGS := -Wl,--build-id
APP_LDFLAGS += -llog
APP_LDFLAGS += -lGLESv3
APP_LDFLAGS += -pthread

NDK_TOOLCHAIN_VERSION := clang

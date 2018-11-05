APP_BUILD_SCRIPT := Android.mk

APP_ABI := armeabi-v7a x86
APP_PLATFORM := android-18

APP_MK_DIR := $(dir $(lastword $(MAKEFILE_LIST)))

NDK_MODULE_PATH := .$(HOST_DIRSEP)$(JSC_DIR)

APP_STL := gnustl_shared
APP_CPPFLAGS := -std=c++11 -fexceptions -pthread

# Make sure every shared lib includes a .note.gnu.build-id header
APP_LDFLAGS := -Wl,--build-id
APP_LDFLAGS += -llog
APP_LDFLAGS += -lGLESv3
APP_LDFLAGS += -pthread

NDK_TOOLCHAIN_VERSION := 4.8

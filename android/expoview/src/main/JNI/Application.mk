# [expo] We don't want the CI to build only for x86
# because we build release versions of expoview on CI.
APP_ABI := armeabi-v7a x86 arm64-v8a x86_64

APP_BUILD_SCRIPT := Android.mk
APP_PLATFORM := android-18

APP_MK_DIR := $(dir $(lastword $(MAKEFILE_LIST)))

NDK_MODULE_PATH := $(THIRD_PARTY_NDK_DIR)$(HOST_DIRSEP)$(REACT_NATIVE_JNI)$(HOST_DIRSEP)$(APP_MK_DIR)$(HOST_DIRSEP)$(JSI_PATH)$(HOST_DIRSEP)$(REACT_COMMON_DIR)$(HOST_DIRSEP)$(FIRST_PARTY)$(HOST_DIRSEP)$(REACT_NATIVE_REACT)

APP_STL := c++_shared

APP_CFLAGS := -Wall -Werror -fexceptions -frtti -DWITH_INSPECTOR=1
APP_CPPFLAGS := -std=c++1y
# Make sure every shared lib includes a .note.gnu.build-id header
APP_LDFLAGS := -Wl,--build-id

NDK_TOOLCHAIN_VERSION := clang

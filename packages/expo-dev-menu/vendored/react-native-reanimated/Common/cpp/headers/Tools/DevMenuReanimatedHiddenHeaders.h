#pragma once

#if defined(ONANDROID)
#include "DevMenuLogger.h"
#include "DevMenuLoggerInterface.h"
#include "DevMenuSpeedChecker.h"
#else
#include "vendored/react-native-reanimated/Common/cpp/hidden_headers/DevMenuLogger.h"
#include "vendored/react-native-reanimated/Common/cpp/hidden_headers/DevMenuLoggerInterface.h"
#include "vendored/react-native-reanimated/Common/cpp/hidden_headers/DevMenuSpeedChecker.h"
#endif

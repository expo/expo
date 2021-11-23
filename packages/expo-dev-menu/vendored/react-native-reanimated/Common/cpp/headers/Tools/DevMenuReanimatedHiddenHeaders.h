
#ifndef REANIMATEDEXAMPLE_REANIMATEDHIDDEN_H
#define REANIMATEDEXAMPLE_REANIMATEDHIDDEN_H

#if defined(ONANDROID)
    #include "Logger.h"
    #include "LoggerInterface.h"
    #include "SpeedChecker.h"
#else
    #include "vendored/react-native-reanimated/Common/cpp/hidden_headers/Logger.h"
    #include "vendored/react-native-reanimated/Common/cpp/hidden_headers/LoggerInterface.h"
    #include "vendored/react-native-reanimated/Common/cpp/hidden_headers/SpeedChecker.h"
#endif

#endif //REANIMATEDEXAMPLE_REANIMATEDHIDDEN_H

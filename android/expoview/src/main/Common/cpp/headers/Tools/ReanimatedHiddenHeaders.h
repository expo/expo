
#ifndef REANIMATEDEXAMPLE_REANIMATEDHIDDEN_H
#define REANIMATEDEXAMPLE_REANIMATEDHIDDEN_H

#if defined(ONANDROID)
    #include "Logger.h"
    #include "LoggerInterface.h"
    #include "SpeedChecker.h"
#else
    #include "Common/cpp/hidden_headers/Logger.h"
    #include "Common/cpp/hidden_headers/LoggerInterface.h"
    #include "Common/cpp/hidden_headers/SpeedChecker.h"
#endif

#endif //REANIMATEDEXAMPLE_REANIMATEDHIDDEN_H

/*
 * Copyright 2021 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_ERROR_REPORTER
#define SKSL_ERROR_REPORTER

#include "include/core/SkTypes.h"

#include <string_view>

namespace SkSL {

class Position;

/**
 * Class which is notified in the event of an error.
 */
class ErrorReporter {
public:
    ErrorReporter() {}

    virtual ~ErrorReporter() {}

    void error(Position position, std::string_view msg);

    std::string_view source() const { return fSource; }

    void setSource(std::string_view source) { fSource = source; }

    int errorCount() const {
        return fErrorCount;
    }

    void resetErrorCount() {
        fErrorCount = 0;
    }

protected:
    /**
     * Called when an error is reported.
     */
    virtual void handleError(std::string_view msg, Position position) = 0;

private:
    Position position(int offset) const;

    std::string_view fSource;
    int fErrorCount = 0;
};

/**
 * Error reporter for tests that need an SkSL context; aborts immediately if an error is reported.
 */
class TestingOnly_AbortErrorReporter : public ErrorReporter {
public:
    void handleError(std::string_view msg, Position pos) override;
};

} // namespace SkSL

#endif

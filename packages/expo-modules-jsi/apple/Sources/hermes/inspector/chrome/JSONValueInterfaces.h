/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <string>

#include <hermes/Parser/JSONParser.h>

namespace facebook {
namespace hermes {
namespace inspector_modern {
namespace chrome {
using namespace ::hermes::parser;

/// Convert a string to a JSONValue. Will return nullopt if parsing is not
/// successful.
std::optional<JSONValue *> parseStr(
    const std::string &str,
    JSONFactory &factory);

/// Convert a string to a JSON object. Will return nullopt if parsing is not
/// successful, or the resulting JSON value is not an object.
std::optional<JSONObject *> parseStrAsJsonObj(
    const std::string &str,
    JSONFactory &factory);

/// Convert a JSONValue to a string.
std::string jsonValToStr(const JSONValue *v);

/// Check if two JSONValues are equal.
bool jsonValsEQ(const JSONValue *A, const JSONValue *B);

}; // namespace chrome
}; // namespace inspector_modern
}; // namespace hermes
}; // namespace facebook

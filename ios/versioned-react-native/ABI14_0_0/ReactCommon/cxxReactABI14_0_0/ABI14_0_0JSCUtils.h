// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <ABI14_0_0jschelpers/ABI14_0_0Value.h>

#include "ABI14_0_0Executor.h"

namespace facebook {
namespace ReactABI14_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}

// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <ABI15_0_0jschelpers/ABI15_0_0Value.h>

#include "ABI15_0_0Executor.h"

namespace facebook {
namespace ReactABI15_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}

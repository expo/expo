/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include "ABI31_0_0YGFloatOptional.h"
#include <cstdlib>
#include <iostream>
#include "ABI31_0_0Yoga.h"
#include "ABI31_0_0Yoga-internal.h"

using namespace facebook;

ABI31_0_0YGFloatOptional::ABI31_0_0YGFloatOptional(float value) {
  if (yoga::isUndefined(value)) {
    isUndefined_ = true;
    value_ = 0;
  } else {
    value_ = value;
    isUndefined_ = false;
  }
}

float ABI31_0_0YGFloatOptional::getValue() const {
  if (isUndefined_) {
    // Abort, accessing a value of an undefined float optional
    std::cerr << "Tried to get value of an undefined ABI31_0_0YGFloatOptional\n";
    std::exit(EXIT_FAILURE);
  }
  return value_;
}

bool ABI31_0_0YGFloatOptional::operator==(const ABI31_0_0YGFloatOptional& op) const {
  if (isUndefined_ == op.isUndefined()) {
    return isUndefined_ || value_ == op.getValue();
  }
  return false;
}

bool ABI31_0_0YGFloatOptional::operator!=(const ABI31_0_0YGFloatOptional& op) const {
  return !(*this == op);
}

bool ABI31_0_0YGFloatOptional::operator==(float val) const {
  if (yoga::isUndefined(val) == isUndefined_) {
    return isUndefined_ || val == value_;
  }
  return false;
}

bool ABI31_0_0YGFloatOptional::operator!=(float val) const {
  return !(*this == val);
}

ABI31_0_0YGFloatOptional ABI31_0_0YGFloatOptional::operator+(const ABI31_0_0YGFloatOptional& op) {
  if (!isUndefined_ && !op.isUndefined_) {
    return ABI31_0_0YGFloatOptional(value_ + op.value_);
  }
  return ABI31_0_0YGFloatOptional();
}

bool ABI31_0_0YGFloatOptional::operator>(const ABI31_0_0YGFloatOptional& op) const {
  if (isUndefined_ || op.isUndefined_) {
    return false;
  }
  return value_ > op.value_;
}

bool ABI31_0_0YGFloatOptional::operator<(const ABI31_0_0YGFloatOptional& op) const {
  if (isUndefined_ || op.isUndefined_) {
    return false;
  }
  return value_ < op.value_;
}

bool ABI31_0_0YGFloatOptional::operator>=(const ABI31_0_0YGFloatOptional& op) const {
  return *this == op || *this > op;
}

bool ABI31_0_0YGFloatOptional::operator<=(const ABI31_0_0YGFloatOptional& op) const {
  return *this == op || *this < op;
}

// Copyright 2026-present 650 Industries. All rights reserved.

#include "RawPropsAccess.h"

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace {

/**
 Binds a pointer to a private member to the tag's `memberPointer` friend function. An explicit
 instantiation is the one place where C++ allows naming a private member ([temp.spec.general]),
 so this needs no change in React Native, and it fails to compile if React Native renames or
 retypes the member.
 */
template<typename Tag, typename Tag::MemberPointer member>
struct PrivateMember {
  friend typename Tag::MemberPointer memberPointer(Tag) {
    return member;
  }
};

struct RawPropsMode {
  using MemberPointer = react::RawProps::Mode react::RawProps::*;
  friend MemberPointer memberPointer(RawPropsMode);
};

struct RawPropsRuntime {
  using MemberPointer = jsi::Runtime *react::RawProps::*;
  friend MemberPointer memberPointer(RawPropsRuntime);
};

struct RawPropsValue {
  using MemberPointer = jsi::Value react::RawProps::*;
  friend MemberPointer memberPointer(RawPropsValue);
};

template struct PrivateMember<RawPropsMode, &react::RawProps::mode_>;
template struct PrivateMember<RawPropsRuntime, &react::RawProps::runtime_>;
template struct PrivateMember<RawPropsValue, &react::RawProps::value_>;

} // namespace

namespace expo::views {

std::optional<JSIRawProps> jsiRawProps(const react::RawProps &rawProps) {
  if (rawProps.*memberPointer(RawPropsMode{}) != react::RawProps::Mode::JSI) {
    return std::nullopt;
  }
  return JSIRawProps{
    .runtime = *(rawProps.*memberPointer(RawPropsRuntime{})),
    .value = rawProps.*memberPointer(RawPropsValue{}),
  };
}

} // namespace expo::views

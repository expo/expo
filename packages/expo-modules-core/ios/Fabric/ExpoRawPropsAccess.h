// Copyright 2025-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <jsi/jsi.h>
#include <react/renderer/core/RawProps.h>

// Accessors for `RawProps`'s private `runtime_` / `value_` / `mode_` members.
//
// React Native keeps these private and only befriends `RawPropsParser`. We need the
// whole-object `jsi::Value` (and its runtime) to decode Expo view props directly from
// the live JSI value on the JavaScript thread, without lowering to `folly::dynamic`
// and without forcing each prop name to be pre-registered with the parser.
//
// This uses the explicit template instantiation trick: explicit instantiation of a
// template is allowed to name otherwise-inaccessible members ([temp.explicit] in the
// C++ standard), so it lets us bind a pointer-to-member to a private member without
// modifying React Native. It is standard-conforming (NOT undefined behavior, unlike
// `#define private public` or hardcoded offsets), and if React Native ever renames or
// retypes these members it fails loudly at compile time rather than silently.
//
// Keep this hack isolated to this header.

namespace expo::rawPropsAccess {

// One tag per stolen member. The tag's `friend ptr(Tag)` returns the pointer-to-member; its
// body is supplied by explicitly instantiating `Steal` with the (otherwise private) member as
// a template argument — the one context where naming a private member is allowed. `MemberPtr`
// must be spelled out (not `auto`/`decltype`) so the friend has a concrete, callable type.
template<typename Tag, typename MemberPtr, MemberPtr Member>
struct Steal {
  friend MemberPtr ptr(Tag) { return Member; }
};

#define EXPO_STEAL_RAWPROPS_MEMBER(name, type)                                            \
  using name##Ptr = type facebook::react::RawProps::*;                                    \
  struct name##Tag {                                                                      \
    friend name##Ptr ptr(name##Tag);                                                      \
  };                                                                                      \
  template struct Steal<name##Tag, name##Ptr, &facebook::react::RawProps::name##_>;       \
  inline name##Ptr name##Member() { return ptr(name##Tag{}); }

EXPO_STEAL_RAWPROPS_MEMBER(value, facebook::jsi::Value)
EXPO_STEAL_RAWPROPS_MEMBER(runtime, facebook::jsi::Runtime *)
EXPO_STEAL_RAWPROPS_MEMBER(mode, facebook::react::RawProps::Mode)

#undef EXPO_STEAL_RAWPROPS_MEMBER

} // namespace expo::rawPropsAccess

namespace expo {

/**
 Returns `true` when the given `RawProps` is backed by a live `jsi::Value`
 (i.e. `Mode::JSI`). Only in that mode is the JSI value safe to read.
 */
inline bool rawPropsIsJSIBacked(const facebook::react::RawProps &rawProps)
{
  return rawProps.*(rawPropsAccess::modeMember()) == facebook::react::RawProps::Mode::JSI;
}

/**
 Returns the `jsi::Runtime` backing the given JSI-mode `RawProps`.
 Must only be called when `rawPropsIsJSIBacked()` is `true`.
 */
inline facebook::jsi::Runtime *rawPropsRuntime(const facebook::react::RawProps &rawProps)
{
  return rawProps.*(rawPropsAccess::runtimeMember());
}

/**
 Returns the whole props object as a `jsi::Value` for a JSI-mode `RawProps`.
 Must only be called when `rawPropsIsJSIBacked()` is `true`, on the JavaScript thread.
 */
inline const facebook::jsi::Value &rawPropsValue(const facebook::react::RawProps &rawProps)
{
  return rawProps.*(rawPropsAccess::valueMember());
}

} // namespace expo

#endif // __cplusplus

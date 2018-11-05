// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once
namespace facebook {
namespace ReactABI29_0_0 {
struct noncopyable {
  noncopyable(const noncopyable&) = delete;
  noncopyable& operator=(const noncopyable&) = delete;
 protected:
  noncopyable() = default;
};
}}

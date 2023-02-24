/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fcntl.h>
#include <sys/mman.h>

#include <ABI47_0_0cxxreact/ABI47_0_0JSBigString.h>
#include <folly/File.h>
#include <gtest/gtest.h>

using namespace ABI47_0_0facebook::ABI47_0_0React;

namespace {
int tempFileFromString(std::string contents) {
  const char *tmpDir = getenv("TMPDIR");
  if (tmpDir == nullptr)
    tmpDir = "/tmp";
  std::string tmp{tmpDir};
  tmp += "/temp.XXXXXX";

  std::vector<char> tmpBuf{tmp.begin(), tmp.end()};
  tmpBuf.push_back('\0');

  const int fd = mkstemp(tmpBuf.data());
  write(fd, contents.c_str(), contents.size() + 1);

  return fd;
}
}; // namespace

TEST(JSBigFileString, MapWholeFileTest) {
  std::string data{"Hello, world"};
  const auto size = data.length() + 1;

  // Initialise Big String
  int fd = tempFileFromString("Hello, world");
  JSBigFileString bigStr{fd, size};

  // Test
  ASSERT_STREQ(data.c_str(), bigStr.c_str());
}

TEST(JSBigFileString, MapPartTest) {
  std::string data{"Hello, world"};

  // Sub-string to actually map
  std::string needle{"or"};
  off_t offset = data.find(needle);

  // Initialise Big String
  int fd = tempFileFromString(data);
  JSBigFileString bigStr{fd, needle.size(), offset};

  // Test
  ABI47_0_0EXPECT_EQ(needle.length(), bigStr.size());
  for (unsigned int i = 0; i < needle.length(); ++i) {
    ABI47_0_0EXPECT_EQ(needle[i], bigStr.c_str()[i]);
  }
}

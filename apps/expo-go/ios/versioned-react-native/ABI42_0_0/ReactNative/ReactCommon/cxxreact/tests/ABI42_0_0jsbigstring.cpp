/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fcntl.h>
#include <sys/mman.h>

#include <ABI42_0_0cxxreact/ABI42_0_0JSBigString.h>
#include <folly/File.h>
#include <gtest/gtest.h>

using namespace ABI42_0_0facebook;
using namespace ABI42_0_0facebook::ABI42_0_0React;

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
  ABI42_0_0EXPECT_EQ(needle.length(), bigStr.size());
  for (unsigned int i = 0; i < needle.length(); ++i) {
    ABI42_0_0EXPECT_EQ(needle[i], bigStr.c_str()[i]);
  }
}

TEST(JSBigFileString, RemapTest) {
  static const uint8_t kRemapMagic[] = {
      0xc6, 0x1f, 0xbc, 0x03, 0xc1, 0x03, 0x19, 0x1f, 0xa1, 0xd0, 0xeb, 0x73};
  std::string data(std::begin(kRemapMagic), std::end(kRemapMagic));
  auto app = [&data](uint16_t v) {
    data.append(reinterpret_cast<char *>(&v), sizeof(v));
  };
  size_t pageSizeLog2 = 16;
  app(pageSizeLog2);
  size_t pageSize = 1 << pageSizeLog2;
  app(1); // header pages
  app(2); // num mappings
  // file page 0 -> memory page 1
  app(1); // memory page
  app(1); // num pages
  // file page 1 -> memory page 0
  app(0); // memory page
  app(1); // num pages
  while (data.size() < pageSize) {
    app(0);
  }
  while (data.size() < pageSize * 2) {
    app(0x1111);
  }
  while (data.size() < pageSize * 3) {
    app(0x2222);
  }

  int fd = tempFileFromString(data);
  JSBigFileString bigStr{fd, data.size()};

  ABI42_0_0EXPECT_EQ(pageSize * 2, bigStr.size());
  auto remapped = bigStr.c_str();
  size_t i = 0;
  for (; i < pageSize; ++i) {
    ABI42_0_0EXPECT_EQ(0x22, remapped[i]);
  }
  for (; i < pageSize * 2; ++i) {
    ABI42_0_0EXPECT_EQ(0x11, remapped[i]);
  }
}

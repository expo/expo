/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0MapBufferBuilder.h"
#include <algorithm>

using namespace ABI49_0_0facebook::ABI49_0_0React;

namespace ABI49_0_0facebook::ABI49_0_0React {

constexpr uint32_t INT_SIZE = sizeof(uint32_t);
constexpr uint32_t DOUBLE_SIZE = sizeof(double);
constexpr uint32_t MAX_BUCKET_VALUE_SIZE = sizeof(uint64_t);

MapBuffer MapBufferBuilder::EMPTY() {
  return MapBufferBuilder(0).build();
}

MapBufferBuilder::MapBufferBuilder(uint32_t initialSize) {
  buckets_.reserve(initialSize);
  header_.count = 0;
  header_.bufferSize = 0;
}

void MapBufferBuilder::storeKeyValue(
    MapBuffer::Key key,
    MapBuffer::DataType type,
    uint8_t const *value,
    uint32_t valueSize) {
  if (valueSize > MAX_BUCKET_VALUE_SIZE) {
    LOG(ERROR) << "Error: size of value must be <= MAX_VALUE_SIZE. ValueSize: "
               << valueSize;
    abort();
  }

  uint64_t data = 0;
  auto *dataPtr = reinterpret_cast<uint8_t *>(&data);
  memcpy(dataPtr, value, valueSize);

  buckets_.emplace_back(key, static_cast<uint16_t>(type), data);

  header_.count++;

  if (lastKey_ > key) {
    needsSort_ = true;
  }
  lastKey_ = key;
}

void MapBufferBuilder::putBool(MapBuffer::Key key, bool value) {
  int intValue = (int)value;
  storeKeyValue(
      key,
      MapBuffer::DataType::Boolean,
      reinterpret_cast<uint8_t const *>(&intValue),
      INT_SIZE);
}

void MapBufferBuilder::putDouble(MapBuffer::Key key, double value) {
  storeKeyValue(
      key,
      MapBuffer::DataType::Double,
      reinterpret_cast<uint8_t const *>(&value),
      DOUBLE_SIZE);
}

void MapBufferBuilder::putInt(MapBuffer::Key key, int32_t value) {
  storeKeyValue(
      key,
      MapBuffer::DataType::Int,
      reinterpret_cast<uint8_t const *>(&value),
      INT_SIZE);
}

void MapBufferBuilder::putString(MapBuffer::Key key, std::string const &value) {
  auto strSize = value.size();
  const char *strData = value.data();

  // format [length of string (int)] + [Array of Characters in the string]
  auto offset = dynamicData_.size();
  dynamicData_.resize(offset + INT_SIZE + strSize, 0);
  memcpy(dynamicData_.data() + offset, &strSize, INT_SIZE);
  memcpy(dynamicData_.data() + offset + INT_SIZE, strData, strSize);

  // Store Key and pointer to the string
  storeKeyValue(
      key,
      MapBuffer::DataType::String,
      reinterpret_cast<uint8_t const *>(&offset),
      INT_SIZE);
}

void MapBufferBuilder::putMapBuffer(MapBuffer::Key key, MapBuffer const &map) {
  auto mapBufferSize = map.size();

  auto offset = dynamicData_.size();

  // format [length of buffer (int)] + [bytes of MapBuffer]
  dynamicData_.resize(offset + INT_SIZE + mapBufferSize, 0);
  memcpy(dynamicData_.data() + offset, &mapBufferSize, INT_SIZE);
  // Copy the content of the map into dynamicData_
  memcpy(dynamicData_.data() + offset + INT_SIZE, map.data(), mapBufferSize);

  // Store Key and pointer to the string
  storeKeyValue(
      key,
      MapBuffer::DataType::Map,
      reinterpret_cast<uint8_t const *>(&offset),
      INT_SIZE);
}

void MapBufferBuilder::putMapBufferList(
    MapBuffer::Key key,
    const std::vector<MapBuffer> &mapBufferList) {
  int32_t offset = dynamicData_.size();
  int32_t dataSize = 0;
  for (const MapBuffer &mapBuffer : mapBufferList) {
    dataSize = dataSize + INT_SIZE + mapBuffer.size();
  }

  dynamicData_.resize(offset + INT_SIZE, 0);
  memcpy(dynamicData_.data() + offset, &dataSize, INT_SIZE);

  for (const MapBuffer &mapBuffer : mapBufferList) {
    int32_t mapBufferSize = mapBuffer.size();
    int32_t dynamicDataSize = dynamicData_.size();
    dynamicData_.resize(dynamicDataSize + INT_SIZE + mapBufferSize, 0);
    // format [length of buffer (int)] + [bytes of MapBuffer]
    memcpy(dynamicData_.data() + dynamicDataSize, &mapBufferSize, INT_SIZE);
    // Copy the content of the map into dynamicData_
    memcpy(
        dynamicData_.data() + dynamicDataSize + INT_SIZE,
        mapBuffer.data(),
        mapBufferSize);
  }

  // Store Key and pointer to the string
  storeKeyValue(
      key,
      MapBuffer::DataType::Map,
      reinterpret_cast<uint8_t const *>(&offset),
      INT_SIZE);
}

static inline bool compareBuckets(
    MapBuffer::Bucket const &a,
    MapBuffer::Bucket const &b) {
  return a.key < b.key;
}

MapBuffer MapBufferBuilder::build() {
  // Create buffer: [header] + [key, values] + [dynamic data]
  auto bucketSize = buckets_.size() * sizeof(MapBuffer::Bucket);
  auto headerSize = sizeof(MapBuffer::Header);
  auto bufferSize = headerSize + bucketSize + dynamicData_.size();

  header_.bufferSize = static_cast<uint32_t>(bufferSize);

  if (needsSort_) {
    std::sort(buckets_.begin(), buckets_.end(), compareBuckets);
  }

  // TODO(T83483191): add pass to check for duplicates

  std::vector<uint8_t> buffer(bufferSize);
  memcpy(buffer.data(), &header_, headerSize);
  memcpy(buffer.data() + headerSize, buckets_.data(), bucketSize);
  memcpy(
      buffer.data() + headerSize + bucketSize,
      dynamicData_.data(),
      dynamicData_.size());

  return MapBuffer(std::move(buffer));
}

} // namespace ABI49_0_0facebook::ABI49_0_0React

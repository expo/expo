/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <list>
#include <system_error>

#include <folly/io/IOBufQueue.h>
#include <folly/io/async/AsyncTransport.h>
#include <folly/io/async/DelayedDestruction.h>
#include <folly/io/async/EventHandler.h>

namespace folly {

class AsyncSocketException;

/**
 * Read from a pipe in an async manner.
 */
class AsyncPipeReader : public EventHandler,
                        public AsyncReader,
                        public DelayedDestruction {
 public:
  typedef std::
      unique_ptr<AsyncPipeReader, folly::DelayedDestruction::Destructor>
          UniquePtr;

  static UniquePtr newReader(
      folly::EventBase* eventBase,
      NetworkSocket pipeFd) {
    return UniquePtr(new AsyncPipeReader(eventBase, pipeFd));
  }

  AsyncPipeReader(folly::EventBase* eventBase, NetworkSocket pipeFd)
      : EventHandler(eventBase, pipeFd), fd_(pipeFd) {}

  /**
   * Set the read callback and automatically install/uninstall the handler
   * for events.
   */
  void setReadCB(AsyncReader::ReadCallback* callback) override {
    if (callback == readCallback_) {
      return;
    }
    readCallback_ = callback;
    if (readCallback_ && !isHandlerRegistered()) {
      registerHandler(EventHandler::READ | EventHandler::PERSIST);
    } else if (!readCallback_ && isHandlerRegistered()) {
      unregisterHandler();
    }
  }

  /**
   * Get the read callback
   */
  AsyncReader::ReadCallback* getReadCallback() const override {
    return readCallback_;
  }

  /**
   * Set a special hook to close the socket (otherwise, will call close())
   */
  void setCloseCallback(std::function<void(NetworkSocket)> closeCb) {
    closeCb_ = closeCb;
  }

 private:
  ~AsyncPipeReader() override;

  void handlerReady(uint16_t events) noexcept override;
  void failRead(const AsyncSocketException& ex);
  void close();

  NetworkSocket fd_;
  AsyncReader::ReadCallback* readCallback_{nullptr};
  std::function<void(NetworkSocket)> closeCb_;
};

/**
 * Write to a pipe in an async manner.
 */
class AsyncPipeWriter : public EventHandler,
                        public AsyncWriter,
                        public DelayedDestruction {
 public:
  typedef std::
      unique_ptr<AsyncPipeWriter, folly::DelayedDestruction::Destructor>
          UniquePtr;

  static UniquePtr newWriter(
      folly::EventBase* eventBase,
      NetworkSocket pipeFd) {
    return UniquePtr(new AsyncPipeWriter(eventBase, pipeFd));
  }

  AsyncPipeWriter(folly::EventBase* eventBase, NetworkSocket pipeFd)
      : EventHandler(eventBase, pipeFd), fd_(pipeFd) {}

  /**
   * Asynchronously write the given iobuf to this pipe, and invoke the callback
   * on success/error.
   */
  void write(
      std::unique_ptr<folly::IOBuf> buf,
      AsyncWriter::WriteCallback* callback = nullptr);

  /**
   * Set a special hook to close the socket (otherwise, will call close())
   */
  void setCloseCallback(std::function<void(NetworkSocket)> closeCb) {
    closeCb_ = closeCb;
  }

  /**
   * Returns true if the pipe is closed
   */
  bool closed() const {
    return (fd_ == NetworkSocket() || closeOnEmpty_);
  }

  /**
   * Notify the pipe to close as soon as all pending writes complete
   */
  void closeOnEmpty();

  /**
   * Close the pipe immediately, and fail all pending writes
   */
  void closeNow();

  /**
   * Return true if there are currently writes pending (eg: the pipe is blocked
   * for writing)
   */
  bool hasPendingWrites() const {
    return !queue_.empty();
  }

  // AsyncWriter methods
  void write(
      folly::AsyncWriter::WriteCallback* callback,
      const void* buf,
      size_t bytes,
      WriteFlags flags = WriteFlags::NONE) override {
    writeChain(callback, IOBuf::wrapBuffer(buf, bytes), flags);
  }
  void writev(
      folly::AsyncWriter::WriteCallback*,
      const iovec*,
      size_t,
      WriteFlags = WriteFlags::NONE) override {
    throw std::runtime_error("writev is not supported. Please use writeChain.");
  }
  void writeChain(
      folly::AsyncWriter::WriteCallback* callback,
      std::unique_ptr<folly::IOBuf>&& buf,
      WriteFlags flags = WriteFlags::NONE) override;

 private:
  void handlerReady(uint16_t events) noexcept override;
  void handleWrite();
  void failAllWrites(const AsyncSocketException& ex);

  NetworkSocket fd_;
  std::list<std::pair<folly::IOBufQueue, AsyncWriter::WriteCallback*>> queue_;
  bool closeOnEmpty_{false};
  std::function<void(NetworkSocket)> closeCb_;

  ~AsyncPipeWriter() override {
    closeNow();
  }
};

} // namespace folly

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

#include <memory>

#include <folly/ScopeGuard.h>
#include <folly/SocketAddress.h>
#include <folly/io/IOBuf.h>
#include <folly/io/SocketOptionMap.h>
#include <folly/io/async/AsyncSocketBase.h>
#include <folly/io/async/AsyncSocketException.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/EventHandler.h>
#include <folly/net/NetOps.h>
#include <folly/net/NetworkSocket.h>

namespace folly {

/**
 * UDP socket
 */
class AsyncUDPSocket : public EventHandler {
 public:
  enum class FDOwnership { OWNS, SHARED };

  class ReadCallback {
   public:
    struct OnDataAvailableParams {
      int gro_ = -1;
    };
    /**
     * Invoked when the socket becomes readable and we want buffer
     * to write to.
     *
     * NOTE: From socket we will end up reading at most `len` bytes
     *       and if there were more bytes in datagram, we will end up
     *       dropping them.
     */
    virtual void getReadBuffer(void** buf, size_t* len) noexcept = 0;

    /**
     * Invoked when a new datagram is available on the socket. `len`
     * is the number of bytes read and `truncated` is true if we had
     * to drop few bytes because of running out of buffer space.
     *  OnDataAvailableParams::gro is the GRO segment size
     */
    virtual void onDataAvailable(
        const folly::SocketAddress& client,
        size_t len,
        bool truncated,
        OnDataAvailableParams params) noexcept = 0;

    /**
     * Notifies when data is available. This is only invoked when
     * shouldNotifyOnly() returns true.
     */
    virtual void onNotifyDataAvailable(AsyncUDPSocket&) noexcept {}

    /**
     * Returns whether or not the read callback should only notify
     * but not call getReadBuffer.
     * If shouldNotifyOnly() returns true, AsyncUDPSocket will invoke
     * onNotifyDataAvailable() instead of getReadBuffer().
     * If shouldNotifyOnly() returns false, AsyncUDPSocket will invoke
     * getReadBuffer() and onDataAvailable().
     */
    virtual bool shouldOnlyNotify() {
      return false;
    }

    /**
     * Invoked when there is an error reading from the socket.
     *
     * NOTE: Since UDP is connectionless, you can still read from the socket.
     *       But you have to re-register readCallback yourself after
     *       onReadError.
     */
    virtual void onReadError(const AsyncSocketException& ex) noexcept = 0;

    /**
     * Invoked when socket is closed and a read callback is registered.
     */
    virtual void onReadClosed() noexcept = 0;

    virtual ~ReadCallback() = default;
  };

  class ErrMessageCallback {
   public:
    virtual ~ErrMessageCallback() = default;

    /**
     * errMessage() will be invoked when kernel puts a message to
     * the error queue associated with the socket.
     *
     * @param cmsg      Reference to cmsghdr structure describing
     *                  a message read from error queue associated
     *                  with the socket.
     */
    virtual void errMessage(const cmsghdr& cmsg) noexcept = 0;

    /**
     * errMessageError() will be invoked if an error occurs reading a message
     * from the socket error stream.
     *
     * @param ex        An exception describing the error that occurred.
     */
    virtual void errMessageError(const AsyncSocketException& ex) noexcept = 0;
  };

  /**
   * Create a new UDP socket that will run in the
   * given eventbase
   */
  explicit AsyncUDPSocket(EventBase* evb);
  ~AsyncUDPSocket() override;

  /**
   * Returns the address server is listening on
   */
  virtual const folly::SocketAddress& address() const {
    CHECK_NE(NetworkSocket(), fd_) << "Server not yet bound to an address";
    return localAddress_;
  }

  /**
   * Bind the socket to the following address. If port is not
   * set in the `address` an ephemeral port is chosen and you can
   * use `address()` method above to get it after this method successfully
   * returns.
   */
  virtual void bind(const folly::SocketAddress& address);

  /**
   * Use an already bound file descriptor. You can either transfer ownership
   * of this FD by using ownership = FDOwnership::OWNS or share it using
   * FDOwnership::SHARED. In case FD is shared, it will not be `close`d in
   * destructor.
   */
  virtual void setFD(NetworkSocket fd, FDOwnership ownership);

  /**
   * Send the data in buffer to destination. Returns the return code from
   * ::sendmsg.
   */
  virtual ssize_t write(
      const folly::SocketAddress& address,
      const std::unique_ptr<folly::IOBuf>& buf);

  /**
   * Send the data in buffers to destination. Returns the return code from
   * ::sendmmsg.
   * bufs is an array of std::unique_ptr<folly::IOBuf>
   * of size num
   */
  virtual int writem(
      const folly::SocketAddress& address,
      const std::unique_ptr<folly::IOBuf>* bufs,
      size_t count);

  /**
   * Send the data in buffer to destination. Returns the return code from
   * ::sendmsg.
   *  gso is the generic segmentation offload value
   *  writeGSO will return -1 if
   *  buf->computeChainDataLength() <= gso
   *  Before calling writeGSO with a positive value
   *  verify GSO is supported on this platform by calling getGSO
   */
  virtual ssize_t writeGSO(
      const folly::SocketAddress& address,
      const std::unique_ptr<folly::IOBuf>& buf,
      int gso);

  /**
   * Send the data in buffers to destination. Returns the return code from
   * ::sendmmsg.
   * bufs is an array of std::unique_ptr<folly::IOBuf>
   * of size num
   * gso is an array with the generic segmentation offload values or nullptr
   *  Before calling writeGSO with a positive value
   *  verify GSO is supported on this platform by calling getGSO
   */
  virtual int writemGSO(
      const folly::SocketAddress& address,
      const std::unique_ptr<folly::IOBuf>* bufs,
      size_t count,
      const int* gso);

  /**
   * Send data in iovec to destination. Returns the return code from sendmsg.
   */
  virtual ssize_t writev(
      const folly::SocketAddress& address,
      const struct iovec* vec,
      size_t iovec_len,
      int gso);

  virtual ssize_t writev(
      const folly::SocketAddress& address,
      const struct iovec* vec,
      size_t iovec_len);

  virtual ssize_t recvmsg(struct msghdr* msg, int flags);

  virtual int recvmmsg(
      struct mmsghdr* msgvec,
      unsigned int vlen,
      unsigned int flags,
      struct timespec* timeout);

  /**
   * Start reading datagrams
   */
  virtual void resumeRead(ReadCallback* cob);

  /**
   * Pause reading datagrams
   */
  virtual void pauseRead();

  /**
   * Stop listening on the socket.
   */
  virtual void close();

  /**
   * Get internal FD used by this socket
   */
  virtual NetworkSocket getNetworkSocket() const {
    CHECK_NE(NetworkSocket(), fd_) << "Need to bind before getting FD out";
    return fd_;
  }

  /**
   * Set reuse port mode to call bind() on the same address multiple times
   */
  virtual void setReusePort(bool reusePort) {
    reusePort_ = reusePort;
  }

  /**
   * Set SO_REUSEADDR flag on the socket. Default is OFF.
   */
  virtual void setReuseAddr(bool reuseAddr) {
    reuseAddr_ = reuseAddr;
  }

  /**
   * Set SO_RCVBUF option on the socket, if not zero. Default is zero.
   */
  virtual void setRcvBuf(int rcvBuf) {
    rcvBuf_ = rcvBuf;
  }

  /**
   * Set SO_SNDBUG option on the socket, if not zero. Default is zero.
   */
  virtual void setSndBuf(int sndBuf) {
    sndBuf_ = sndBuf;
  }

  /**
   * Set SO_BUSY_POLL option on the socket, if not zero. Default is zero.
   * Caution! The feature is not available on Apple's systems.
   */
  virtual void setBusyPoll(int busyPollUs) {
    busyPollUs_ = busyPollUs;
  }

  EventBase* getEventBase() const {
    return eventBase_;
  }

  /**
   * Enable or disable fragmentation on the socket.
   *
   * On Linux, this sets IP(V6)_MTU_DISCOVER to IP(V6)_PMTUDISC_DO when enabled,
   * and to IP(V6)_PMTUDISC_WANT when disabled. IP(V6)_PMTUDISC_WANT will use
   * per-route setting to set DF bit. It may be more desirable to use
   * IP(V6)_PMTUDISC_PROBE as opposed to IP(V6)_PMTUDISC_DO for apps that has
   * its own PMTU Discovery mechanism.
   * Note this doesn't work on Apple.
   */
  virtual void dontFragment(bool df);

  /**
   * Set Dont-Fragment (DF) but ignore Path MTU.
   *
   * On Linux, this sets  IP(V6)_MTU_DISCOVER to IP(V6)_PMTUDISC_PROBE.
   * This essentially sets DF but ignores Path MTU for this socket.
   * This may be desirable for apps that has its own PMTU Discovery mechanism.
   * See http://man7.org/linux/man-pages/man7/ip.7.html for more info.
   */
  virtual void setDFAndTurnOffPMTU();

  /**
   * Callback for receiving errors on the UDP sockets
   */
  virtual void setErrMessageCallback(ErrMessageCallback* errMessageCallback);

  /**
   * Connects the UDP socket to a remote destination address provided in
   * address. This can speed up UDP writes on linux because it will cache flow
   * state on connects.
   * Using connect has many quirks, and you should be aware of them before using
   * this API:
   * 1. This must only be called after binding the socket.
   * 2. Normally UDP can use the 2 tuple (src ip, src port) to steer packets
   * sent by the peer to the socket, however after connecting the socket, only
   * packets destined to the destination address specified in connect() will be
   * forwarded and others will be dropped. If the server can send a packet
   * from a different destination port / IP then you probably do not want to use
   * this API.
   * 3. It can be called repeatedly on either the client or server however it's
   * normally only useful on the client and not server.
   *
   * Returns the result of calling the connect syscall.
   */
  virtual int connect(const folly::SocketAddress& address);

  virtual bool isBound() const {
    return fd_ != NetworkSocket();
  }

  virtual bool isReading() const {
    return readCallback_ != nullptr;
  }

  virtual void detachEventBase();

  virtual void attachEventBase(folly::EventBase* evb);

  // generic segmentation offload get/set
  // negative return value means GSO is not available
  int getGSO();

  bool setGSO(int val);

  // generic receive offload get/set
  // negative return value means GRO is not available
  int getGRO();

  bool setGRO(bool bVal);

  void setTrafficClass(int tclass);

  void applyOptions(
      const SocketOptionMap& options,
      SocketOptionKey::ApplyPos pos);

 protected:
  virtual ssize_t
  sendmsg(NetworkSocket socket, const struct msghdr* message, int flags) {
    return netops::sendmsg(socket, message, flags);
  }

  virtual int sendmmsg(
      NetworkSocket socket,
      struct mmsghdr* msgvec,
      unsigned int vlen,
      int flags) {
    return netops::sendmmsg(socket, msgvec, vlen, flags);
  }

  void fillMsgVec(
      sockaddr_storage* addr,
      socklen_t addr_len,
      const std::unique_ptr<folly::IOBuf>* bufs,
      size_t count,
      struct mmsghdr* msgvec,
      struct iovec* iov,
      size_t iov_count,
      const int* gso,
      char* gsoControl);

  virtual int writeImpl(
      const folly::SocketAddress& address,
      const std::unique_ptr<folly::IOBuf>* bufs,
      size_t count,
      struct mmsghdr* msgvec,
      const int* gso,
      char* gsoControl);

  size_t handleErrMessages() noexcept;

  void failErrMessageRead(const AsyncSocketException& ex);

  // Non-null only when we are reading
  ReadCallback* readCallback_;

 private:
  AsyncUDPSocket(const AsyncUDPSocket&) = delete;
  AsyncUDPSocket& operator=(const AsyncUDPSocket&) = delete;

  // EventHandler
  void handlerReady(uint16_t events) noexcept override;

  void handleRead() noexcept;
  bool updateRegistration() noexcept;

  EventBase* eventBase_;
  folly::SocketAddress localAddress_;

  NetworkSocket fd_;
  FDOwnership ownership_;

  // Temp space to receive client address
  folly::SocketAddress clientAddress_;

  // If the socket is connected.
  folly::SocketAddress connectedAddress_;
  bool connected_{false};

  bool reuseAddr_{false};
  bool reusePort_{false};
  int rcvBuf_{0};
  int sndBuf_{0};
  int busyPollUs_{0};

  // generic segmentation offload value, if available
  // See https://lwn.net/Articles/188489/ for more details
  folly::Optional<int> gso_;

  // generic receive offload value, if available
  // See https://lwn.net/Articles/770978/ for more details
  folly::Optional<int> gro_;

  ErrMessageCallback* errMessageCallback_{nullptr};
};

} // namespace folly

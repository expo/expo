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

#include <folly/portability/Sockets.h>

#ifdef _MSC_VER

#include <errno.h>
#include <fcntl.h>

#include <MSWSock.h> // @manual

#include <folly/ScopeGuard.h>
#include <folly/net/NetworkSocket.h>
#include <folly/net/detail/SocketFileDescriptorMap.h>

namespace folly {
namespace portability {
namespace sockets {

namespace {
int network_socket_to_fd(NetworkSocket sock) {
  return socket_to_fd(sock.data);
}

NetworkSocket fd_to_network_socket(int fd) {
  return NetworkSocket(fd_to_socket(fd));
}
} // namespace

bool is_fh_socket(int fh) {
  SOCKET h = fd_to_socket(fh);
  constexpr long kDummyEvents = 0xABCDEF12;
  WSANETWORKEVENTS e;
  e.lNetworkEvents = kDummyEvents;
  WSAEnumNetworkEvents(h, nullptr, &e);
  return e.lNetworkEvents != kDummyEvents;
}

SOCKET fd_to_socket(int fd) {
  return netops::detail::SocketFileDescriptorMap::fdToSocket(fd);
}

int socket_to_fd(SOCKET s) {
  return netops::detail::SocketFileDescriptorMap::socketToFd(s);
}

template <class R, class F, class... Args>
static R wrapSocketFunction(F f, int s, Args... args) {
  NetworkSocket h = fd_to_network_socket(s);
  return f(h, args...);
}

int accept(int s, struct sockaddr* addr, socklen_t* addrlen) {
  return network_socket_to_fd(
      wrapSocketFunction<NetworkSocket>(netops::accept, s, addr, addrlen));
}

int bind(int s, const struct sockaddr* name, socklen_t namelen) {
  return wrapSocketFunction<int>(netops::bind, s, name, namelen);
}

int connect(int s, const struct sockaddr* name, socklen_t namelen) {
  return wrapSocketFunction<int>(netops::connect, s, name, namelen);
}

int getpeername(int s, struct sockaddr* name, socklen_t* namelen) {
  return wrapSocketFunction<int>(netops::getpeername, s, name, namelen);
}

int getsockname(int s, struct sockaddr* name, socklen_t* namelen) {
  return wrapSocketFunction<int>(netops::getsockname, s, name, namelen);
}

int getsockopt(int s, int level, int optname, char* optval, socklen_t* optlen) {
  return getsockopt(s, level, optname, (void*)optval, optlen);
}

int getsockopt(int s, int level, int optname, void* optval, socklen_t* optlen) {
  return wrapSocketFunction<int>(
      netops::getsockopt, s, level, optname, optval, optlen);
}

int inet_aton(const char* cp, struct in_addr* inp) {
  return netops::inet_aton(cp, inp);
}

const char* inet_ntop(int af, const void* src, char* dst, socklen_t size) {
  return ::inet_ntop(af, (char*)src, dst, size_t(size));
}

int listen(int s, int backlog) {
  return wrapSocketFunction<int>(netops::listen, s, backlog);
}

int poll(struct pollfd fds[], nfds_t nfds, int timeout) {
  // NetOps already has the checks to ensure this is safe.
  netops::PollDescriptor* desc =
      reinterpret_cast<netops::PollDescriptor*>(reinterpret_cast<void*>(fds));
  for (nfds_t i = 0; i < nfds; ++i) {
    desc[i].fd = fd_to_network_socket((int)desc[i].fd.data);
  }
  return netops::poll(desc, nfds, timeout);
}

ssize_t recv(int s, void* buf, size_t len, int flags) {
  return wrapSocketFunction<ssize_t>(netops::recv, s, buf, len, flags);
}

ssize_t recv(int s, char* buf, int len, int flags) {
  return recv(s, (void*)buf, (size_t)len, flags);
}

ssize_t recv(int s, void* buf, int len, int flags) {
  return recv(s, (void*)buf, (size_t)len, flags);
}

ssize_t recvfrom(
    int s,
    void* buf,
    size_t len,
    int flags,
    struct sockaddr* from,
    socklen_t* fromlen) {
  return wrapSocketFunction<ssize_t>(
      netops::recvfrom, s, buf, len, flags, from, fromlen);
}

ssize_t recvfrom(
    int s,
    char* buf,
    int len,
    int flags,
    struct sockaddr* from,
    socklen_t* fromlen) {
  return recvfrom(s, (void*)buf, (size_t)len, flags, from, fromlen);
}

ssize_t recvfrom(
    int s,
    void* buf,
    int len,
    int flags,
    struct sockaddr* from,
    socklen_t* fromlen) {
  return recvfrom(s, (void*)buf, (size_t)len, flags, from, fromlen);
}

ssize_t recvmsg(int s, struct msghdr* message, int flags) {
  return wrapSocketFunction<ssize_t>(netops::recvmsg, s, message, flags);
}

ssize_t send(int s, const void* buf, size_t len, int flags) {
  return wrapSocketFunction<ssize_t>(netops::send, s, buf, len, flags);
}

ssize_t send(int s, const char* buf, int len, int flags) {
  return send(s, (const void*)buf, (size_t)len, flags);
}

ssize_t send(int s, const void* buf, int len, int flags) {
  return send(s, (const void*)buf, (size_t)len, flags);
}

ssize_t sendmsg(int s, const struct msghdr* message, int flags) {
  return wrapSocketFunction<ssize_t>(netops::sendmsg, s, message, flags);
}

ssize_t sendto(
    int s,
    const void* buf,
    size_t len,
    int flags,
    const sockaddr* to,
    socklen_t tolen) {
  return wrapSocketFunction<ssize_t>(
      netops::sendto, s, buf, len, flags, to, tolen);
}

ssize_t sendto(
    int s,
    const char* buf,
    int len,
    int flags,
    const sockaddr* to,
    socklen_t tolen) {
  return sendto(s, (const void*)buf, (size_t)len, flags, to, tolen);
}

ssize_t sendto(
    int s,
    const void* buf,
    int len,
    int flags,
    const sockaddr* to,
    socklen_t tolen) {
  return sendto(s, buf, (size_t)len, flags, to, tolen);
}

int setsockopt(
    int s,
    int level,
    int optname,
    const void* optval,
    socklen_t optlen) {
  return wrapSocketFunction<int>(
      netops::setsockopt, s, level, optname, optval, optlen);
}

int setsockopt(
    int s,
    int level,
    int optname,
    const char* optval,
    socklen_t optlen) {
  return setsockopt(s, level, optname, (const void*)optval, optlen);
}

int shutdown(int s, int how) {
  return wrapSocketFunction<int>(netops::shutdown, s, how);
}

int socket(int af, int type, int protocol) {
  return network_socket_to_fd(netops::socket(af, type, protocol));
}

int socketpair(int domain, int type, int protocol, int sv[2]) {
  NetworkSocket pair[2];
  auto r = netops::socketpair(domain, type, protocol, pair);
  if (r == -1) {
    return r;
  }
  sv[0] = network_socket_to_fd(pair[0]);
  sv[1] = network_socket_to_fd(pair[1]);
  return 0;
}
} // namespace sockets
} // namespace portability
} // namespace folly
#endif

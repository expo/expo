//
// detail/impl/win_iocp_socket_service_base.ipp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_DETAIL_IMPL_WIN_IOCP_SOCKET_SERVICE_BASE_IPP
#define BOOST_ASIO_DETAIL_IMPL_WIN_IOCP_SOCKET_SERVICE_BASE_IPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>

#if defined(BOOST_ASIO_HAS_IOCP)

#include <boost/asio/detail/win_iocp_socket_service_base.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace detail {

win_iocp_socket_service_base::win_iocp_socket_service_base(
    boost::asio::io_service& io_service)
  : io_service_(io_service),
    iocp_service_(use_service<win_iocp_io_service>(io_service)),
    reactor_(0),
    connect_ex_(0),
    mutex_(),
    impl_list_(0)
{
}

void win_iocp_socket_service_base::shutdown_service()
{
  // Close all implementations, causing all operations to complete.
  boost::asio::detail::mutex::scoped_lock lock(mutex_);
  base_implementation_type* impl = impl_list_;
  while (impl)
  {
    boost::system::error_code ignored_ec;
    close_for_destruction(*impl);
    impl = impl->next_;
  }
}

void win_iocp_socket_service_base::construct(
    win_iocp_socket_service_base::base_implementation_type& impl)
{
  impl.socket_ = invalid_socket;
  impl.state_ = 0;
  impl.cancel_token_.reset();
#if defined(BOOST_ASIO_ENABLE_CANCELIO)
  impl.safe_cancellation_thread_id_ = 0;
#endif // defined(BOOST_ASIO_ENABLE_CANCELIO)

  // Insert implementation into linked list of all implementations.
  boost::asio::detail::mutex::scoped_lock lock(mutex_);
  impl.next_ = impl_list_;
  impl.prev_ = 0;
  if (impl_list_)
    impl_list_->prev_ = &impl;
  impl_list_ = &impl;
}

void win_iocp_socket_service_base::base_move_construct(
    win_iocp_socket_service_base::base_implementation_type& impl,
    win_iocp_socket_service_base::base_implementation_type& other_impl)
{
  impl.socket_ = other_impl.socket_;
  other_impl.socket_ = invalid_socket;

  impl.state_ = other_impl.state_;
  other_impl.state_ = 0;

  impl.cancel_token_ = other_impl.cancel_token_;
  other_impl.cancel_token_.reset();

#if defined(BOOST_ASIO_ENABLE_CANCELIO)
  impl.safe_cancellation_thread_id_ = other_impl.safe_cancellation_thread_id_;
  other_impl.safe_cancellation_thread_id_ = 0;
#endif // defined(BOOST_ASIO_ENABLE_CANCELIO)

  // Insert implementation into linked list of all implementations.
  boost::asio::detail::mutex::scoped_lock lock(mutex_);
  impl.next_ = impl_list_;
  impl.prev_ = 0;
  if (impl_list_)
    impl_list_->prev_ = &impl;
  impl_list_ = &impl;
}

void win_iocp_socket_service_base::base_move_assign(
    win_iocp_socket_service_base::base_implementation_type& impl,
    win_iocp_socket_service_base& other_service,
    win_iocp_socket_service_base::base_implementation_type& other_impl)
{
  close_for_destruction(impl);

  if (this != &other_service)
  {
    // Remove implementation from linked list of all implementations.
    boost::asio::detail::mutex::scoped_lock lock(mutex_);
    if (impl_list_ == &impl)
      impl_list_ = impl.next_;
    if (impl.prev_)
      impl.prev_->next_ = impl.next_;
    if (impl.next_)
      impl.next_->prev_= impl.prev_;
    impl.next_ = 0;
    impl.prev_ = 0;
  }

  impl.socket_ = other_impl.socket_;
  other_impl.socket_ = invalid_socket;

  impl.state_ = other_impl.state_;
  other_impl.state_ = 0;

  impl.cancel_token_ = other_impl.cancel_token_;
  other_impl.cancel_token_.reset();

#if defined(BOOST_ASIO_ENABLE_CANCELIO)
  impl.safe_cancellation_thread_id_ = other_impl.safe_cancellation_thread_id_;
  other_impl.safe_cancellation_thread_id_ = 0;
#endif // defined(BOOST_ASIO_ENABLE_CANCELIO)

  if (this != &other_service)
  {
    // Insert implementation into linked list of all implementations.
    boost::asio::detail::mutex::scoped_lock lock(other_service.mutex_);
    impl.next_ = other_service.impl_list_;
    impl.prev_ = 0;
    if (other_service.impl_list_)
      other_service.impl_list_->prev_ = &impl;
    other_service.impl_list_ = &impl;
  }
}

void win_iocp_socket_service_base::destroy(
    win_iocp_socket_service_base::base_implementation_type& impl)
{
  close_for_destruction(impl);

  // Remove implementation from linked list of all implementations.
  boost::asio::detail::mutex::scoped_lock lock(mutex_);
  if (impl_list_ == &impl)
    impl_list_ = impl.next_;
  if (impl.prev_)
    impl.prev_->next_ = impl.next_;
  if (impl.next_)
    impl.next_->prev_= impl.prev_;
  impl.next_ = 0;
  impl.prev_ = 0;
}

boost::system::error_code win_iocp_socket_service_base::close(
    win_iocp_socket_service_base::base_implementation_type& impl,
    boost::system::error_code& ec)
{
  if (is_open(impl))
  {
    BOOST_ASIO_HANDLER_OPERATION(("socket", &impl, "close"));

    // Check if the reactor was created, in which case we need to close the
    // socket on the reactor as well to cancel any operations that might be
    // running there.
    reactor* r = static_cast<reactor*>(
          interlocked_compare_exchange_pointer(
            reinterpret_cast<void**>(&reactor_), 0, 0));
    if (r)
      r->deregister_descriptor(impl.socket_, impl.reactor_data_, true);
  }

  socket_ops::close(impl.socket_, impl.state_, false, ec);

  impl.socket_ = invalid_socket;
  impl.state_ = 0;
  impl.cancel_token_.reset();
#if defined(BOOST_ASIO_ENABLE_CANCELIO)
  impl.safe_cancellation_thread_id_ = 0;
#endif // defined(BOOST_ASIO_ENABLE_CANCELIO)

  return ec;
}

boost::system::error_code win_iocp_socket_service_base::cancel(
    win_iocp_socket_service_base::base_implementation_type& impl,
    boost::system::error_code& ec)
{
  if (!is_open(impl))
  {
    ec = boost::asio::error::bad_descriptor;
    return ec;
  }

  BOOST_ASIO_HANDLER_OPERATION(("socket", &impl, "cancel"));

  if (FARPROC cancel_io_ex_ptr = ::GetProcAddress(
        ::GetModuleHandleA("KERNEL32"), "CancelIoEx"))
  {
    // The version of Windows supports cancellation from any thread.
    typedef BOOL (WINAPI* cancel_io_ex_t)(HANDLE, LPOVERLAPPED);
    cancel_io_ex_t cancel_io_ex = (cancel_io_ex_t)cancel_io_ex_ptr;
    socket_type sock = impl.socket_;
    HANDLE sock_as_handle = reinterpret_cast<HANDLE>(sock);
    if (!cancel_io_ex(sock_as_handle, 0))
    {
      DWORD last_error = ::GetLastError();
      if (last_error == ERROR_NOT_FOUND)
      {
        // ERROR_NOT_FOUND means that there were no operations to be
        // cancelled. We swallow this error to match the behaviour on other
        // platforms.
        ec = boost::system::error_code();
      }
      else
      {
        ec = boost::system::error_code(last_error,
            boost::asio::error::get_system_category());
      }
    }
    else
    {
      ec = boost::system::error_code();
    }
  }
#if defined(BOOST_ASIO_ENABLE_CANCELIO)
  else if (impl.safe_cancellation_thread_id_ == 0)
  {
    // No operations have been started, so there's nothing to cancel.
    ec = boost::system::error_code();
  }
  else if (impl.safe_cancellation_thread_id_ == ::GetCurrentThreadId())
  {
    // Asynchronous operations have been started from the current thread only,
    // so it is safe to try to cancel them using CancelIo.
    socket_type sock = impl.socket_;
    HANDLE sock_as_handle = reinterpret_cast<HANDLE>(sock);
    if (!::CancelIo(sock_as_handle))
    {
      DWORD last_error = ::GetLastError();
      ec = boost::system::error_code(last_error,
          boost::asio::error::get_system_category());
    }
    else
    {
      ec = boost::system::error_code();
    }
  }
  else
  {
    // Asynchronous operations have been started from more than one thread,
    // so cancellation is not safe.
    ec = boost::asio::error::operation_not_supported;
  }
#else // defined(BOOST_ASIO_ENABLE_CANCELIO)
  else
  {
    // Cancellation is not supported as CancelIo may not be used.
    ec = boost::asio::error::operation_not_supported;
  }
#endif // defined(BOOST_ASIO_ENABLE_CANCELIO)

  // Cancel any operations started via the reactor.
  if (!ec)
  {
    reactor* r = static_cast<reactor*>(
          interlocked_compare_exchange_pointer(
            reinterpret_cast<void**>(&reactor_), 0, 0));
    if (r)
      r->cancel_ops(impl.socket_, impl.reactor_data_);
  }

  return ec;
}

boost::system::error_code win_iocp_socket_service_base::do_open(
    win_iocp_socket_service_base::base_implementation_type& impl,
    int family, int type, int protocol, boost::system::error_code& ec)
{
  if (is_open(impl))
  {
    ec = boost::asio::error::already_open;
    return ec;
  }

  socket_holder sock(socket_ops::socket(family, type, protocol, ec));
  if (sock.get() == invalid_socket)
    return ec;

  HANDLE sock_as_handle = reinterpret_cast<HANDLE>(sock.get());
  if (iocp_service_.register_handle(sock_as_handle, ec))
    return ec;

  impl.socket_ = sock.release();
  switch (type)
  {
  case SOCK_STREAM: impl.state_ = socket_ops::stream_oriented; break;
  case SOCK_DGRAM: impl.state_ = socket_ops::datagram_oriented; break;
  default: impl.state_ = 0; break;
  }
  impl.cancel_token_.reset(static_cast<void*>(0), socket_ops::noop_deleter());
  ec = boost::system::error_code();
  return ec;
}

boost::system::error_code win_iocp_socket_service_base::do_assign(
    win_iocp_socket_service_base::base_implementation_type& impl,
    int type, socket_type native_socket, boost::system::error_code& ec)
{
  if (is_open(impl))
  {
    ec = boost::asio::error::already_open;
    return ec;
  }

  HANDLE sock_as_handle = reinterpret_cast<HANDLE>(native_socket);
  if (iocp_service_.register_handle(sock_as_handle, ec))
    return ec;

  impl.socket_ = native_socket;
  switch (type)
  {
  case SOCK_STREAM: impl.state_ = socket_ops::stream_oriented; break;
  case SOCK_DGRAM: impl.state_ = socket_ops::datagram_oriented; break;
  default: impl.state_ = 0; break;
  }
  impl.cancel_token_.reset(static_cast<void*>(0), socket_ops::noop_deleter());
  ec = boost::system::error_code();
  return ec;
}

void win_iocp_socket_service_base::start_send_op(
    win_iocp_socket_service_base::base_implementation_type& impl,
    WSABUF* buffers, std::size_t buffer_count,
    socket_base::message_flags flags, bool noop, operation* op)
{
  update_cancellation_thread_id(impl);
  iocp_service_.work_started();

  if (noop)
    iocp_service_.on_completion(op);
  else if (!is_open(impl))
    iocp_service_.on_completion(op, boost::asio::error::bad_descriptor);
  else
  {
    DWORD bytes_transferred = 0;
    int result = ::WSASend(impl.socket_, buffers,
        static_cast<DWORD>(buffer_count), &bytes_transferred, flags, op, 0);
    DWORD last_error = ::WSAGetLastError();
    if (last_error == ERROR_PORT_UNREACHABLE)
      last_error = WSAECONNREFUSED;
    if (result != 0 && last_error != WSA_IO_PENDING)
      iocp_service_.on_completion(op, last_error, bytes_transferred);
    else
      iocp_service_.on_pending(op);
  }
}

void win_iocp_socket_service_base::start_send_to_op(
    win_iocp_socket_service_base::base_implementation_type& impl,
    WSABUF* buffers, std::size_t buffer_count,
    const socket_addr_type* addr, int addrlen,
    socket_base::message_flags flags, operation* op)
{
  update_cancellation_thread_id(impl);
  iocp_service_.work_started();

  if (!is_open(impl))
    iocp_service_.on_completion(op, boost::asio::error::bad_descriptor);
  else
  {
    DWORD bytes_transferred = 0;
    int result = ::WSASendTo(impl.socket_, buffers,
        static_cast<DWORD>(buffer_count),
        &bytes_transferred, flags, addr, addrlen, op, 0);
    DWORD last_error = ::WSAGetLastError();
    if (last_error == ERROR_PORT_UNREACHABLE)
      last_error = WSAECONNREFUSED;
    if (result != 0 && last_error != WSA_IO_PENDING)
      iocp_service_.on_completion(op, last_error, bytes_transferred);
    else
      iocp_service_.on_pending(op);
  }
}

void win_iocp_socket_service_base::start_receive_op(
    win_iocp_socket_service_base::base_implementation_type& impl,
    WSABUF* buffers, std::size_t buffer_count,
    socket_base::message_flags flags, bool noop, operation* op)
{
  update_cancellation_thread_id(impl);
  iocp_service_.work_started();

  if (noop)
    iocp_service_.on_completion(op);
  else if (!is_open(impl))
    iocp_service_.on_completion(op, boost::asio::error::bad_descriptor);
  else
  {
    DWORD bytes_transferred = 0;
    DWORD recv_flags = flags;
    int result = ::WSARecv(impl.socket_, buffers,
        static_cast<DWORD>(buffer_count),
        &bytes_transferred, &recv_flags, op, 0);
    DWORD last_error = ::WSAGetLastError();
    if (last_error == ERROR_NETNAME_DELETED)
      last_error = WSAECONNRESET;
    else if (last_error == ERROR_PORT_UNREACHABLE)
      last_error = WSAECONNREFUSED;
    if (result != 0 && last_error != WSA_IO_PENDING)
      iocp_service_.on_completion(op, last_error, bytes_transferred);
    else
      iocp_service_.on_pending(op);
  }
}

void win_iocp_socket_service_base::start_null_buffers_receive_op(
    win_iocp_socket_service_base::base_implementation_type& impl,
    socket_base::message_flags flags, reactor_op* op)
{
  if ((impl.state_ & socket_ops::stream_oriented) != 0)
  {
    // For stream sockets on Windows, we may issue a 0-byte overlapped
    // WSARecv to wait until there is data available on the socket.
    ::WSABUF buf = { 0, 0 };
    start_receive_op(impl, &buf, 1, flags, false, op);
  }
  else
  {
    start_reactor_op(impl,
        (flags & socket_base::message_out_of_band)
          ? reactor::except_op : reactor::read_op,
        op);
  }
}

void win_iocp_socket_service_base::start_receive_from_op(
    win_iocp_socket_service_base::base_implementation_type& impl,
    WSABUF* buffers, std::size_t buffer_count, socket_addr_type* addr,
    socket_base::message_flags flags, int* addrlen, operation* op)
{
  update_cancellation_thread_id(impl);
  iocp_service_.work_started();

  if (!is_open(impl))
    iocp_service_.on_completion(op, boost::asio::error::bad_descriptor);
  else
  {
    DWORD bytes_transferred = 0;
    DWORD recv_flags = flags;
    int result = ::WSARecvFrom(impl.socket_, buffers,
        static_cast<DWORD>(buffer_count),
        &bytes_transferred, &recv_flags, addr, addrlen, op, 0);
    DWORD last_error = ::WSAGetLastError();
    if (last_error == ERROR_PORT_UNREACHABLE)
      last_error = WSAECONNREFUSED;
    if (result != 0 && last_error != WSA_IO_PENDING)
      iocp_service_.on_completion(op, last_error, bytes_transferred);
    else
      iocp_service_.on_pending(op);
  }
}

void win_iocp_socket_service_base::start_accept_op(
    win_iocp_socket_service_base::base_implementation_type& impl,
    bool peer_is_open, socket_holder& new_socket, int family, int type,
    int protocol, void* output_buffer, DWORD address_length, operation* op)
{
  update_cancellation_thread_id(impl);
  iocp_service_.work_started();

  if (!is_open(impl))
    iocp_service_.on_completion(op, boost::asio::error::bad_descriptor);
  else if (peer_is_open)
    iocp_service_.on_completion(op, boost::asio::error::already_open);
  else
  {
    boost::system::error_code ec;
    new_socket.reset(socket_ops::socket(family, type, protocol, ec));
    if (new_socket.get() == invalid_socket)
      iocp_service_.on_completion(op, ec);
    else
    {
      DWORD bytes_read = 0;
      BOOL result = ::AcceptEx(impl.socket_, new_socket.get(), output_buffer,
          0, address_length, address_length, &bytes_read, op);
      DWORD last_error = ::WSAGetLastError();
      if (!result && last_error != WSA_IO_PENDING)
        iocp_service_.on_completion(op, last_error);
      else
        iocp_service_.on_pending(op);
    }
  }
}

void win_iocp_socket_service_base::restart_accept_op(
    socket_type s, socket_holder& new_socket, int family, int type,
    int protocol, void* output_buffer, DWORD address_length, operation* op)
{
  new_socket.reset();
  iocp_service_.work_started();

  boost::system::error_code ec;
  new_socket.reset(socket_ops::socket(family, type, protocol, ec));
  if (new_socket.get() == invalid_socket)
    iocp_service_.on_completion(op, ec);
  else
  {
    DWORD bytes_read = 0;
    BOOL result = ::AcceptEx(s, new_socket.get(), output_buffer,
        0, address_length, address_length, &bytes_read, op);
    DWORD last_error = ::WSAGetLastError();
    if (!result && last_error != WSA_IO_PENDING)
      iocp_service_.on_completion(op, last_error);
    else
      iocp_service_.on_pending(op);
  }
}

void win_iocp_socket_service_base::start_reactor_op(
    win_iocp_socket_service_base::base_implementation_type& impl,
    int op_type, reactor_op* op)
{
  reactor& r = get_reactor();
  update_cancellation_thread_id(impl);

  if (is_open(impl))
  {
    r.start_op(op_type, impl.socket_, impl.reactor_data_, op, false, false);
    return;
  }
  else
    op->ec_ = boost::asio::error::bad_descriptor;

  iocp_service_.post_immediate_completion(op, false);
}

void win_iocp_socket_service_base::start_connect_op(
    win_iocp_socket_service_base::base_implementation_type& impl,
    int family, int type, const socket_addr_type* addr,
    std::size_t addrlen, win_iocp_socket_connect_op_base* op)
{
  // If ConnectEx is available, use that.
  if (family == BOOST_ASIO_OS_DEF(AF_INET)
      || family == BOOST_ASIO_OS_DEF(AF_INET6))
  {
    if (connect_ex_fn connect_ex = get_connect_ex(impl, type))
    {
      union address_union
      {
        socket_addr_type base;
        sockaddr_in4_type v4;
        sockaddr_in6_type v6;
      } a;

      using namespace std; // For memset.
      memset(&a, 0, sizeof(a));
      a.base.sa_family = family;

      socket_ops::bind(impl.socket_, &a.base,
          family == BOOST_ASIO_OS_DEF(AF_INET)
          ? sizeof(a.v4) : sizeof(a.v6), op->ec_);
      if (op->ec_ && op->ec_ != boost::asio::error::invalid_argument)
      {
        iocp_service_.post_immediate_completion(op, false);
        return;
      }

      op->connect_ex_ = true;
      update_cancellation_thread_id(impl);
      iocp_service_.work_started();

      BOOL result = connect_ex(impl.socket_,
          addr, static_cast<int>(addrlen), 0, 0, 0, op);
      DWORD last_error = ::WSAGetLastError();
      if (!result && last_error != WSA_IO_PENDING)
        iocp_service_.on_completion(op, last_error);
      else
        iocp_service_.on_pending(op);
      return;
    }
  }

  // Otherwise, fall back to a reactor-based implementation.
  reactor& r = get_reactor();
  update_cancellation_thread_id(impl);

  if ((impl.state_ & socket_ops::non_blocking) != 0
      || socket_ops::set_internal_non_blocking(
        impl.socket_, impl.state_, true, op->ec_))
  {
    if (socket_ops::connect(impl.socket_, addr, addrlen, op->ec_) != 0)
    {
      if (op->ec_ == boost::asio::error::in_progress
          || op->ec_ == boost::asio::error::would_block)
      {
        op->ec_ = boost::system::error_code();
        r.start_op(reactor::connect_op, impl.socket_,
            impl.reactor_data_, op, false, false);
        return;
      }
    }
  }

  r.post_immediate_completion(op, false);
}

void win_iocp_socket_service_base::close_for_destruction(
    win_iocp_socket_service_base::base_implementation_type& impl)
{
  if (is_open(impl))
  {
    BOOST_ASIO_HANDLER_OPERATION(("socket", &impl, "close"));

    // Check if the reactor was created, in which case we need to close the
    // socket on the reactor as well to cancel any operations that might be
    // running there.
    reactor* r = static_cast<reactor*>(
          interlocked_compare_exchange_pointer(
            reinterpret_cast<void**>(&reactor_), 0, 0));
    if (r)
      r->deregister_descriptor(impl.socket_, impl.reactor_data_, true);
  }

  boost::system::error_code ignored_ec;
  socket_ops::close(impl.socket_, impl.state_, true, ignored_ec);
  impl.socket_ = invalid_socket;
  impl.state_ = 0;
  impl.cancel_token_.reset();
#if defined(BOOST_ASIO_ENABLE_CANCELIO)
  impl.safe_cancellation_thread_id_ = 0;
#endif // defined(BOOST_ASIO_ENABLE_CANCELIO)
}

void win_iocp_socket_service_base::update_cancellation_thread_id(
    win_iocp_socket_service_base::base_implementation_type& impl)
{
#if defined(BOOST_ASIO_ENABLE_CANCELIO)
  if (impl.safe_cancellation_thread_id_ == 0)
    impl.safe_cancellation_thread_id_ = ::GetCurrentThreadId();
  else if (impl.safe_cancellation_thread_id_ != ::GetCurrentThreadId())
    impl.safe_cancellation_thread_id_ = ~DWORD(0);
#else // defined(BOOST_ASIO_ENABLE_CANCELIO)
  (void)impl;
#endif // defined(BOOST_ASIO_ENABLE_CANCELIO)
}

reactor& win_iocp_socket_service_base::get_reactor()
{
  reactor* r = static_cast<reactor*>(
        interlocked_compare_exchange_pointer(
          reinterpret_cast<void**>(&reactor_), 0, 0));
  if (!r)
  {
    r = &(use_service<reactor>(io_service_));
    interlocked_exchange_pointer(reinterpret_cast<void**>(&reactor_), r);
  }
  return *r;
}

win_iocp_socket_service_base::connect_ex_fn
win_iocp_socket_service_base::get_connect_ex(
    win_iocp_socket_service_base::base_implementation_type& impl, int type)
{
#if defined(BOOST_ASIO_DISABLE_CONNECTEX)
  (void)impl;
  (void)type;
  return 0;
#else // defined(BOOST_ASIO_DISABLE_CONNECTEX)
  if (type != BOOST_ASIO_OS_DEF(SOCK_STREAM)
      && type != BOOST_ASIO_OS_DEF(SOCK_SEQPACKET))
    return 0;

  void* ptr = interlocked_compare_exchange_pointer(&connect_ex_, 0, 0);
  if (!ptr)
  {
    GUID guid = { 0x25a207b9, 0xddf3, 0x4660,
      { 0x8e, 0xe9, 0x76, 0xe5, 0x8c, 0x74, 0x06, 0x3e } };

    DWORD bytes = 0;
    if (::WSAIoctl(impl.socket_, SIO_GET_EXTENSION_FUNCTION_POINTER,
          &guid, sizeof(guid), &ptr, sizeof(ptr), &bytes, 0, 0) != 0)
    {
      // Set connect_ex_ to a special value to indicate that ConnectEx is
      // unavailable. That way we won't bother trying to look it up again.
      ptr = this;
    }

    interlocked_exchange_pointer(&connect_ex_, ptr);
  }

  return reinterpret_cast<connect_ex_fn>(ptr == this ? 0 : ptr);
#endif // defined(BOOST_ASIO_DISABLE_CONNECTEX)
}

void* win_iocp_socket_service_base::interlocked_compare_exchange_pointer(
    void** dest, void* exch, void* cmp)
{
#if defined(_M_IX86)
  return reinterpret_cast<void*>(InterlockedCompareExchange(
        reinterpret_cast<PLONG>(dest), reinterpret_cast<LONG>(exch),
        reinterpret_cast<LONG>(cmp)));
#else
  return InterlockedCompareExchangePointer(dest, exch, cmp);
#endif
}

void* win_iocp_socket_service_base::interlocked_exchange_pointer(
    void** dest, void* val)
{
#if defined(_M_IX86)
  return reinterpret_cast<void*>(InterlockedExchange(
        reinterpret_cast<PLONG>(dest), reinterpret_cast<LONG>(val)));
#else
  return InterlockedExchangePointer(dest, val);
#endif
}

} // namespace detail
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // defined(BOOST_ASIO_HAS_IOCP)

#endif // BOOST_ASIO_DETAIL_IMPL_WIN_IOCP_SOCKET_SERVICE_BASE_IPP

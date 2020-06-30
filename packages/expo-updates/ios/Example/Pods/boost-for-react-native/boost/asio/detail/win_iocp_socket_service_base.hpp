//
// detail/win_iocp_socket_service_base.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_DETAIL_WIN_IOCP_SOCKET_SERVICE_BASE_HPP
#define BOOST_ASIO_DETAIL_WIN_IOCP_SOCKET_SERVICE_BASE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>

#if defined(BOOST_ASIO_HAS_IOCP)

#include <boost/asio/error.hpp>
#include <boost/asio/io_service.hpp>
#include <boost/asio/socket_base.hpp>
#include <boost/asio/detail/addressof.hpp>
#include <boost/asio/detail/bind_handler.hpp>
#include <boost/asio/detail/buffer_sequence_adapter.hpp>
#include <boost/asio/detail/fenced_block.hpp>
#include <boost/asio/detail/handler_alloc_helpers.hpp>
#include <boost/asio/detail/handler_invoke_helpers.hpp>
#include <boost/asio/detail/mutex.hpp>
#include <boost/asio/detail/operation.hpp>
#include <boost/asio/detail/reactor.hpp>
#include <boost/asio/detail/reactor_op.hpp>
#include <boost/asio/detail/socket_holder.hpp>
#include <boost/asio/detail/socket_ops.hpp>
#include <boost/asio/detail/socket_types.hpp>
#include <boost/asio/detail/win_iocp_io_service.hpp>
#include <boost/asio/detail/win_iocp_null_buffers_op.hpp>
#include <boost/asio/detail/win_iocp_socket_connect_op.hpp>
#include <boost/asio/detail/win_iocp_socket_send_op.hpp>
#include <boost/asio/detail/win_iocp_socket_recv_op.hpp>
#include <boost/asio/detail/win_iocp_socket_recvmsg_op.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace detail {

class win_iocp_socket_service_base
{
public:
  // The implementation type of the socket.
  struct base_implementation_type
  {
    // The native socket representation.
    socket_type socket_;

    // The current state of the socket.
    socket_ops::state_type state_;

    // We use a shared pointer as a cancellation token here to work around the
    // broken Windows support for cancellation. MSDN says that when you call
    // closesocket any outstanding WSARecv or WSASend operations will complete
    // with the error ERROR_OPERATION_ABORTED. In practice they complete with
    // ERROR_NETNAME_DELETED, which means you can't tell the difference between
    // a local cancellation and the socket being hard-closed by the peer.
    socket_ops::shared_cancel_token_type cancel_token_;

    // Per-descriptor data used by the reactor.
    reactor::per_descriptor_data reactor_data_;

#if defined(BOOST_ASIO_ENABLE_CANCELIO)
    // The ID of the thread from which it is safe to cancel asynchronous
    // operations. 0 means no asynchronous operations have been started yet.
    // ~0 means asynchronous operations have been started from more than one
    // thread, and cancellation is not supported for the socket.
    DWORD safe_cancellation_thread_id_;
#endif // defined(BOOST_ASIO_ENABLE_CANCELIO)

    // Pointers to adjacent socket implementations in linked list.
    base_implementation_type* next_;
    base_implementation_type* prev_;
  };

  // Constructor.
  BOOST_ASIO_DECL win_iocp_socket_service_base(
      boost::asio::io_service& io_service);

  // Destroy all user-defined handler objects owned by the service.
  BOOST_ASIO_DECL void shutdown_service();

  // Construct a new socket implementation.
  BOOST_ASIO_DECL void construct(base_implementation_type& impl);

  // Move-construct a new socket implementation.
  BOOST_ASIO_DECL void base_move_construct(base_implementation_type& impl,
      base_implementation_type& other_impl);

  // Move-assign from another socket implementation.
  BOOST_ASIO_DECL void base_move_assign(base_implementation_type& impl,
      win_iocp_socket_service_base& other_service,
      base_implementation_type& other_impl);

  // Destroy a socket implementation.
  BOOST_ASIO_DECL void destroy(base_implementation_type& impl);

  // Determine whether the socket is open.
  bool is_open(const base_implementation_type& impl) const
  {
    return impl.socket_ != invalid_socket;
  }

  // Destroy a socket implementation.
  BOOST_ASIO_DECL boost::system::error_code close(
      base_implementation_type& impl, boost::system::error_code& ec);

  // Cancel all operations associated with the socket.
  BOOST_ASIO_DECL boost::system::error_code cancel(
      base_implementation_type& impl, boost::system::error_code& ec);

  // Determine whether the socket is at the out-of-band data mark.
  bool at_mark(const base_implementation_type& impl,
      boost::system::error_code& ec) const
  {
    return socket_ops::sockatmark(impl.socket_, ec);
  }

  // Determine the number of bytes available for reading.
  std::size_t available(const base_implementation_type& impl,
      boost::system::error_code& ec) const
  {
    return socket_ops::available(impl.socket_, ec);
  }

  // Place the socket into the state where it will listen for new connections.
  boost::system::error_code listen(base_implementation_type& impl,
      int backlog, boost::system::error_code& ec)
  {
    socket_ops::listen(impl.socket_, backlog, ec);
    return ec;
  }

  // Perform an IO control command on the socket.
  template <typename IO_Control_Command>
  boost::system::error_code io_control(base_implementation_type& impl,
      IO_Control_Command& command, boost::system::error_code& ec)
  {
    socket_ops::ioctl(impl.socket_, impl.state_, command.name(),
        static_cast<ioctl_arg_type*>(command.data()), ec);
    return ec;
  }

  // Gets the non-blocking mode of the socket.
  bool non_blocking(const base_implementation_type& impl) const
  {
    return (impl.state_ & socket_ops::user_set_non_blocking) != 0;
  }

  // Sets the non-blocking mode of the socket.
  boost::system::error_code non_blocking(base_implementation_type& impl,
      bool mode, boost::system::error_code& ec)
  {
    socket_ops::set_user_non_blocking(impl.socket_, impl.state_, mode, ec);
    return ec;
  }

  // Gets the non-blocking mode of the native socket implementation.
  bool native_non_blocking(const base_implementation_type& impl) const
  {
    return (impl.state_ & socket_ops::internal_non_blocking) != 0;
  }

  // Sets the non-blocking mode of the native socket implementation.
  boost::system::error_code native_non_blocking(base_implementation_type& impl,
      bool mode, boost::system::error_code& ec)
  {
    socket_ops::set_internal_non_blocking(impl.socket_, impl.state_, mode, ec);
    return ec;
  }

  // Disable sends or receives on the socket.
  boost::system::error_code shutdown(base_implementation_type& impl,
      socket_base::shutdown_type what, boost::system::error_code& ec)
  {
    socket_ops::shutdown(impl.socket_, what, ec);
    return ec;
  }

  // Send the given data to the peer. Returns the number of bytes sent.
  template <typename ConstBufferSequence>
  size_t send(base_implementation_type& impl,
      const ConstBufferSequence& buffers,
      socket_base::message_flags flags, boost::system::error_code& ec)
  {
    buffer_sequence_adapter<boost::asio::const_buffer,
        ConstBufferSequence> bufs(buffers);

    return socket_ops::sync_send(impl.socket_, impl.state_,
        bufs.buffers(), bufs.count(), flags, bufs.all_empty(), ec);
  }

  // Wait until data can be sent without blocking.
  size_t send(base_implementation_type& impl, const null_buffers&,
      socket_base::message_flags, boost::system::error_code& ec)
  {
    // Wait for socket to become ready.
    socket_ops::poll_write(impl.socket_, impl.state_, ec);

    return 0;
  }

  // Start an asynchronous send. The data being sent must be valid for the
  // lifetime of the asynchronous operation.
  template <typename ConstBufferSequence, typename Handler>
  void async_send(base_implementation_type& impl,
      const ConstBufferSequence& buffers,
      socket_base::message_flags flags, Handler& handler)
  {
    // Allocate and construct an operation to wrap the handler.
    typedef win_iocp_socket_send_op<ConstBufferSequence, Handler> op;
    typename op::ptr p = { boost::asio::detail::addressof(handler),
      boost_asio_handler_alloc_helpers::allocate(
        sizeof(op), handler), 0 };
    p.p = new (p.v) op(impl.cancel_token_, buffers, handler);

    BOOST_ASIO_HANDLER_CREATION((p.p, "socket", &impl, "async_send"));

    buffer_sequence_adapter<boost::asio::const_buffer,
        ConstBufferSequence> bufs(buffers);

    start_send_op(impl, bufs.buffers(), bufs.count(), flags,
        (impl.state_ & socket_ops::stream_oriented) != 0 && bufs.all_empty(),
        p.p);
    p.v = p.p = 0;
  }

  // Start an asynchronous wait until data can be sent without blocking.
  template <typename Handler>
  void async_send(base_implementation_type& impl, const null_buffers&,
      socket_base::message_flags, Handler& handler)
  {
    // Allocate and construct an operation to wrap the handler.
    typedef win_iocp_null_buffers_op<Handler> op;
    typename op::ptr p = { boost::asio::detail::addressof(handler),
      boost_asio_handler_alloc_helpers::allocate(
        sizeof(op), handler), 0 };
    p.p = new (p.v) op(impl.cancel_token_, handler);

    BOOST_ASIO_HANDLER_CREATION((p.p, "socket",
          &impl, "async_send(null_buffers)"));

    start_reactor_op(impl, reactor::write_op, p.p);
    p.v = p.p = 0;
  }

  // Receive some data from the peer. Returns the number of bytes received.
  template <typename MutableBufferSequence>
  size_t receive(base_implementation_type& impl,
      const MutableBufferSequence& buffers,
      socket_base::message_flags flags, boost::system::error_code& ec)
  {
    buffer_sequence_adapter<boost::asio::mutable_buffer,
        MutableBufferSequence> bufs(buffers);

    return socket_ops::sync_recv(impl.socket_, impl.state_,
        bufs.buffers(), bufs.count(), flags, bufs.all_empty(), ec);
  }

  // Wait until data can be received without blocking.
  size_t receive(base_implementation_type& impl, const null_buffers&,
      socket_base::message_flags, boost::system::error_code& ec)
  {
    // Wait for socket to become ready.
    socket_ops::poll_read(impl.socket_, impl.state_, ec);

    return 0;
  }

  // Start an asynchronous receive. The buffer for the data being received
  // must be valid for the lifetime of the asynchronous operation.
  template <typename MutableBufferSequence, typename Handler>
  void async_receive(base_implementation_type& impl,
      const MutableBufferSequence& buffers,
      socket_base::message_flags flags, Handler& handler)
  {
    // Allocate and construct an operation to wrap the handler.
    typedef win_iocp_socket_recv_op<MutableBufferSequence, Handler> op;
    typename op::ptr p = { boost::asio::detail::addressof(handler),
      boost_asio_handler_alloc_helpers::allocate(
        sizeof(op), handler), 0 };
    p.p = new (p.v) op(impl.state_, impl.cancel_token_, buffers, handler);

    BOOST_ASIO_HANDLER_CREATION((p.p, "socket", &impl, "async_receive"));

    buffer_sequence_adapter<boost::asio::mutable_buffer,
        MutableBufferSequence> bufs(buffers);

    start_receive_op(impl, bufs.buffers(), bufs.count(), flags,
        (impl.state_ & socket_ops::stream_oriented) != 0 && bufs.all_empty(),
        p.p);
    p.v = p.p = 0;
  }

  // Wait until data can be received without blocking.
  template <typename Handler>
  void async_receive(base_implementation_type& impl, const null_buffers&,
      socket_base::message_flags flags, Handler& handler)
  {
    // Allocate and construct an operation to wrap the handler.
    typedef win_iocp_null_buffers_op<Handler> op;
    typename op::ptr p = { boost::asio::detail::addressof(handler),
      boost_asio_handler_alloc_helpers::allocate(
        sizeof(op), handler), 0 };
    p.p = new (p.v) op(impl.cancel_token_, handler);

    BOOST_ASIO_HANDLER_CREATION((p.p, "socket",
          &impl, "async_receive(null_buffers)"));

    start_null_buffers_receive_op(impl, flags, p.p);
    p.v = p.p = 0;
  }

  // Receive some data with associated flags. Returns the number of bytes
  // received.
  template <typename MutableBufferSequence>
  size_t receive_with_flags(base_implementation_type& impl,
      const MutableBufferSequence& buffers,
      socket_base::message_flags in_flags,
      socket_base::message_flags& out_flags, boost::system::error_code& ec)
  {
    buffer_sequence_adapter<boost::asio::mutable_buffer,
        MutableBufferSequence> bufs(buffers);

    return socket_ops::sync_recvmsg(impl.socket_, impl.state_,
        bufs.buffers(), bufs.count(), in_flags, out_flags, ec);
  }

  // Wait until data can be received without blocking.
  size_t receive_with_flags(base_implementation_type& impl,
      const null_buffers&, socket_base::message_flags,
      socket_base::message_flags& out_flags, boost::system::error_code& ec)
  {
    // Wait for socket to become ready.
    socket_ops::poll_read(impl.socket_, impl.state_, ec);

    // Clear out_flags, since we cannot give it any other sensible value when
    // performing a null_buffers operation.
    out_flags = 0;

    return 0;
  }

  // Start an asynchronous receive. The buffer for the data being received
  // must be valid for the lifetime of the asynchronous operation.
  template <typename MutableBufferSequence, typename Handler>
  void async_receive_with_flags(base_implementation_type& impl,
      const MutableBufferSequence& buffers, socket_base::message_flags in_flags,
      socket_base::message_flags& out_flags, Handler& handler)
  {
    // Allocate and construct an operation to wrap the handler.
    typedef win_iocp_socket_recvmsg_op<MutableBufferSequence, Handler> op;
    typename op::ptr p = { boost::asio::detail::addressof(handler),
      boost_asio_handler_alloc_helpers::allocate(
        sizeof(op), handler), 0 };
    p.p = new (p.v) op(impl.cancel_token_, buffers, out_flags, handler);

    BOOST_ASIO_HANDLER_CREATION((p.p, "socket",
          &impl, "async_receive_with_flags"));

    buffer_sequence_adapter<boost::asio::mutable_buffer,
        MutableBufferSequence> bufs(buffers);

    start_receive_op(impl, bufs.buffers(), bufs.count(), in_flags, false, p.p);
    p.v = p.p = 0;
  }

  // Wait until data can be received without blocking.
  template <typename Handler>
  void async_receive_with_flags(base_implementation_type& impl,
      const null_buffers&, socket_base::message_flags in_flags,
      socket_base::message_flags& out_flags, Handler& handler)
  {
    // Allocate and construct an operation to wrap the handler.
    typedef win_iocp_null_buffers_op<Handler> op;
    typename op::ptr p = { boost::asio::detail::addressof(handler),
      boost_asio_handler_alloc_helpers::allocate(
        sizeof(op), handler), 0 };
    p.p = new (p.v) op(impl.cancel_token_, handler);

    BOOST_ASIO_HANDLER_CREATION((p.p, "socket", &impl,
          "async_receive_with_flags(null_buffers)"));

    // Reset out_flags since it can be given no sensible value at this time.
    out_flags = 0;

    start_null_buffers_receive_op(impl, in_flags, p.p);
    p.v = p.p = 0;
  }

  // Helper function to restart an asynchronous accept operation.
  BOOST_ASIO_DECL void restart_accept_op(socket_type s,
      socket_holder& new_socket, int family, int type, int protocol,
      void* output_buffer, DWORD address_length, operation* op);

protected:
  // Open a new socket implementation.
  BOOST_ASIO_DECL boost::system::error_code do_open(
      base_implementation_type& impl, int family, int type,
      int protocol, boost::system::error_code& ec);

  // Assign a native socket to a socket implementation.
  BOOST_ASIO_DECL boost::system::error_code do_assign(
      base_implementation_type& impl, int type,
      socket_type native_socket, boost::system::error_code& ec);

  // Helper function to start an asynchronous send operation.
  BOOST_ASIO_DECL void start_send_op(base_implementation_type& impl,
      WSABUF* buffers, std::size_t buffer_count,
      socket_base::message_flags flags, bool noop, operation* op);

  // Helper function to start an asynchronous send_to operation.
  BOOST_ASIO_DECL void start_send_to_op(base_implementation_type& impl,
      WSABUF* buffers, std::size_t buffer_count,
      const socket_addr_type* addr, int addrlen,
      socket_base::message_flags flags, operation* op);

  // Helper function to start an asynchronous receive operation.
  BOOST_ASIO_DECL void start_receive_op(base_implementation_type& impl,
      WSABUF* buffers, std::size_t buffer_count,
      socket_base::message_flags flags, bool noop, operation* op);

  // Helper function to start an asynchronous null_buffers receive operation.
  BOOST_ASIO_DECL void start_null_buffers_receive_op(
      base_implementation_type& impl,
      socket_base::message_flags flags, reactor_op* op);

  // Helper function to start an asynchronous receive_from operation.
  BOOST_ASIO_DECL void start_receive_from_op(base_implementation_type& impl,
      WSABUF* buffers, std::size_t buffer_count, socket_addr_type* addr,
      socket_base::message_flags flags, int* addrlen, operation* op);

  // Helper function to start an asynchronous accept operation.
  BOOST_ASIO_DECL void start_accept_op(base_implementation_type& impl,
      bool peer_is_open, socket_holder& new_socket, int family, int type,
      int protocol, void* output_buffer, DWORD address_length, operation* op);

  // Start an asynchronous read or write operation using the reactor.
  BOOST_ASIO_DECL void start_reactor_op(base_implementation_type& impl,
      int op_type, reactor_op* op);

  // Start the asynchronous connect operation using the reactor.
  BOOST_ASIO_DECL void start_connect_op(base_implementation_type& impl,
      int family, int type, const socket_addr_type* remote_addr,
      std::size_t remote_addrlen, win_iocp_socket_connect_op_base* op);

  // Helper function to close a socket when the associated object is being
  // destroyed.
  BOOST_ASIO_DECL void close_for_destruction(base_implementation_type& impl);

  // Update the ID of the thread from which cancellation is safe.
  BOOST_ASIO_DECL void update_cancellation_thread_id(
      base_implementation_type& impl);

  // Helper function to get the reactor. If no reactor has been created yet, a
  // new one is obtained from the io_service and a pointer to it is cached in
  // this service.
  BOOST_ASIO_DECL reactor& get_reactor();

  // The type of a ConnectEx function pointer, as old SDKs may not provide it.
  typedef BOOL (PASCAL *connect_ex_fn)(SOCKET,
      const socket_addr_type*, int, void*, DWORD, DWORD*, OVERLAPPED*);

  // Helper function to get the ConnectEx pointer. If no ConnectEx pointer has
  // been obtained yet, one is obtained using WSAIoctl and the pointer is
  // cached. Returns a null pointer if ConnectEx is not available.
  BOOST_ASIO_DECL connect_ex_fn get_connect_ex(
      base_implementation_type& impl, int type);

  // Helper function to emulate InterlockedCompareExchangePointer functionality
  // for:
  // - very old Platform SDKs; and
  // - platform SDKs where MSVC's /Wp64 option causes spurious warnings.
  BOOST_ASIO_DECL void* interlocked_compare_exchange_pointer(
      void** dest, void* exch, void* cmp);

  // Helper function to emulate InterlockedExchangePointer functionality for:
  // - very old Platform SDKs; and
  // - platform SDKs where MSVC's /Wp64 option causes spurious warnings.
  BOOST_ASIO_DECL void* interlocked_exchange_pointer(void** dest, void* val);

  // The io_service used to obtain the reactor, if required.
  boost::asio::io_service& io_service_;

  // The IOCP service used for running asynchronous operations and dispatching
  // handlers.
  win_iocp_io_service& iocp_service_;

  // The reactor used for performing connect operations. This object is created
  // only if needed.
  reactor* reactor_;

  // Pointer to ConnectEx implementation.
  void* connect_ex_;

  // Mutex to protect access to the linked list of implementations. 
  boost::asio::detail::mutex mutex_;

  // The head of a linked list of all implementations.
  base_implementation_type* impl_list_;
};

} // namespace detail
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#if defined(BOOST_ASIO_HEADER_ONLY)
# include <boost/asio/detail/impl/win_iocp_socket_service_base.ipp>
#endif // defined(BOOST_ASIO_HEADER_ONLY)

#endif // defined(BOOST_ASIO_HAS_IOCP)

#endif // BOOST_ASIO_DETAIL_WIN_IOCP_SOCKET_SERVICE_BASE_HPP

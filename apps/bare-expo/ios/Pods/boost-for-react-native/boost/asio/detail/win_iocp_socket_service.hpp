//
// detail/win_iocp_socket_service.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_DETAIL_WIN_IOCP_SOCKET_SERVICE_HPP
#define BOOST_ASIO_DETAIL_WIN_IOCP_SOCKET_SERVICE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>

#if defined(BOOST_ASIO_HAS_IOCP)

#include <cstring>
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
#include <boost/asio/detail/win_iocp_socket_accept_op.hpp>
#include <boost/asio/detail/win_iocp_socket_connect_op.hpp>
#include <boost/asio/detail/win_iocp_socket_recvfrom_op.hpp>
#include <boost/asio/detail/win_iocp_socket_send_op.hpp>
#include <boost/asio/detail/win_iocp_socket_service_base.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace detail {

template <typename Protocol>
class win_iocp_socket_service : public win_iocp_socket_service_base
{
public:
  // The protocol type.
  typedef Protocol protocol_type;

  // The endpoint type.
  typedef typename Protocol::endpoint endpoint_type;

  // The native type of a socket.
  class native_handle_type
  {
  public:
    native_handle_type(socket_type s)
      : socket_(s),
        have_remote_endpoint_(false)
    {
    }

    native_handle_type(socket_type s, const endpoint_type& ep)
      : socket_(s),
        have_remote_endpoint_(true),
        remote_endpoint_(ep)
    {
    }

    void operator=(socket_type s)
    {
      socket_ = s;
      have_remote_endpoint_ = false;
      remote_endpoint_ = endpoint_type();
    }

    operator socket_type() const
    {
      return socket_;
    }

    bool have_remote_endpoint() const
    {
      return have_remote_endpoint_;
    }

    endpoint_type remote_endpoint() const
    {
      return remote_endpoint_;
    }

  private:
    socket_type socket_;
    bool have_remote_endpoint_;
    endpoint_type remote_endpoint_;
  };

  // The implementation type of the socket.
  struct implementation_type :
    win_iocp_socket_service_base::base_implementation_type
  {
    // Default constructor.
    implementation_type()
      : protocol_(endpoint_type().protocol()),
        have_remote_endpoint_(false),
        remote_endpoint_()
    {
    }

    // The protocol associated with the socket.
    protocol_type protocol_;

    // Whether we have a cached remote endpoint.
    bool have_remote_endpoint_;

    // A cached remote endpoint.
    endpoint_type remote_endpoint_;
  };

  // Constructor.
  win_iocp_socket_service(boost::asio::io_service& io_service)
    : win_iocp_socket_service_base(io_service)
  {
  }

  // Move-construct a new socket implementation.
  void move_construct(implementation_type& impl,
      implementation_type& other_impl)
  {
    this->base_move_construct(impl, other_impl);

    impl.protocol_ = other_impl.protocol_;
    other_impl.protocol_ = endpoint_type().protocol();

    impl.have_remote_endpoint_ = other_impl.have_remote_endpoint_;
    other_impl.have_remote_endpoint_ = false;

    impl.remote_endpoint_ = other_impl.remote_endpoint_;
    other_impl.remote_endpoint_ = endpoint_type();
  }

  // Move-assign from another socket implementation.
  void move_assign(implementation_type& impl,
      win_iocp_socket_service_base& other_service,
      implementation_type& other_impl)
  {
    this->base_move_assign(impl, other_service, other_impl);

    impl.protocol_ = other_impl.protocol_;
    other_impl.protocol_ = endpoint_type().protocol();

    impl.have_remote_endpoint_ = other_impl.have_remote_endpoint_;
    other_impl.have_remote_endpoint_ = false;

    impl.remote_endpoint_ = other_impl.remote_endpoint_;
    other_impl.remote_endpoint_ = endpoint_type();
  }

  // Move-construct a new socket implementation from another protocol type.
  template <typename Protocol1>
  void converting_move_construct(implementation_type& impl,
      typename win_iocp_socket_service<
        Protocol1>::implementation_type& other_impl)
  {
    this->base_move_construct(impl, other_impl);

    impl.protocol_ = protocol_type(other_impl.protocol_);
    other_impl.protocol_ = typename Protocol1::endpoint().protocol();

    impl.have_remote_endpoint_ = other_impl.have_remote_endpoint_;
    other_impl.have_remote_endpoint_ = false;

    impl.remote_endpoint_ = other_impl.remote_endpoint_;
    other_impl.remote_endpoint_ = typename Protocol1::endpoint();
  }

  // Open a new socket implementation.
  boost::system::error_code open(implementation_type& impl,
      const protocol_type& protocol, boost::system::error_code& ec)
  {
    if (!do_open(impl, protocol.family(),
          protocol.type(), protocol.protocol(), ec))
    {
      impl.protocol_ = protocol;
      impl.have_remote_endpoint_ = false;
      impl.remote_endpoint_ = endpoint_type();
    }
    return ec;
  }

  // Assign a native socket to a socket implementation.
  boost::system::error_code assign(implementation_type& impl,
      const protocol_type& protocol, const native_handle_type& native_socket,
      boost::system::error_code& ec)
  {
    if (!do_assign(impl, protocol.type(), native_socket, ec))
    {
      impl.protocol_ = protocol;
      impl.have_remote_endpoint_ = native_socket.have_remote_endpoint();
      impl.remote_endpoint_ = native_socket.remote_endpoint();
    }
    return ec;
  }

  // Get the native socket representation.
  native_handle_type native_handle(implementation_type& impl)
  {
    if (impl.have_remote_endpoint_)
      return native_handle_type(impl.socket_, impl.remote_endpoint_);
    return native_handle_type(impl.socket_);
  }

  // Bind the socket to the specified local endpoint.
  boost::system::error_code bind(implementation_type& impl,
      const endpoint_type& endpoint, boost::system::error_code& ec)
  {
    socket_ops::bind(impl.socket_, endpoint.data(), endpoint.size(), ec);
    return ec;
  }

  // Set a socket option.
  template <typename Option>
  boost::system::error_code set_option(implementation_type& impl,
      const Option& option, boost::system::error_code& ec)
  {
    socket_ops::setsockopt(impl.socket_, impl.state_,
        option.level(impl.protocol_), option.name(impl.protocol_),
        option.data(impl.protocol_), option.size(impl.protocol_), ec);
    return ec;
  }

  // Set a socket option.
  template <typename Option>
  boost::system::error_code get_option(const implementation_type& impl,
      Option& option, boost::system::error_code& ec) const
  {
    std::size_t size = option.size(impl.protocol_);
    socket_ops::getsockopt(impl.socket_, impl.state_,
        option.level(impl.protocol_), option.name(impl.protocol_),
        option.data(impl.protocol_), &size, ec);
    if (!ec)
      option.resize(impl.protocol_, size);
    return ec;
  }

  // Get the local endpoint.
  endpoint_type local_endpoint(const implementation_type& impl,
      boost::system::error_code& ec) const
  {
    endpoint_type endpoint;
    std::size_t addr_len = endpoint.capacity();
    if (socket_ops::getsockname(impl.socket_, endpoint.data(), &addr_len, ec))
      return endpoint_type();
    endpoint.resize(addr_len);
    return endpoint;
  }

  // Get the remote endpoint.
  endpoint_type remote_endpoint(const implementation_type& impl,
      boost::system::error_code& ec) const
  {
    endpoint_type endpoint = impl.remote_endpoint_;
    std::size_t addr_len = endpoint.capacity();
    if (socket_ops::getpeername(impl.socket_, endpoint.data(),
          &addr_len, impl.have_remote_endpoint_, ec))
      return endpoint_type();
    endpoint.resize(addr_len);
    return endpoint;
  }

  // Send a datagram to the specified endpoint. Returns the number of bytes
  // sent.
  template <typename ConstBufferSequence>
  size_t send_to(implementation_type& impl, const ConstBufferSequence& buffers,
      const endpoint_type& destination, socket_base::message_flags flags,
      boost::system::error_code& ec)
  {
    buffer_sequence_adapter<boost::asio::const_buffer,
        ConstBufferSequence> bufs(buffers);

    return socket_ops::sync_sendto(impl.socket_, impl.state_,
        bufs.buffers(), bufs.count(), flags,
        destination.data(), destination.size(), ec);
  }

  // Wait until data can be sent without blocking.
  size_t send_to(implementation_type& impl, const null_buffers&,
      const endpoint_type&, socket_base::message_flags,
      boost::system::error_code& ec)
  {
    // Wait for socket to become ready.
    socket_ops::poll_write(impl.socket_, impl.state_, ec);

    return 0;
  }

  // Start an asynchronous send. The data being sent must be valid for the
  // lifetime of the asynchronous operation.
  template <typename ConstBufferSequence, typename Handler>
  void async_send_to(implementation_type& impl,
      const ConstBufferSequence& buffers, const endpoint_type& destination,
      socket_base::message_flags flags, Handler& handler)
  {
    // Allocate and construct an operation to wrap the handler.
    typedef win_iocp_socket_send_op<ConstBufferSequence, Handler> op;
    typename op::ptr p = { boost::asio::detail::addressof(handler),
      boost_asio_handler_alloc_helpers::allocate(
        sizeof(op), handler), 0 };
    p.p = new (p.v) op(impl.cancel_token_, buffers, handler);

    BOOST_ASIO_HANDLER_CREATION((p.p, "socket", &impl, "async_send_to"));

    buffer_sequence_adapter<boost::asio::const_buffer,
        ConstBufferSequence> bufs(buffers);

    start_send_to_op(impl, bufs.buffers(), bufs.count(),
        destination.data(), static_cast<int>(destination.size()),
        flags, p.p);
    p.v = p.p = 0;
  }

  // Start an asynchronous wait until data can be sent without blocking.
  template <typename Handler>
  void async_send_to(implementation_type& impl, const null_buffers&,
      const endpoint_type&, socket_base::message_flags, Handler& handler)
  {
    // Allocate and construct an operation to wrap the handler.
    typedef win_iocp_null_buffers_op<Handler> op;
    typename op::ptr p = { boost::asio::detail::addressof(handler),
      boost_asio_handler_alloc_helpers::allocate(
        sizeof(op), handler), 0 };
    p.p = new (p.v) op(impl.cancel_token_, handler);

    BOOST_ASIO_HANDLER_CREATION((p.p, "socket",
          &impl, "async_send_to(null_buffers)"));

    start_reactor_op(impl, reactor::write_op, p.p);
    p.v = p.p = 0;
  }

  // Receive a datagram with the endpoint of the sender. Returns the number of
  // bytes received.
  template <typename MutableBufferSequence>
  size_t receive_from(implementation_type& impl,
      const MutableBufferSequence& buffers,
      endpoint_type& sender_endpoint, socket_base::message_flags flags,
      boost::system::error_code& ec)
  {
    buffer_sequence_adapter<boost::asio::mutable_buffer,
        MutableBufferSequence> bufs(buffers);

    std::size_t addr_len = sender_endpoint.capacity();
    std::size_t bytes_recvd = socket_ops::sync_recvfrom(
        impl.socket_, impl.state_, bufs.buffers(), bufs.count(),
        flags, sender_endpoint.data(), &addr_len, ec);

    if (!ec)
      sender_endpoint.resize(addr_len);

    return bytes_recvd;
  }

  // Wait until data can be received without blocking.
  size_t receive_from(implementation_type& impl,
      const null_buffers&, endpoint_type& sender_endpoint,
      socket_base::message_flags, boost::system::error_code& ec)
  {
    // Wait for socket to become ready.
    socket_ops::poll_read(impl.socket_, impl.state_, ec);

    // Reset endpoint since it can be given no sensible value at this time.
    sender_endpoint = endpoint_type();

    return 0;
  }

  // Start an asynchronous receive. The buffer for the data being received and
  // the sender_endpoint object must both be valid for the lifetime of the
  // asynchronous operation.
  template <typename MutableBufferSequence, typename Handler>
  void async_receive_from(implementation_type& impl,
      const MutableBufferSequence& buffers, endpoint_type& sender_endp,
      socket_base::message_flags flags, Handler& handler)
  {
    // Allocate and construct an operation to wrap the handler.
    typedef win_iocp_socket_recvfrom_op<
      MutableBufferSequence, endpoint_type, Handler> op;
    typename op::ptr p = { boost::asio::detail::addressof(handler),
      boost_asio_handler_alloc_helpers::allocate(
        sizeof(op), handler), 0 };
    p.p = new (p.v) op(sender_endp, impl.cancel_token_, buffers, handler);

    BOOST_ASIO_HANDLER_CREATION((p.p, "socket", &impl, "async_receive_from"));

    buffer_sequence_adapter<boost::asio::mutable_buffer,
        MutableBufferSequence> bufs(buffers);

    start_receive_from_op(impl, bufs.buffers(), bufs.count(),
        sender_endp.data(), flags, &p.p->endpoint_size(), p.p);
    p.v = p.p = 0;
  }

  // Wait until data can be received without blocking.
  template <typename Handler>
  void async_receive_from(implementation_type& impl,
      const null_buffers&, endpoint_type& sender_endpoint,
      socket_base::message_flags flags, Handler& handler)
  {
    // Allocate and construct an operation to wrap the handler.
    typedef win_iocp_null_buffers_op<Handler> op;
    typename op::ptr p = { boost::asio::detail::addressof(handler),
      boost_asio_handler_alloc_helpers::allocate(
        sizeof(op), handler), 0 };
    p.p = new (p.v) op(impl.cancel_token_, handler);

    BOOST_ASIO_HANDLER_CREATION((p.p, "socket", &impl,
          "async_receive_from(null_buffers)"));

    // Reset endpoint since it can be given no sensible value at this time.
    sender_endpoint = endpoint_type();

    start_null_buffers_receive_op(impl, flags, p.p);
    p.v = p.p = 0;
  }

  // Accept a new connection.
  template <typename Socket>
  boost::system::error_code accept(implementation_type& impl, Socket& peer,
      endpoint_type* peer_endpoint, boost::system::error_code& ec)
  {
    // We cannot accept a socket that is already open.
    if (peer.is_open())
    {
      ec = boost::asio::error::already_open;
      return ec;
    }

    std::size_t addr_len = peer_endpoint ? peer_endpoint->capacity() : 0;
    socket_holder new_socket(socket_ops::sync_accept(impl.socket_,
          impl.state_, peer_endpoint ? peer_endpoint->data() : 0,
          peer_endpoint ? &addr_len : 0, ec));

    // On success, assign new connection to peer socket object.
    if (new_socket.get() != invalid_socket)
    {
      if (peer_endpoint)
        peer_endpoint->resize(addr_len);
      if (!peer.assign(impl.protocol_, new_socket.get(), ec))
        new_socket.release();
    }

    return ec;
  }

  // Start an asynchronous accept. The peer and peer_endpoint objects
  // must be valid until the accept's handler is invoked.
  template <typename Socket, typename Handler>
  void async_accept(implementation_type& impl, Socket& peer,
      endpoint_type* peer_endpoint, Handler& handler)
  {
    // Allocate and construct an operation to wrap the handler.
    typedef win_iocp_socket_accept_op<Socket, protocol_type, Handler> op;
    typename op::ptr p = { boost::asio::detail::addressof(handler),
      boost_asio_handler_alloc_helpers::allocate(
        sizeof(op), handler), 0 };
    bool enable_connection_aborted =
      (impl.state_ & socket_ops::enable_connection_aborted) != 0;
    p.p = new (p.v) op(*this, impl.socket_, peer, impl.protocol_,
        peer_endpoint, enable_connection_aborted, handler);

    BOOST_ASIO_HANDLER_CREATION((p.p, "socket", &impl, "async_accept"));

    start_accept_op(impl, peer.is_open(), p.p->new_socket(),
        impl.protocol_.family(), impl.protocol_.type(),
        impl.protocol_.protocol(), p.p->output_buffer(),
        p.p->address_length(), p.p);
    p.v = p.p = 0;
  }

  // Connect the socket to the specified endpoint.
  boost::system::error_code connect(implementation_type& impl,
      const endpoint_type& peer_endpoint, boost::system::error_code& ec)
  {
    socket_ops::sync_connect(impl.socket_,
        peer_endpoint.data(), peer_endpoint.size(), ec);
    return ec;
  }

  // Start an asynchronous connect.
  template <typename Handler>
  void async_connect(implementation_type& impl,
      const endpoint_type& peer_endpoint, Handler& handler)
  {
    // Allocate and construct an operation to wrap the handler.
    typedef win_iocp_socket_connect_op<Handler> op;
    typename op::ptr p = { boost::asio::detail::addressof(handler),
      boost_asio_handler_alloc_helpers::allocate(
        sizeof(op), handler), 0 };
    p.p = new (p.v) op(impl.socket_, handler);

    BOOST_ASIO_HANDLER_CREATION((p.p, "socket", &impl, "async_connect"));

    start_connect_op(impl, impl.protocol_.family(), impl.protocol_.type(),
        peer_endpoint.data(), static_cast<int>(peer_endpoint.size()), p.p);
    p.v = p.p = 0;
  }
};

} // namespace detail
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // defined(BOOST_ASIO_HAS_IOCP)

#endif // BOOST_ASIO_DETAIL_WIN_IOCP_SOCKET_SERVICE_HPP

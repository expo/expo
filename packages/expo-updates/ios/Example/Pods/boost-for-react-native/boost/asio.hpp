//
// asio.hpp
// ~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
//  See www.boost.org/libs/asio for documentation.
//

#ifndef BOOST_ASIO_HPP
#define BOOST_ASIO_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/async_result.hpp>
#include <boost/asio/basic_datagram_socket.hpp>
#include <boost/asio/basic_deadline_timer.hpp>
#include <boost/asio/basic_io_object.hpp>
#include <boost/asio/basic_raw_socket.hpp>
#include <boost/asio/basic_seq_packet_socket.hpp>
#include <boost/asio/basic_serial_port.hpp>
#include <boost/asio/basic_signal_set.hpp>
#include <boost/asio/basic_socket_acceptor.hpp>
#include <boost/asio/basic_socket_iostream.hpp>
#include <boost/asio/basic_socket_streambuf.hpp>
#include <boost/asio/basic_stream_socket.hpp>
#include <boost/asio/basic_streambuf.hpp>
#include <boost/asio/basic_waitable_timer.hpp>
#include <boost/asio/buffer.hpp>
#include <boost/asio/buffered_read_stream_fwd.hpp>
#include <boost/asio/buffered_read_stream.hpp>
#include <boost/asio/buffered_stream_fwd.hpp>
#include <boost/asio/buffered_stream.hpp>
#include <boost/asio/buffered_write_stream_fwd.hpp>
#include <boost/asio/buffered_write_stream.hpp>
#include <boost/asio/buffers_iterator.hpp>
#include <boost/asio/completion_condition.hpp>
#include <boost/asio/connect.hpp>
#include <boost/asio/coroutine.hpp>
#include <boost/asio/datagram_socket_service.hpp>
#include <boost/asio/deadline_timer_service.hpp>
#include <boost/asio/deadline_timer.hpp>
#include <boost/asio/error.hpp>
#include <boost/asio/generic/basic_endpoint.hpp>
#include <boost/asio/generic/datagram_protocol.hpp>
#include <boost/asio/generic/raw_protocol.hpp>
#include <boost/asio/generic/seq_packet_protocol.hpp>
#include <boost/asio/generic/stream_protocol.hpp>
#include <boost/asio/handler_alloc_hook.hpp>
#include <boost/asio/handler_continuation_hook.hpp>
#include <boost/asio/handler_invoke_hook.hpp>
#include <boost/asio/handler_type.hpp>
#include <boost/asio/io_service.hpp>
#include <boost/asio/ip/address.hpp>
#include <boost/asio/ip/address_v4.hpp>
#include <boost/asio/ip/address_v6.hpp>
#include <boost/asio/ip/basic_endpoint.hpp>
#include <boost/asio/ip/basic_resolver.hpp>
#include <boost/asio/ip/basic_resolver_entry.hpp>
#include <boost/asio/ip/basic_resolver_iterator.hpp>
#include <boost/asio/ip/basic_resolver_query.hpp>
#include <boost/asio/ip/host_name.hpp>
#include <boost/asio/ip/icmp.hpp>
#include <boost/asio/ip/multicast.hpp>
#include <boost/asio/ip/resolver_query_base.hpp>
#include <boost/asio/ip/resolver_service.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <boost/asio/ip/udp.hpp>
#include <boost/asio/ip/unicast.hpp>
#include <boost/asio/ip/v6_only.hpp>
#include <boost/asio/is_read_buffered.hpp>
#include <boost/asio/is_write_buffered.hpp>
#include <boost/asio/local/basic_endpoint.hpp>
#include <boost/asio/local/connect_pair.hpp>
#include <boost/asio/local/datagram_protocol.hpp>
#include <boost/asio/local/stream_protocol.hpp>
#include <boost/asio/placeholders.hpp>
#include <boost/asio/posix/basic_descriptor.hpp>
#include <boost/asio/posix/basic_stream_descriptor.hpp>
#include <boost/asio/posix/descriptor_base.hpp>
#include <boost/asio/posix/stream_descriptor.hpp>
#include <boost/asio/posix/stream_descriptor_service.hpp>
#include <boost/asio/raw_socket_service.hpp>
#include <boost/asio/read.hpp>
#include <boost/asio/read_at.hpp>
#include <boost/asio/read_until.hpp>
#include <boost/asio/seq_packet_socket_service.hpp>
#include <boost/asio/serial_port.hpp>
#include <boost/asio/serial_port_base.hpp>
#include <boost/asio/serial_port_service.hpp>
#include <boost/asio/signal_set.hpp>
#include <boost/asio/signal_set_service.hpp>
#include <boost/asio/socket_acceptor_service.hpp>
#include <boost/asio/socket_base.hpp>
#include <boost/asio/strand.hpp>
#include <boost/asio/stream_socket_service.hpp>
#include <boost/asio/streambuf.hpp>
#include <boost/asio/time_traits.hpp>
#include <boost/asio/version.hpp>
#include <boost/asio/wait_traits.hpp>
#include <boost/asio/waitable_timer_service.hpp>
#include <boost/asio/windows/basic_handle.hpp>
#include <boost/asio/windows/basic_object_handle.hpp>
#include <boost/asio/windows/basic_random_access_handle.hpp>
#include <boost/asio/windows/basic_stream_handle.hpp>
#include <boost/asio/windows/object_handle.hpp>
#include <boost/asio/windows/object_handle_service.hpp>
#include <boost/asio/windows/overlapped_ptr.hpp>
#include <boost/asio/windows/random_access_handle.hpp>
#include <boost/asio/windows/random_access_handle_service.hpp>
#include <boost/asio/windows/stream_handle.hpp>
#include <boost/asio/windows/stream_handle_service.hpp>
#include <boost/asio/write.hpp>
#include <boost/asio/write_at.hpp>

#endif // BOOST_ASIO_HPP

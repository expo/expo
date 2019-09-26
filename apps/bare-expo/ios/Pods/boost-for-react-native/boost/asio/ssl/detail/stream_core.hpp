//
// ssl/detail/stream_core.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_SSL_DETAIL_STREAM_CORE_HPP
#define BOOST_ASIO_SSL_DETAIL_STREAM_CORE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>

#if !defined(BOOST_ASIO_ENABLE_OLD_SSL)
# if defined(BOOST_ASIO_HAS_BOOST_DATE_TIME)
#  include <boost/asio/deadline_timer.hpp>
# else // defined(BOOST_ASIO_HAS_BOOST_DATE_TIME)
#  include <boost/asio/steady_timer.hpp>
# endif // defined(BOOST_ASIO_HAS_BOOST_DATE_TIME)
# include <boost/asio/ssl/detail/engine.hpp>
# include <boost/asio/buffer.hpp>
#endif // !defined(BOOST_ASIO_ENABLE_OLD_SSL)

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace ssl {
namespace detail {

#if !defined(BOOST_ASIO_ENABLE_OLD_SSL)

struct stream_core
{
  // According to the OpenSSL documentation, this is the buffer size that is
  // sufficient to hold the largest possible TLS record.
  enum { max_tls_record_size = 17 * 1024 };

  stream_core(SSL_CTX* context, boost::asio::io_service& io_service)
    : engine_(context),
      pending_read_(io_service),
      pending_write_(io_service),
      output_buffer_space_(max_tls_record_size),
      output_buffer_(boost::asio::buffer(output_buffer_space_)),
      input_buffer_space_(max_tls_record_size),
      input_buffer_(boost::asio::buffer(input_buffer_space_))
  {
    pending_read_.expires_at(neg_infin());
    pending_write_.expires_at(neg_infin());
  }

  ~stream_core()
  {
  }

  // The SSL engine.
  engine engine_;

#if defined(BOOST_ASIO_HAS_BOOST_DATE_TIME)
  // Timer used for storing queued read operations.
  boost::asio::deadline_timer pending_read_;

  // Timer used for storing queued write operations.
  boost::asio::deadline_timer pending_write_;

  // Helper function for obtaining a time value that always fires.
  static boost::asio::deadline_timer::time_type neg_infin()
  {
    return boost::posix_time::neg_infin;
  }

  // Helper function for obtaining a time value that never fires.
  static boost::asio::deadline_timer::time_type pos_infin()
  {
    return boost::posix_time::pos_infin;
  }
#else // defined(BOOST_ASIO_HAS_BOOST_DATE_TIME)
  // Timer used for storing queued read operations.
  boost::asio::steady_timer pending_read_;

  // Timer used for storing queued write operations.
  boost::asio::steady_timer pending_write_;

  // Helper function for obtaining a time value that always fires.
  static boost::asio::steady_timer::time_point neg_infin()
  {
    return (boost::asio::steady_timer::time_point::min)();
  }

  // Helper function for obtaining a time value that never fires.
  static boost::asio::steady_timer::time_point pos_infin()
  {
    return (boost::asio::steady_timer::time_point::max)();
  }
#endif // defined(BOOST_ASIO_HAS_BOOST_DATE_TIME)

  // Buffer space used to prepare output intended for the transport.
  std::vector<unsigned char> output_buffer_space_;

  // A buffer that may be used to prepare output intended for the transport.
  const boost::asio::mutable_buffers_1 output_buffer_;

  // Buffer space used to read input intended for the engine.
  std::vector<unsigned char> input_buffer_space_;

  // A buffer that may be used to read input intended for the engine.
  const boost::asio::mutable_buffers_1 input_buffer_;

  // The buffer pointing to the engine's unconsumed input.
  boost::asio::const_buffer input_;
};

#endif // !defined(BOOST_ASIO_ENABLE_OLD_SSL)

} // namespace detail
} // namespace ssl
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_SSL_DETAIL_STREAM_CORE_HPP

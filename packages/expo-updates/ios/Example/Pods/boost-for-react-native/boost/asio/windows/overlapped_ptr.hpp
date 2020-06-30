//
// windows/overlapped_ptr.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_WINDOWS_OVERLAPPED_PTR_HPP
#define BOOST_ASIO_WINDOWS_OVERLAPPED_PTR_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>

#if defined(BOOST_ASIO_HAS_WINDOWS_OVERLAPPED_PTR) \
  || defined(GENERATING_DOCUMENTATION)

#include <boost/asio/detail/noncopyable.hpp>
#include <boost/asio/detail/win_iocp_overlapped_ptr.hpp>
#include <boost/asio/io_service.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace windows {

/// Wraps a handler to create an OVERLAPPED object for use with overlapped I/O.
/**
 * A special-purpose smart pointer used to wrap an application handler so that
 * it can be passed as the LPOVERLAPPED argument to overlapped I/O functions.
 *
 * @par Thread Safety
 * @e Distinct @e objects: Safe.@n
 * @e Shared @e objects: Unsafe.
 */
class overlapped_ptr
  : private noncopyable
{
public:
  /// Construct an empty overlapped_ptr.
  overlapped_ptr()
    : impl_()
  {
  }

  /// Construct an overlapped_ptr to contain the specified handler.
  template <typename Handler>
  explicit overlapped_ptr(boost::asio::io_service& io_service,
      BOOST_ASIO_MOVE_ARG(Handler) handler)
    : impl_(io_service, BOOST_ASIO_MOVE_CAST(Handler)(handler))
  {
  }

  /// Destructor automatically frees the OVERLAPPED object unless released.
  ~overlapped_ptr()
  {
  }

  /// Reset to empty.
  void reset()
  {
    impl_.reset();
  }

  /// Reset to contain the specified handler, freeing any current OVERLAPPED
  /// object.
  template <typename Handler>
  void reset(boost::asio::io_service& io_service,
      BOOST_ASIO_MOVE_ARG(Handler) handler)
  {
    impl_.reset(io_service, BOOST_ASIO_MOVE_CAST(Handler)(handler));
  }

  /// Get the contained OVERLAPPED object.
  OVERLAPPED* get()
  {
    return impl_.get();
  }

  /// Get the contained OVERLAPPED object.
  const OVERLAPPED* get() const
  {
    return impl_.get();
  }

  /// Release ownership of the OVERLAPPED object.
  OVERLAPPED* release()
  {
    return impl_.release();
  }

  /// Post completion notification for overlapped operation. Releases ownership.
  void complete(const boost::system::error_code& ec,
      std::size_t bytes_transferred)
  {
    impl_.complete(ec, bytes_transferred);
  }

private:
  detail::win_iocp_overlapped_ptr impl_;
};

} // namespace windows
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // defined(BOOST_ASIO_HAS_WINDOWS_OVERLAPPED_PTR)
       //   || defined(GENERATING_DOCUMENTATION)

#endif // BOOST_ASIO_WINDOWS_OVERLAPPED_PTR_HPP

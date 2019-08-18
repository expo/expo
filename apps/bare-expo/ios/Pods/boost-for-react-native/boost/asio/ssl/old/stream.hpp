//
// ssl/old/stream.hpp
// ~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2005 Voipster / Indrek dot Juhani at voipster dot com
// Copyright (c) 2005-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_SSL_OLD_STREAM_HPP
#define BOOST_ASIO_SSL_OLD_STREAM_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <cstddef>
#include <boost/noncopyable.hpp>
#include <boost/asio/detail/throw_error.hpp>
#include <boost/asio/detail/type_traits.hpp>
#include <boost/asio/error.hpp>
#include <boost/asio/ssl/basic_context.hpp>
#include <boost/asio/ssl/stream_base.hpp>
#include <boost/asio/ssl/stream_service.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace ssl {
namespace old {

/// Provides stream-oriented functionality using SSL.
/**
 * The stream class template provides asynchronous and blocking stream-oriented
 * functionality using SSL.
 *
 * @par Thread Safety
 * @e Distinct @e objects: Safe.@n
 * @e Shared @e objects: Unsafe.
 *
 * @par Example
 * To use the SSL stream template with an ip::tcp::socket, you would write:
 * @code
 * boost::asio::io_service io_service;
 * boost::asio::ssl::context context(io_service, boost::asio::ssl::context::sslv23);
 * boost::asio::ssl::stream<boost::asio::ip::tcp::socket> sock(io_service, context);
 * @endcode
 *
 * @par Concepts:
 * AsyncReadStream, AsyncWriteStream, Stream, SyncRead_Stream, SyncWriteStream.
 */
template <typename Stream, typename Service = old::stream_service>
class stream
  : public stream_base,
    private boost::noncopyable
{
public:
  /// The type of the next layer.
  typedef typename remove_reference<Stream>::type next_layer_type;

  /// The type of the lowest layer.
  typedef typename next_layer_type::lowest_layer_type lowest_layer_type;

  /// The type of the service that will be used to provide stream operations.
  typedef Service service_type;

  /// The native implementation type of the stream.
  typedef typename service_type::impl_type impl_type;

  /// Construct a stream.
  /**
   * This constructor creates a stream and initialises the underlying stream
   * object.
   *
   * @param arg The argument to be passed to initialise the underlying stream.
   *
   * @param context The SSL context to be used for the stream.
   */
  template <typename Arg, typename Context_Service>
  explicit stream(Arg& arg, basic_context<Context_Service>& context)
    : next_layer_(arg),
      service_(boost::asio::use_service<Service>(next_layer_.get_io_service())),
      impl_(service_.null())
  {
    service_.create(impl_, next_layer_, context);
  }

  /// Destructor.
  ~stream()
  {
    service_.destroy(impl_, next_layer_);
  }

  /// Get the io_service associated with the object.
  /**
   * This function may be used to obtain the io_service object that the stream
   * uses to dispatch handlers for asynchronous operations.
   *
   * @return A reference to the io_service object that stream will use to
   * dispatch handlers. Ownership is not transferred to the caller.
   */
  boost::asio::io_service& get_io_service()
  {
    return next_layer_.get_io_service();
  }

  /// Get a reference to the next layer.
  /**
   * This function returns a reference to the next layer in a stack of stream
   * layers.
   *
   * @return A reference to the next layer in the stack of stream layers.
   * Ownership is not transferred to the caller.
   */
  next_layer_type& next_layer()
  {
    return next_layer_;
  }

  /// Get a reference to the lowest layer.
  /**
   * This function returns a reference to the lowest layer in a stack of
   * stream layers.
   *
   * @return A reference to the lowest layer in the stack of stream layers.
   * Ownership is not transferred to the caller.
   */
  lowest_layer_type& lowest_layer()
  {
    return next_layer_.lowest_layer();
  }

  /// Get a const reference to the lowest layer.
  /**
   * This function returns a const reference to the lowest layer in a stack of
   * stream layers.
   *
   * @return A const reference to the lowest layer in the stack of stream
   * layers. Ownership is not transferred to the caller.
   */
  const lowest_layer_type& lowest_layer() const
  {
    return next_layer_.lowest_layer();
  }

  /// Get the underlying implementation in the native type.
  /**
   * This function may be used to obtain the underlying implementation of the
   * context. This is intended to allow access to stream functionality that is
   * not otherwise provided.
   */
  impl_type impl()
  {
    return impl_;
  }

  /// Perform SSL handshaking.
  /**
   * This function is used to perform SSL handshaking on the stream. The
   * function call will block until handshaking is complete or an error occurs.
   *
   * @param type The type of handshaking to be performed, i.e. as a client or as
   * a server.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void handshake(handshake_type type)
  {
    boost::system::error_code ec;
    service_.handshake(impl_, next_layer_, type, ec);
    boost::asio::detail::throw_error(ec);
  }

  /// Perform SSL handshaking.
  /**
   * This function is used to perform SSL handshaking on the stream. The
   * function call will block until handshaking is complete or an error occurs.
   *
   * @param type The type of handshaking to be performed, i.e. as a client or as
   * a server.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code handshake(handshake_type type,
      boost::system::error_code& ec)
  {
    return service_.handshake(impl_, next_layer_, type, ec);
  }

  /// Start an asynchronous SSL handshake.
  /**
   * This function is used to asynchronously perform an SSL handshake on the
   * stream. This function call always returns immediately.
   *
   * @param type The type of handshaking to be performed, i.e. as a client or as
   * a server.
   *
   * @param handler The handler to be called when the handshake operation
   * completes. Copies will be made of the handler as required. The equivalent
   * function signature of the handler must be:
   * @code void handler(
   *   const boost::system::error_code& error // Result of operation.
   * ); @endcode
   */
  template <typename HandshakeHandler>
  void async_handshake(handshake_type type, HandshakeHandler handler)
  {
    service_.async_handshake(impl_, next_layer_, type, handler);
  }

  /// Shut down SSL on the stream.
  /**
   * This function is used to shut down SSL on the stream. The function call
   * will block until SSL has been shut down or an error occurs.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void shutdown()
  {
    boost::system::error_code ec;
    service_.shutdown(impl_, next_layer_, ec);
    boost::asio::detail::throw_error(ec);
  }

  /// Shut down SSL on the stream.
  /**
   * This function is used to shut down SSL on the stream. The function call
   * will block until SSL has been shut down or an error occurs.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code shutdown(boost::system::error_code& ec)
  {
    return service_.shutdown(impl_, next_layer_, ec);
  }

  /// Asynchronously shut down SSL on the stream.
  /**
   * This function is used to asynchronously shut down SSL on the stream. This
   * function call always returns immediately.
   *
   * @param handler The handler to be called when the handshake operation
   * completes. Copies will be made of the handler as required. The equivalent
   * function signature of the handler must be:
   * @code void handler(
   *   const boost::system::error_code& error // Result of operation.
   * ); @endcode
   */
  template <typename ShutdownHandler>
  void async_shutdown(ShutdownHandler handler)
  {
    service_.async_shutdown(impl_, next_layer_, handler);
  }

  /// Write some data to the stream.
  /**
   * This function is used to write data on the stream. The function call will
   * block until one or more bytes of data has been written successfully, or
   * until an error occurs.
   *
   * @param buffers The data to be written.
   *
   * @returns The number of bytes written.
   *
   * @throws boost::system::system_error Thrown on failure.
   *
   * @note The write_some operation may not transmit all of the data to the
   * peer. Consider using the @ref write function if you need to ensure that all
   * data is written before the blocking operation completes.
   */
  template <typename ConstBufferSequence>
  std::size_t write_some(const ConstBufferSequence& buffers)
  {
    boost::system::error_code ec;
    std::size_t s = service_.write_some(impl_, next_layer_, buffers, ec);
    boost::asio::detail::throw_error(ec);
    return s;
  }

  /// Write some data to the stream.
  /**
   * This function is used to write data on the stream. The function call will
   * block until one or more bytes of data has been written successfully, or
   * until an error occurs.
   *
   * @param buffers The data to be written to the stream.
   *
   * @param ec Set to indicate what error occurred, if any.
   *
   * @returns The number of bytes written. Returns 0 if an error occurred.
   *
   * @note The write_some operation may not transmit all of the data to the
   * peer. Consider using the @ref write function if you need to ensure that all
   * data is written before the blocking operation completes.
   */
  template <typename ConstBufferSequence>
  std::size_t write_some(const ConstBufferSequence& buffers,
      boost::system::error_code& ec)
  {
    return service_.write_some(impl_, next_layer_, buffers, ec);
  }

  /// Start an asynchronous write.
  /**
   * This function is used to asynchronously write one or more bytes of data to
   * the stream. The function call always returns immediately.
   *
   * @param buffers The data to be written to the stream. Although the buffers
   * object may be copied as necessary, ownership of the underlying buffers is
   * retained by the caller, which must guarantee that they remain valid until
   * the handler is called.
   *
   * @param handler The handler to be called when the write operation completes.
   * Copies will be made of the handler as required. The equivalent function
   * signature of the handler must be:
   * @code void handler(
   *   const boost::system::error_code& error, // Result of operation.
   *   std::size_t bytes_transferred           // Number of bytes written.
   * ); @endcode
   *
   * @note The async_write_some operation may not transmit all of the data to
   * the peer. Consider using the @ref async_write function if you need to
   * ensure that all data is written before the blocking operation completes.
   */
  template <typename ConstBufferSequence, typename WriteHandler>
  void async_write_some(const ConstBufferSequence& buffers,
      WriteHandler handler)
  {
    service_.async_write_some(impl_, next_layer_, buffers, handler);
  }

  /// Read some data from the stream.
  /**
   * This function is used to read data from the stream. The function call will
   * block until one or more bytes of data has been read successfully, or until
   * an error occurs.
   *
   * @param buffers The buffers into which the data will be read.
   *
   * @returns The number of bytes read.
   *
   * @throws boost::system::system_error Thrown on failure.
   *
   * @note The read_some operation may not read all of the requested number of
   * bytes. Consider using the @ref read function if you need to ensure that the
   * requested amount of data is read before the blocking operation completes.
   */
  template <typename MutableBufferSequence>
  std::size_t read_some(const MutableBufferSequence& buffers)
  {
    boost::system::error_code ec;
    std::size_t s = service_.read_some(impl_, next_layer_, buffers, ec);
    boost::asio::detail::throw_error(ec);
    return s;
  }

  /// Read some data from the stream.
  /**
   * This function is used to read data from the stream. The function call will
   * block until one or more bytes of data has been read successfully, or until
   * an error occurs.
   *
   * @param buffers The buffers into which the data will be read.
   *
   * @param ec Set to indicate what error occurred, if any.
   *
   * @returns The number of bytes read. Returns 0 if an error occurred.
   *
   * @note The read_some operation may not read all of the requested number of
   * bytes. Consider using the @ref read function if you need to ensure that the
   * requested amount of data is read before the blocking operation completes.
   */
  template <typename MutableBufferSequence>
  std::size_t read_some(const MutableBufferSequence& buffers,
      boost::system::error_code& ec)
  {
    return service_.read_some(impl_, next_layer_, buffers, ec);
  }

  /// Start an asynchronous read.
  /**
   * This function is used to asynchronously read one or more bytes of data from
   * the stream. The function call always returns immediately.
   *
   * @param buffers The buffers into which the data will be read. Although the
   * buffers object may be copied as necessary, ownership of the underlying
   * buffers is retained by the caller, which must guarantee that they remain
   * valid until the handler is called.
   *
   * @param handler The handler to be called when the read operation completes.
   * Copies will be made of the handler as required. The equivalent function
   * signature of the handler must be:
   * @code void handler(
   *   const boost::system::error_code& error, // Result of operation.
   *   std::size_t bytes_transferred           // Number of bytes read.
   * ); @endcode
   *
   * @note The async_read_some operation may not read all of the requested
   * number of bytes. Consider using the @ref async_read function if you need to
   * ensure that the requested amount of data is read before the asynchronous
   * operation completes.
   */
  template <typename MutableBufferSequence, typename ReadHandler>
  void async_read_some(const MutableBufferSequence& buffers,
      ReadHandler handler)
  {
    service_.async_read_some(impl_, next_layer_, buffers, handler);
  }

  /// Peek at the incoming data on the stream.
  /**
   * This function is used to peek at the incoming data on the stream, without
   * removing it from the input queue. The function call will block until data
   * has been read successfully or an error occurs.
   *
   * @param buffers The buffers into which the data will be read.
   *
   * @returns The number of bytes read.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  template <typename MutableBufferSequence>
  std::size_t peek(const MutableBufferSequence& buffers)
  {
    boost::system::error_code ec;
    std::size_t s = service_.peek(impl_, next_layer_, buffers, ec);
    boost::asio::detail::throw_error(ec);
    return s;
  }

  /// Peek at the incoming data on the stream.
  /**
   * This function is used to peek at the incoming data on the stream, withoutxi
   * removing it from the input queue. The function call will block until data
   * has been read successfully or an error occurs.
   *
   * @param buffers The buffers into which the data will be read.
   *
   * @param ec Set to indicate what error occurred, if any.
   *
   * @returns The number of bytes read. Returns 0 if an error occurred.
   */
  template <typename MutableBufferSequence>
  std::size_t peek(const MutableBufferSequence& buffers,
      boost::system::error_code& ec)
  {
    return service_.peek(impl_, next_layer_, buffers, ec);
  }

  /// Determine the amount of data that may be read without blocking.
  /**
   * This function is used to determine the amount of data, in bytes, that may
   * be read from the stream without blocking.
   *
   * @returns The number of bytes of data that can be read without blocking.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  std::size_t in_avail()
  {
    boost::system::error_code ec;
    std::size_t s = service_.in_avail(impl_, next_layer_, ec);
    boost::asio::detail::throw_error(ec);
    return s;
  }

  /// Determine the amount of data that may be read without blocking.
  /**
   * This function is used to determine the amount of data, in bytes, that may
   * be read from the stream without blocking.
   *
   * @param ec Set to indicate what error occurred, if any.
   *
   * @returns The number of bytes of data that can be read without blocking.
   */
  std::size_t in_avail(boost::system::error_code& ec)
  {
    return service_.in_avail(impl_, next_layer_, ec);
  }

private:
  /// The next layer.
  Stream next_layer_;

  /// The backend service implementation.
  service_type& service_;

  /// The underlying native implementation.
  impl_type impl_;
};

} // namespace old
} // namespace ssl
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_SSL_OLD_STREAM_HPP

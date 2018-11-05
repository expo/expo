//
// buffered_stream.hpp
// ~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_BUFFERED_STREAM_HPP
#define BOOST_ASIO_BUFFERED_STREAM_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <cstddef>
#include <boost/asio/async_result.hpp>
#include <boost/asio/buffered_read_stream.hpp>
#include <boost/asio/buffered_write_stream.hpp>
#include <boost/asio/buffered_stream_fwd.hpp>
#include <boost/asio/detail/noncopyable.hpp>
#include <boost/asio/error.hpp>
#include <boost/asio/io_service.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {

/// Adds buffering to the read- and write-related operations of a stream.
/**
 * The buffered_stream class template can be used to add buffering to the
 * synchronous and asynchronous read and write operations of a stream.
 *
 * @par Thread Safety
 * @e Distinct @e objects: Safe.@n
 * @e Shared @e objects: Unsafe.
 *
 * @par Concepts:
 * AsyncReadStream, AsyncWriteStream, Stream, SyncReadStream, SyncWriteStream.
 */
template <typename Stream>
class buffered_stream
  : private noncopyable
{
public:
  /// The type of the next layer.
  typedef typename remove_reference<Stream>::type next_layer_type;

  /// The type of the lowest layer.
  typedef typename next_layer_type::lowest_layer_type lowest_layer_type;

  /// Construct, passing the specified argument to initialise the next layer.
  template <typename Arg>
  explicit buffered_stream(Arg& a)
    : inner_stream_impl_(a),
      stream_impl_(inner_stream_impl_)
  {
  }

  /// Construct, passing the specified argument to initialise the next layer.
  template <typename Arg>
  explicit buffered_stream(Arg& a, std::size_t read_buffer_size,
      std::size_t write_buffer_size)
    : inner_stream_impl_(a, write_buffer_size),
      stream_impl_(inner_stream_impl_, read_buffer_size)
  {
  }

  /// Get a reference to the next layer.
  next_layer_type& next_layer()
  {
    return stream_impl_.next_layer().next_layer();
  }

  /// Get a reference to the lowest layer.
  lowest_layer_type& lowest_layer()
  {
    return stream_impl_.lowest_layer();
  }

  /// Get a const reference to the lowest layer.
  const lowest_layer_type& lowest_layer() const
  {
    return stream_impl_.lowest_layer();
  }

  /// Get the io_service associated with the object.
  boost::asio::io_service& get_io_service()
  {
    return stream_impl_.get_io_service();
  }

  /// Close the stream.
  void close()
  {
    stream_impl_.close();
  }

  /// Close the stream.
  boost::system::error_code close(boost::system::error_code& ec)
  {
    return stream_impl_.close(ec);
  }

  /// Flush all data from the buffer to the next layer. Returns the number of
  /// bytes written to the next layer on the last write operation. Throws an
  /// exception on failure.
  std::size_t flush()
  {
    return stream_impl_.next_layer().flush();
  }

  /// Flush all data from the buffer to the next layer. Returns the number of
  /// bytes written to the next layer on the last write operation, or 0 if an
  /// error occurred.
  std::size_t flush(boost::system::error_code& ec)
  {
    return stream_impl_.next_layer().flush(ec);
  }

  /// Start an asynchronous flush.
  template <typename WriteHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(WriteHandler,
      void (boost::system::error_code, std::size_t))
  async_flush(BOOST_ASIO_MOVE_ARG(WriteHandler) handler)
  {
    return stream_impl_.next_layer().async_flush(
        BOOST_ASIO_MOVE_CAST(WriteHandler)(handler));
  }

  /// Write the given data to the stream. Returns the number of bytes written.
  /// Throws an exception on failure.
  template <typename ConstBufferSequence>
  std::size_t write_some(const ConstBufferSequence& buffers)
  {
    return stream_impl_.write_some(buffers);
  }

  /// Write the given data to the stream. Returns the number of bytes written,
  /// or 0 if an error occurred.
  template <typename ConstBufferSequence>
  std::size_t write_some(const ConstBufferSequence& buffers,
      boost::system::error_code& ec)
  {
    return stream_impl_.write_some(buffers, ec);
  }

  /// Start an asynchronous write. The data being written must be valid for the
  /// lifetime of the asynchronous operation.
  template <typename ConstBufferSequence, typename WriteHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(WriteHandler,
      void (boost::system::error_code, std::size_t))
  async_write_some(const ConstBufferSequence& buffers,
      BOOST_ASIO_MOVE_ARG(WriteHandler) handler)
  {
    return stream_impl_.async_write_some(buffers,
        BOOST_ASIO_MOVE_CAST(WriteHandler)(handler));
  }

  /// Fill the buffer with some data. Returns the number of bytes placed in the
  /// buffer as a result of the operation. Throws an exception on failure.
  std::size_t fill()
  {
    return stream_impl_.fill();
  }

  /// Fill the buffer with some data. Returns the number of bytes placed in the
  /// buffer as a result of the operation, or 0 if an error occurred.
  std::size_t fill(boost::system::error_code& ec)
  {
    return stream_impl_.fill(ec);
  }

  /// Start an asynchronous fill.
  template <typename ReadHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(ReadHandler,
      void (boost::system::error_code, std::size_t))
  async_fill(BOOST_ASIO_MOVE_ARG(ReadHandler) handler)
  {
    return stream_impl_.async_fill(BOOST_ASIO_MOVE_CAST(ReadHandler)(handler));
  }

  /// Read some data from the stream. Returns the number of bytes read. Throws
  /// an exception on failure.
  template <typename MutableBufferSequence>
  std::size_t read_some(const MutableBufferSequence& buffers)
  {
    return stream_impl_.read_some(buffers);
  }

  /// Read some data from the stream. Returns the number of bytes read or 0 if
  /// an error occurred.
  template <typename MutableBufferSequence>
  std::size_t read_some(const MutableBufferSequence& buffers,
      boost::system::error_code& ec)
  {
    return stream_impl_.read_some(buffers, ec);
  }

  /// Start an asynchronous read. The buffer into which the data will be read
  /// must be valid for the lifetime of the asynchronous operation.
  template <typename MutableBufferSequence, typename ReadHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(ReadHandler,
      void (boost::system::error_code, std::size_t))
  async_read_some(const MutableBufferSequence& buffers,
      BOOST_ASIO_MOVE_ARG(ReadHandler) handler)
  {
    return stream_impl_.async_read_some(buffers,
        BOOST_ASIO_MOVE_CAST(ReadHandler)(handler));
  }

  /// Peek at the incoming data on the stream. Returns the number of bytes read.
  /// Throws an exception on failure.
  template <typename MutableBufferSequence>
  std::size_t peek(const MutableBufferSequence& buffers)
  {
    return stream_impl_.peek(buffers);
  }

  /// Peek at the incoming data on the stream. Returns the number of bytes read,
  /// or 0 if an error occurred.
  template <typename MutableBufferSequence>
  std::size_t peek(const MutableBufferSequence& buffers,
      boost::system::error_code& ec)
  {
    return stream_impl_.peek(buffers, ec);
  }

  /// Determine the amount of data that may be read without blocking.
  std::size_t in_avail()
  {
    return stream_impl_.in_avail();
  }

  /// Determine the amount of data that may be read without blocking.
  std::size_t in_avail(boost::system::error_code& ec)
  {
    return stream_impl_.in_avail(ec);
  }

private:
  // The buffered write stream.
  typedef buffered_write_stream<Stream> write_stream_type;
  write_stream_type inner_stream_impl_;

  // The buffered read stream.
  typedef buffered_read_stream<write_stream_type&> read_stream_type;
  read_stream_type stream_impl_;
};

} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_BUFFERED_STREAM_HPP

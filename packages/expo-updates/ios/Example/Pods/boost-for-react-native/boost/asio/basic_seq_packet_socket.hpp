//
// basic_seq_packet_socket.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_BASIC_SEQ_PACKET_SOCKET_HPP
#define BOOST_ASIO_BASIC_SEQ_PACKET_SOCKET_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <cstddef>
#include <boost/asio/basic_socket.hpp>
#include <boost/asio/detail/handler_type_requirements.hpp>
#include <boost/asio/detail/throw_error.hpp>
#include <boost/asio/error.hpp>
#include <boost/asio/seq_packet_socket_service.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {

/// Provides sequenced packet socket functionality.
/**
 * The basic_seq_packet_socket class template provides asynchronous and blocking
 * sequenced packet socket functionality.
 *
 * @par Thread Safety
 * @e Distinct @e objects: Safe.@n
 * @e Shared @e objects: Unsafe.
 */
template <typename Protocol,
    typename SeqPacketSocketService = seq_packet_socket_service<Protocol> >
class basic_seq_packet_socket
  : public basic_socket<Protocol, SeqPacketSocketService>
{
public:
  /// (Deprecated: Use native_handle_type.) The native representation of a
  /// socket.
  typedef typename SeqPacketSocketService::native_handle_type native_type;

  /// The native representation of a socket.
  typedef typename SeqPacketSocketService::native_handle_type
    native_handle_type;

  /// The protocol type.
  typedef Protocol protocol_type;

  /// The endpoint type.
  typedef typename Protocol::endpoint endpoint_type;

  /// Construct a basic_seq_packet_socket without opening it.
  /**
   * This constructor creates a sequenced packet socket without opening it. The
   * socket needs to be opened and then connected or accepted before data can
   * be sent or received on it.
   *
   * @param io_service The io_service object that the sequenced packet socket
   * will use to dispatch handlers for any asynchronous operations performed on
   * the socket.
   */
  explicit basic_seq_packet_socket(boost::asio::io_service& io_service)
    : basic_socket<Protocol, SeqPacketSocketService>(io_service)
  {
  }

  /// Construct and open a basic_seq_packet_socket.
  /**
   * This constructor creates and opens a sequenced_packet socket. The socket
   * needs to be connected or accepted before data can be sent or received on
   * it.
   *
   * @param io_service The io_service object that the sequenced packet socket
   * will use to dispatch handlers for any asynchronous operations performed on
   * the socket.
   *
   * @param protocol An object specifying protocol parameters to be used.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  basic_seq_packet_socket(boost::asio::io_service& io_service,
      const protocol_type& protocol)
    : basic_socket<Protocol, SeqPacketSocketService>(io_service, protocol)
  {
  }

  /// Construct a basic_seq_packet_socket, opening it and binding it to the
  /// given local endpoint.
  /**
   * This constructor creates a sequenced packet socket and automatically opens
   * it bound to the specified endpoint on the local machine. The protocol used
   * is the protocol associated with the given endpoint.
   *
   * @param io_service The io_service object that the sequenced packet socket
   * will use to dispatch handlers for any asynchronous operations performed on
   * the socket.
   *
   * @param endpoint An endpoint on the local machine to which the sequenced
   * packet socket will be bound.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  basic_seq_packet_socket(boost::asio::io_service& io_service,
      const endpoint_type& endpoint)
    : basic_socket<Protocol, SeqPacketSocketService>(io_service, endpoint)
  {
  }

  /// Construct a basic_seq_packet_socket on an existing native socket.
  /**
   * This constructor creates a sequenced packet socket object to hold an
   * existing native socket.
   *
   * @param io_service The io_service object that the sequenced packet socket
   * will use to dispatch handlers for any asynchronous operations performed on
   * the socket.
   *
   * @param protocol An object specifying protocol parameters to be used.
   *
   * @param native_socket The new underlying socket implementation.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  basic_seq_packet_socket(boost::asio::io_service& io_service,
      const protocol_type& protocol, const native_handle_type& native_socket)
    : basic_socket<Protocol, SeqPacketSocketService>(
        io_service, protocol, native_socket)
  {
  }

#if defined(BOOST_ASIO_HAS_MOVE) || defined(GENERATING_DOCUMENTATION)
  /// Move-construct a basic_seq_packet_socket from another.
  /**
   * This constructor moves a sequenced packet socket from one object to
   * another.
   *
   * @param other The other basic_seq_packet_socket object from which the move
   * will occur.
   *
   * @note Following the move, the moved-from object is in the same state as if
   * constructed using the @c basic_seq_packet_socket(io_service&) constructor.
   */
  basic_seq_packet_socket(basic_seq_packet_socket&& other)
    : basic_socket<Protocol, SeqPacketSocketService>(
        BOOST_ASIO_MOVE_CAST(basic_seq_packet_socket)(other))
  {
  }

  /// Move-assign a basic_seq_packet_socket from another.
  /**
   * This assignment operator moves a sequenced packet socket from one object to
   * another.
   *
   * @param other The other basic_seq_packet_socket object from which the move
   * will occur.
   *
   * @note Following the move, the moved-from object is in the same state as if
   * constructed using the @c basic_seq_packet_socket(io_service&) constructor.
   */
  basic_seq_packet_socket& operator=(basic_seq_packet_socket&& other)
  {
    basic_socket<Protocol, SeqPacketSocketService>::operator=(
        BOOST_ASIO_MOVE_CAST(basic_seq_packet_socket)(other));
    return *this;
  }

  /// Move-construct a basic_seq_packet_socket from a socket of another protocol
  /// type.
  /**
   * This constructor moves a sequenced packet socket from one object to
   * another.
   *
   * @param other The other basic_seq_packet_socket object from which the move
   * will occur.
   *
   * @note Following the move, the moved-from object is in the same state as if
   * constructed using the @c basic_seq_packet_socket(io_service&) constructor.
   */
  template <typename Protocol1, typename SeqPacketSocketService1>
  basic_seq_packet_socket(
      basic_seq_packet_socket<Protocol1, SeqPacketSocketService1>&& other,
      typename enable_if<is_convertible<Protocol1, Protocol>::value>::type* = 0)
    : basic_socket<Protocol, SeqPacketSocketService>(
        BOOST_ASIO_MOVE_CAST2(basic_seq_packet_socket<
          Protocol1, SeqPacketSocketService1>)(other))
  {
  }

  /// Move-assign a basic_seq_packet_socket from a socket of another protocol
  /// type.
  /**
   * This assignment operator moves a sequenced packet socket from one object to
   * another.
   *
   * @param other The other basic_seq_packet_socket object from which the move
   * will occur.
   *
   * @note Following the move, the moved-from object is in the same state as if
   * constructed using the @c basic_seq_packet_socket(io_service&) constructor.
   */
  template <typename Protocol1, typename SeqPacketSocketService1>
  typename enable_if<is_convertible<Protocol1, Protocol>::value,
      basic_seq_packet_socket>::type& operator=(
        basic_seq_packet_socket<Protocol1, SeqPacketSocketService1>&& other)
  {
    basic_socket<Protocol, SeqPacketSocketService>::operator=(
        BOOST_ASIO_MOVE_CAST2(basic_seq_packet_socket<
          Protocol1, SeqPacketSocketService1>)(other));
    return *this;
  }
#endif // defined(BOOST_ASIO_HAS_MOVE) || defined(GENERATING_DOCUMENTATION)

  /// Send some data on the socket.
  /**
   * This function is used to send data on the sequenced packet socket. The
   * function call will block until the data has been sent successfully, or an
   * until error occurs.
   *
   * @param buffers One or more data buffers to be sent on the socket.
   *
   * @param flags Flags specifying how the send call is to be made.
   *
   * @returns The number of bytes sent.
   *
   * @throws boost::system::system_error Thrown on failure.
   *
   * @par Example
   * To send a single data buffer use the @ref buffer function as follows:
   * @code
   * socket.send(boost::asio::buffer(data, size), 0);
   * @endcode
   * See the @ref buffer documentation for information on sending multiple
   * buffers in one go, and how to use it with arrays, boost::array or
   * std::vector.
   */
  template <typename ConstBufferSequence>
  std::size_t send(const ConstBufferSequence& buffers,
      socket_base::message_flags flags)
  {
    boost::system::error_code ec;
    std::size_t s = this->get_service().send(
        this->get_implementation(), buffers, flags, ec);
    boost::asio::detail::throw_error(ec, "send");
    return s;
  }

  /// Send some data on the socket.
  /**
   * This function is used to send data on the sequenced packet socket. The
   * function call will block the data has been sent successfully, or an until
   * error occurs.
   *
   * @param buffers One or more data buffers to be sent on the socket.
   *
   * @param flags Flags specifying how the send call is to be made.
   *
   * @param ec Set to indicate what error occurred, if any.
   *
   * @returns The number of bytes sent. Returns 0 if an error occurred.
   *
   * @note The send operation may not transmit all of the data to the peer.
   * Consider using the @ref write function if you need to ensure that all data
   * is written before the blocking operation completes.
   */
  template <typename ConstBufferSequence>
  std::size_t send(const ConstBufferSequence& buffers,
      socket_base::message_flags flags, boost::system::error_code& ec)
  {
    return this->get_service().send(
        this->get_implementation(), buffers, flags, ec);
  }

  /// Start an asynchronous send.
  /**
   * This function is used to asynchronously send data on the sequenced packet
   * socket. The function call always returns immediately.
   *
   * @param buffers One or more data buffers to be sent on the socket. Although
   * the buffers object may be copied as necessary, ownership of the underlying
   * memory blocks is retained by the caller, which must guarantee that they
   * remain valid until the handler is called.
   *
   * @param flags Flags specifying how the send call is to be made.
   *
   * @param handler The handler to be called when the send operation completes.
   * Copies will be made of the handler as required. The function signature of
   * the handler must be:
   * @code void handler(
   *   const boost::system::error_code& error, // Result of operation.
   *   std::size_t bytes_transferred           // Number of bytes sent.
   * ); @endcode
   * Regardless of whether the asynchronous operation completes immediately or
   * not, the handler will not be invoked from within this function. Invocation
   * of the handler will be performed in a manner equivalent to using
   * boost::asio::io_service::post().
   *
   * @par Example
   * To send a single data buffer use the @ref buffer function as follows:
   * @code
   * socket.async_send(boost::asio::buffer(data, size), 0, handler);
   * @endcode
   * See the @ref buffer documentation for information on sending multiple
   * buffers in one go, and how to use it with arrays, boost::array or
   * std::vector.
   */
  template <typename ConstBufferSequence, typename WriteHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(WriteHandler,
      void (boost::system::error_code, std::size_t))
  async_send(const ConstBufferSequence& buffers,
      socket_base::message_flags flags,
      BOOST_ASIO_MOVE_ARG(WriteHandler) handler)
  {
    // If you get an error on the following line it means that your handler does
    // not meet the documented type requirements for a WriteHandler.
    BOOST_ASIO_WRITE_HANDLER_CHECK(WriteHandler, handler) type_check;

    return this->get_service().async_send(this->get_implementation(),
        buffers, flags, BOOST_ASIO_MOVE_CAST(WriteHandler)(handler));
  }

  /// Receive some data on the socket.
  /**
   * This function is used to receive data on the sequenced packet socket. The
   * function call will block until data has been received successfully, or
   * until an error occurs.
   *
   * @param buffers One or more buffers into which the data will be received.
   *
   * @param out_flags After the receive call completes, contains flags
   * associated with the received data. For example, if the
   * socket_base::message_end_of_record bit is set then the received data marks
   * the end of a record.
   *
   * @returns The number of bytes received.
   *
   * @throws boost::system::system_error Thrown on failure. An error code of
   * boost::asio::error::eof indicates that the connection was closed by the
   * peer.
   *
   * @par Example
   * To receive into a single data buffer use the @ref buffer function as
   * follows:
   * @code
   * socket.receive(boost::asio::buffer(data, size), out_flags);
   * @endcode
   * See the @ref buffer documentation for information on receiving into
   * multiple buffers in one go, and how to use it with arrays, boost::array or
   * std::vector.
   */
  template <typename MutableBufferSequence>
  std::size_t receive(const MutableBufferSequence& buffers,
      socket_base::message_flags& out_flags)
  {
    boost::system::error_code ec;
    std::size_t s = this->get_service().receive(
        this->get_implementation(), buffers, 0, out_flags, ec);
    boost::asio::detail::throw_error(ec, "receive");
    return s;
  }

  /// Receive some data on the socket.
  /**
   * This function is used to receive data on the sequenced packet socket. The
   * function call will block until data has been received successfully, or
   * until an error occurs.
   *
   * @param buffers One or more buffers into which the data will be received.
   *
   * @param in_flags Flags specifying how the receive call is to be made.
   *
   * @param out_flags After the receive call completes, contains flags
   * associated with the received data. For example, if the
   * socket_base::message_end_of_record bit is set then the received data marks
   * the end of a record.
   *
   * @returns The number of bytes received.
   *
   * @throws boost::system::system_error Thrown on failure. An error code of
   * boost::asio::error::eof indicates that the connection was closed by the
   * peer.
   *
   * @note The receive operation may not receive all of the requested number of
   * bytes. Consider using the @ref read function if you need to ensure that the
   * requested amount of data is read before the blocking operation completes.
   *
   * @par Example
   * To receive into a single data buffer use the @ref buffer function as
   * follows:
   * @code
   * socket.receive(boost::asio::buffer(data, size), 0, out_flags);
   * @endcode
   * See the @ref buffer documentation for information on receiving into
   * multiple buffers in one go, and how to use it with arrays, boost::array or
   * std::vector.
   */
  template <typename MutableBufferSequence>
  std::size_t receive(const MutableBufferSequence& buffers,
      socket_base::message_flags in_flags,
      socket_base::message_flags& out_flags)
  {
    boost::system::error_code ec;
    std::size_t s = this->get_service().receive(
        this->get_implementation(), buffers, in_flags, out_flags, ec);
    boost::asio::detail::throw_error(ec, "receive");
    return s;
  }

  /// Receive some data on a connected socket.
  /**
   * This function is used to receive data on the sequenced packet socket. The
   * function call will block until data has been received successfully, or
   * until an error occurs.
   *
   * @param buffers One or more buffers into which the data will be received.
   *
   * @param in_flags Flags specifying how the receive call is to be made.
   *
   * @param out_flags After the receive call completes, contains flags
   * associated with the received data. For example, if the
   * socket_base::message_end_of_record bit is set then the received data marks
   * the end of a record.
   *
   * @param ec Set to indicate what error occurred, if any.
   *
   * @returns The number of bytes received. Returns 0 if an error occurred.
   *
   * @note The receive operation may not receive all of the requested number of
   * bytes. Consider using the @ref read function if you need to ensure that the
   * requested amount of data is read before the blocking operation completes.
   */
  template <typename MutableBufferSequence>
  std::size_t receive(const MutableBufferSequence& buffers,
      socket_base::message_flags in_flags,
      socket_base::message_flags& out_flags, boost::system::error_code& ec)
  {
    return this->get_service().receive(this->get_implementation(),
        buffers, in_flags, out_flags, ec);
  }

  /// Start an asynchronous receive.
  /**
   * This function is used to asynchronously receive data from the sequenced
   * packet socket. The function call always returns immediately.
   *
   * @param buffers One or more buffers into which the data will be received.
   * Although the buffers object may be copied as necessary, ownership of the
   * underlying memory blocks is retained by the caller, which must guarantee
   * that they remain valid until the handler is called.
   *
   * @param out_flags Once the asynchronous operation completes, contains flags
   * associated with the received data. For example, if the
   * socket_base::message_end_of_record bit is set then the received data marks
   * the end of a record. The caller must guarantee that the referenced
   * variable remains valid until the handler is called.
   *
   * @param handler The handler to be called when the receive operation
   * completes. Copies will be made of the handler as required. The function
   * signature of the handler must be:
   * @code void handler(
   *   const boost::system::error_code& error, // Result of operation.
   *   std::size_t bytes_transferred           // Number of bytes received.
   * ); @endcode
   * Regardless of whether the asynchronous operation completes immediately or
   * not, the handler will not be invoked from within this function. Invocation
   * of the handler will be performed in a manner equivalent to using
   * boost::asio::io_service::post().
   *
   * @par Example
   * To receive into a single data buffer use the @ref buffer function as
   * follows:
   * @code
   * socket.async_receive(boost::asio::buffer(data, size), out_flags, handler);
   * @endcode
   * See the @ref buffer documentation for information on receiving into
   * multiple buffers in one go, and how to use it with arrays, boost::array or
   * std::vector.
   */
  template <typename MutableBufferSequence, typename ReadHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(ReadHandler,
      void (boost::system::error_code, std::size_t))
  async_receive(const MutableBufferSequence& buffers,
      socket_base::message_flags& out_flags,
      BOOST_ASIO_MOVE_ARG(ReadHandler) handler)
  {
    // If you get an error on the following line it means that your handler does
    // not meet the documented type requirements for a ReadHandler.
    BOOST_ASIO_READ_HANDLER_CHECK(ReadHandler, handler) type_check;

    return this->get_service().async_receive(
        this->get_implementation(), buffers, 0, out_flags,
        BOOST_ASIO_MOVE_CAST(ReadHandler)(handler));
  }

  /// Start an asynchronous receive.
  /**
   * This function is used to asynchronously receive data from the sequenced
   * data socket. The function call always returns immediately.
   *
   * @param buffers One or more buffers into which the data will be received.
   * Although the buffers object may be copied as necessary, ownership of the
   * underlying memory blocks is retained by the caller, which must guarantee
   * that they remain valid until the handler is called.
   *
   * @param in_flags Flags specifying how the receive call is to be made.
   *
   * @param out_flags Once the asynchronous operation completes, contains flags
   * associated with the received data. For example, if the
   * socket_base::message_end_of_record bit is set then the received data marks
   * the end of a record. The caller must guarantee that the referenced
   * variable remains valid until the handler is called.
   *
   * @param handler The handler to be called when the receive operation
   * completes. Copies will be made of the handler as required. The function
   * signature of the handler must be:
   * @code void handler(
   *   const boost::system::error_code& error, // Result of operation.
   *   std::size_t bytes_transferred           // Number of bytes received.
   * ); @endcode
   * Regardless of whether the asynchronous operation completes immediately or
   * not, the handler will not be invoked from within this function. Invocation
   * of the handler will be performed in a manner equivalent to using
   * boost::asio::io_service::post().
   *
   * @par Example
   * To receive into a single data buffer use the @ref buffer function as
   * follows:
   * @code
   * socket.async_receive(
   *     boost::asio::buffer(data, size),
   *     0, out_flags, handler);
   * @endcode
   * See the @ref buffer documentation for information on receiving into
   * multiple buffers in one go, and how to use it with arrays, boost::array or
   * std::vector.
   */
  template <typename MutableBufferSequence, typename ReadHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(ReadHandler,
      void (boost::system::error_code, std::size_t))
  async_receive(const MutableBufferSequence& buffers,
      socket_base::message_flags in_flags,
      socket_base::message_flags& out_flags,
      BOOST_ASIO_MOVE_ARG(ReadHandler) handler)
  {
    // If you get an error on the following line it means that your handler does
    // not meet the documented type requirements for a ReadHandler.
    BOOST_ASIO_READ_HANDLER_CHECK(ReadHandler, handler) type_check;

    return this->get_service().async_receive(
        this->get_implementation(), buffers, in_flags, out_flags,
        BOOST_ASIO_MOVE_CAST(ReadHandler)(handler));
  }
};

} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_BASIC_SEQ_PACKET_SOCKET_HPP

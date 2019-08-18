//
// ssl/old/detail/openssl_operation.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2005 Voipster / Indrek dot Juhani at voipster dot com
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_SSL_OLD_DETAIL_OPENSSL_OPERATION_HPP
#define BOOST_ASIO_SSL_OLD_DETAIL_OPENSSL_OPERATION_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <boost/function.hpp>
#include <boost/bind.hpp>
#include <boost/asio/buffer.hpp>
#include <boost/asio/detail/assert.hpp>
#include <boost/asio/detail/socket_ops.hpp>
#include <boost/asio/placeholders.hpp>
#include <boost/asio/ssl/detail/openssl_types.hpp>
#include <boost/asio/ssl/error.hpp>
#include <boost/asio/strand.hpp>
#include <boost/system/system_error.hpp>
#include <boost/asio/write.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace ssl {
namespace old {
namespace detail {

typedef boost::function<int (::SSL*)> ssl_primitive_func; 
typedef boost::function<void (const boost::system::error_code&, int)>
  user_handler_func;

// Network send_/recv buffer implementation
//
//
class net_buffer
{
  static const int  NET_BUF_SIZE = 16*1024 + 256; // SSL record size + spare

  unsigned char buf_[NET_BUF_SIZE];
  unsigned char* data_start_;
  unsigned char* data_end_;

public:
  net_buffer()
  {
    data_start_ = data_end_ = buf_;
  }
  unsigned char* get_unused_start() { return data_end_; }
  unsigned char* get_data_start() { return data_start_; }
  size_t get_unused_len() { return (NET_BUF_SIZE - (data_end_ - buf_)); }    
  size_t get_data_len() { return (data_end_ - data_start_); }    
  void data_added(size_t count)
  { 
    data_end_ += count; 
    data_end_ = data_end_ > (buf_ + NET_BUF_SIZE)? 
      (buf_ + NET_BUF_SIZE):
      data_end_; 
  }
  void data_removed(size_t count) 
  { 
    data_start_ += count; 
    if (data_start_ >= data_end_) reset(); 
  }
  void reset() { data_start_ = buf_; data_end_ = buf_; }               
  bool has_data() { return (data_start_ < data_end_); }
}; // class net_buffer

//
// Operation class
//
//
template <typename Stream>
class openssl_operation
{
public:

  // Constructor for asynchronous operations
  openssl_operation(ssl_primitive_func primitive,
                    Stream& socket,
                    net_buffer& recv_buf,
                    SSL* session,
                    BIO* ssl_bio,
                    user_handler_func  handler,
                    boost::asio::io_service::strand& strand
                    )
    : primitive_(primitive)
    , user_handler_(handler)
    , strand_(&strand)
    , recv_buf_(recv_buf)
    , socket_(socket)
    , ssl_bio_(ssl_bio)
    , session_(session)
  {
    write_ = boost::bind(
      &openssl_operation::do_async_write, 
      this, boost::arg<1>(), boost::arg<2>()
    );
    read_ = boost::bind(
      &openssl_operation::do_async_read, 
      this
    );
    handler_= boost::bind(
      &openssl_operation::async_user_handler, 
      this, boost::arg<1>(), boost::arg<2>()
    );
  }

  // Constructor for synchronous operations
  openssl_operation(ssl_primitive_func primitive,
                    Stream& socket,
                    net_buffer& recv_buf,
                    SSL* session,
                    BIO* ssl_bio)
    : primitive_(primitive)
    , strand_(0)
    , recv_buf_(recv_buf)
    , socket_(socket)
    , ssl_bio_(ssl_bio)
    , session_(session)
  {      
    write_ = boost::bind(
      &openssl_operation::do_sync_write, 
      this, boost::arg<1>(), boost::arg<2>()
    );
    read_ = boost::bind(
      &openssl_operation::do_sync_read, 
      this
    );
    handler_ = boost::bind(
      &openssl_operation::sync_user_handler, 
      this, boost::arg<1>(), boost::arg<2>()
      );
  }

  // Start operation
  // In case of asynchronous it returns 0, in sync mode returns success code
  // or throws an error...
  int start()
  {
    int rc = primitive_( session_ );

    bool is_operation_done = (rc > 0);  
                // For connect/accept/shutdown, the operation
                // is done, when return code is 1
                // for write, it is done, when is retcode > 0
                // for read, it is done when retcode > 0

    int error_code =  !is_operation_done ?
          ::SSL_get_error( session_, rc ) :
          0;        
    int sys_error_code = ERR_get_error();

    if (error_code == SSL_ERROR_SSL)
      return handler_(boost::system::error_code(
            sys_error_code, boost::asio::error::get_ssl_category()), rc);

    bool is_read_needed = (error_code == SSL_ERROR_WANT_READ);
    bool is_write_needed = (error_code == SSL_ERROR_WANT_WRITE ||
                              ::BIO_ctrl_pending( ssl_bio_ ));
    bool is_shut_down_received = 
      ((::SSL_get_shutdown( session_ ) & SSL_RECEIVED_SHUTDOWN) == 
          SSL_RECEIVED_SHUTDOWN);
    bool is_shut_down_sent = 
      ((::SSL_get_shutdown( session_ ) & SSL_SENT_SHUTDOWN) ==
            SSL_SENT_SHUTDOWN);

    if (is_shut_down_sent && is_shut_down_received
        && is_operation_done && !is_write_needed)
      // SSL connection is shut down cleanly
      return handler_(boost::system::error_code(), 1);

    if (is_shut_down_received && !is_operation_done)
      // Shutdown has been requested, while we were reading or writing...
      // abort our action...
      return handler_(boost::asio::error::shut_down, 0);

    if (!is_operation_done && !is_read_needed && !is_write_needed 
      && !is_shut_down_sent)
    {
      // The operation has failed... It is not completed and does 
      // not want network communication nor does want to send shutdown out...
      if (error_code == SSL_ERROR_SYSCALL)
      {
        return handler_(boost::system::error_code(
              sys_error_code, boost::asio::error::system_category), rc); 
      }
      else
      {
        return handler_(boost::system::error_code(
              sys_error_code, boost::asio::error::get_ssl_category()), rc); 
      }
    }

    if (!is_operation_done && !is_write_needed)
    {
      // We may have left over data that we can pass to SSL immediately
      if (recv_buf_.get_data_len() > 0)
      {
        // Pass the buffered data to SSL
        int written = ::BIO_write
        ( 
          ssl_bio_, 
          recv_buf_.get_data_start(), 
          recv_buf_.get_data_len() 
        );

        if (written > 0)
        {
          recv_buf_.data_removed(written);
        }
        else if (written < 0)
        {
          if (!BIO_should_retry(ssl_bio_))
          {
            // Some serios error with BIO....
            return handler_(boost::asio::error::no_recovery, 0);
          }
        }

        return start();
      }
      else if (is_read_needed || (is_shut_down_sent && !is_shut_down_received))
      {
        return read_();
      }
    }

    // Continue with operation, flush any SSL data out to network...
    return write_(is_operation_done, rc); 
  }

// Private implementation
private:
  typedef boost::function<int (const boost::system::error_code&, int)>
    int_handler_func;
  typedef boost::function<int (bool, int)> write_func;
  typedef boost::function<int ()> read_func;

  ssl_primitive_func  primitive_;
  user_handler_func  user_handler_;
  boost::asio::io_service::strand* strand_;
  write_func  write_;
  read_func  read_;
  int_handler_func handler_;
    
  net_buffer send_buf_; // buffers for network IO

  // The recv buffer is owned by the stream, not the operation, since there can
  // be left over bytes after passing the data up to the application, and these
  // bytes need to be kept around for the next read operation issued by the
  // application.
  net_buffer& recv_buf_;

  Stream& socket_;
  BIO*    ssl_bio_;
  SSL*    session_;

  //
  int sync_user_handler(const boost::system::error_code& error, int rc)
  {
    if (!error)
      return rc;

    throw boost::system::system_error(error);
  }
    
  int async_user_handler(boost::system::error_code error, int rc)
  {
    if (rc < 0)
    {
      if (!error)
        error = boost::asio::error::no_recovery;
      rc = 0;
    }

    user_handler_(error, rc);
    return 0;
  }

  // Writes bytes asynchronously from SSL to NET
  int  do_async_write(bool is_operation_done, int rc) 
  {
    int len = ::BIO_ctrl_pending( ssl_bio_ );
    if ( len )
    { 
      // There is something to write into net, do it...
      len = (int)send_buf_.get_unused_len() > len? 
        len: 
        send_buf_.get_unused_len();
        
      if (len == 0)
      {
        // In case our send buffer is full, we have just to wait until 
        // previous send to complete...
        return 0;
      }

      // Read outgoing data from bio
      len = ::BIO_read( ssl_bio_, send_buf_.get_unused_start(), len); 
         
      if (len > 0)
      {
        unsigned char *data_start = send_buf_.get_unused_start();
        send_buf_.data_added(len);
 
        BOOST_ASIO_ASSERT(strand_);
        boost::asio::async_write
        ( 
          socket_, 
          boost::asio::buffer(data_start, len),
          strand_->wrap
          (
            boost::bind
            (
              &openssl_operation::async_write_handler, 
              this, 
              is_operation_done,
              rc, 
              boost::asio::placeholders::error, 
              boost::asio::placeholders::bytes_transferred
            )
          )
        );
                  
        return 0;
      }
      else if (!BIO_should_retry(ssl_bio_))
      {
        // Seems like fatal error
        // reading from SSL BIO has failed...
        handler_(boost::asio::error::no_recovery, 0);
        return 0;
      }
    }
    
    if (is_operation_done)
    {
      // Finish the operation, with success
      handler_(boost::system::error_code(), rc);
      return 0;
    }
    
    // OPeration is not done and writing to net has been made...
    // start operation again
    start();
          
    return 0;
  }

  void async_write_handler(bool is_operation_done, int rc, 
    const boost::system::error_code& error, size_t bytes_sent)
  {
    if (!error)
    {
      // Remove data from send buffer
      send_buf_.data_removed(bytes_sent);

      if (is_operation_done)
        handler_(boost::system::error_code(), rc);
      else
        // Since the operation was not completed, try it again...
        start();
    }
    else 
      handler_(error, rc);
  }

  int do_async_read()
  {
    // Wait for new data
    BOOST_ASIO_ASSERT(strand_);
    socket_.async_read_some
    ( 
      boost::asio::buffer(recv_buf_.get_unused_start(),
        recv_buf_.get_unused_len()),
      strand_->wrap
      (
        boost::bind
        (
          &openssl_operation::async_read_handler, 
          this, 
          boost::asio::placeholders::error, 
          boost::asio::placeholders::bytes_transferred
        )
      )
    );
    return 0;
  }

  void async_read_handler(const boost::system::error_code& error,
      size_t bytes_recvd)
  {
    if (!error)
    {
      recv_buf_.data_added(bytes_recvd);

      // Pass the received data to SSL
      int written = ::BIO_write
      ( 
        ssl_bio_, 
        recv_buf_.get_data_start(), 
        recv_buf_.get_data_len() 
      );

      if (written > 0)
      {
        recv_buf_.data_removed(written);
      }
      else if (written < 0)
      {
        if (!BIO_should_retry(ssl_bio_))
        {
          // Some serios error with BIO....
          handler_(boost::asio::error::no_recovery, 0);
          return;
        }
      }

      // and try the SSL primitive again
      start();
    }
    else
    {
      // Error in network level...
      // SSL can't continue either...
      handler_(error, 0);
    }
  }

  // Syncronous functions...
  int do_sync_write(bool is_operation_done, int rc)
  {
    int len = ::BIO_ctrl_pending( ssl_bio_ );
    if ( len )
    { 
      // There is something to write into net, do it...
      len = (int)send_buf_.get_unused_len() > len? 
        len: 
        send_buf_.get_unused_len();
        
      // Read outgoing data from bio
      len = ::BIO_read( ssl_bio_, send_buf_.get_unused_start(), len); 
         
      if (len > 0)
      {
        size_t sent_len = boost::asio::write( 
                  socket_, 
                  boost::asio::buffer(send_buf_.get_unused_start(), len)
                  );

        send_buf_.data_added(len);
        send_buf_.data_removed(sent_len);
      }          
      else if (!BIO_should_retry(ssl_bio_))
      {
        // Seems like fatal error
        // reading from SSL BIO has failed...
        throw boost::system::system_error(boost::asio::error::no_recovery);
      }
    }
    
    if (is_operation_done)
      // Finish the operation, with success
      return rc;
                
    // Operation is not finished, start again.
    return start();
  }

  int do_sync_read()
  {
    size_t len = socket_.read_some
      ( 
        boost::asio::buffer(recv_buf_.get_unused_start(),
          recv_buf_.get_unused_len())
      );

    // Write data to ssl
    recv_buf_.data_added(len);

    // Pass the received data to SSL
    int written = ::BIO_write
    ( 
      ssl_bio_, 
      recv_buf_.get_data_start(), 
      recv_buf_.get_data_len() 
    );

    if (written > 0)
    {
      recv_buf_.data_removed(written);
    }
    else if (written < 0)
    {
      if (!BIO_should_retry(ssl_bio_))
      {
        // Some serios error with BIO....
        throw boost::system::system_error(boost::asio::error::no_recovery);
      }
    }

    // Try the operation again
    return start();
  }
}; // class openssl_operation

} // namespace detail
} // namespace old
} // namespace ssl
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_SSL_OLD_DETAIL_OPENSSL_OPERATION_HPP

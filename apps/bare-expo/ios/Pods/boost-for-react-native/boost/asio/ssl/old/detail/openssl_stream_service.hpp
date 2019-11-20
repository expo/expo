//
// ssl/old/detail/stream_service.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2005 Voipster / Indrek dot Juhani at voipster dot com
// Copyright (c) 2005-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_SSL_OLD_DETAIL_OPENSSL_STREAM_SERVICE_HPP
#define BOOST_ASIO_SSL_OLD_DETAIL_OPENSSL_STREAM_SERVICE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <cstddef>
#include <climits>
#include <memory>
#include <boost/config.hpp>
#include <boost/noncopyable.hpp>
#include <boost/function.hpp>
#include <boost/bind.hpp>
#include <boost/asio/detail/buffer_sequence_adapter.hpp>
#include <boost/asio/error.hpp>
#include <boost/asio/io_service.hpp>
#include <boost/asio/ssl/basic_context.hpp>
#include <boost/asio/ssl/stream_base.hpp>
#include <boost/asio/ssl/old/detail/openssl_operation.hpp>
#include <boost/asio/ssl/detail/openssl_types.hpp>
#include <boost/asio/strand.hpp>
#include <boost/system/system_error.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace ssl {
namespace old {
namespace detail {

class openssl_stream_service
  : public boost::asio::detail::service_base<openssl_stream_service>
{
private:
  enum { max_buffer_size = INT_MAX };

  //Base handler for asyncrhonous operations
  template <typename Stream>
  class base_handler
  {
  public:
    typedef boost::function<
      void (const boost::system::error_code&, size_t)> func_t;

    base_handler(boost::asio::io_service& io_service)
      : op_(NULL)
      , io_service_(io_service)
      , work_(io_service)
    {}
    
    void do_func(const boost::system::error_code& error, size_t size)
    {
      func_(error, size);
    }
        
    void set_operation(openssl_operation<Stream>* op) { op_ = op; }
    void set_func(func_t func) { func_ = func; }

    ~base_handler()
    {
      delete op_;
    }

  private:
    func_t func_;
    openssl_operation<Stream>* op_;
    boost::asio::io_service& io_service_;
    boost::asio::io_service::work work_;
  };  // class base_handler

  // Handler for asynchronous IO (write/read) operations
  template<typename Stream, typename Handler>
  class io_handler 
    : public base_handler<Stream>
  {
  public:
    io_handler(Handler handler, boost::asio::io_service& io_service)
      : base_handler<Stream>(io_service)
      , handler_(handler)
    {
      this->set_func(boost::bind(
        &io_handler<Stream, Handler>::handler_impl, 
        this, boost::arg<1>(), boost::arg<2>() ));
    }

  private:
    Handler handler_;
    void handler_impl(const boost::system::error_code& error, size_t size)
    {
      std::auto_ptr<io_handler<Stream, Handler> > this_ptr(this);
      handler_(error, size);
    }
  };  // class io_handler 

  // Handler for asyncrhonous handshake (connect, accept) functions
  template <typename Stream, typename Handler>
  class handshake_handler
    : public base_handler<Stream>
  {
  public:
    handshake_handler(Handler handler, boost::asio::io_service& io_service)
      : base_handler<Stream>(io_service)
      , handler_(handler)
    {
      this->set_func(boost::bind(
        &handshake_handler<Stream, Handler>::handler_impl, 
        this, boost::arg<1>(), boost::arg<2>() ));
    }

  private:
    Handler handler_;
    void handler_impl(const boost::system::error_code& error, size_t)
    {
      std::auto_ptr<handshake_handler<Stream, Handler> > this_ptr(this);
      handler_(error);
    }

  };  // class handshake_handler

  // Handler for asyncrhonous shutdown
  template <typename Stream, typename Handler>
  class shutdown_handler
    : public base_handler<Stream>
  {
  public:
    shutdown_handler(Handler handler, boost::asio::io_service& io_service)
      : base_handler<Stream>(io_service),
        handler_(handler)
    { 
      this->set_func(boost::bind(
        &shutdown_handler<Stream, Handler>::handler_impl, 
        this, boost::arg<1>(), boost::arg<2>() ));
    }

  private:
    Handler handler_;
    void handler_impl(const boost::system::error_code& error, size_t)
    {
      std::auto_ptr<shutdown_handler<Stream, Handler> > this_ptr(this);
      handler_(error);
    }
  };  // class shutdown_handler

public:
  // The implementation type.
  typedef struct impl_struct
  {
    ::SSL* ssl;
    ::BIO* ext_bio;
    net_buffer recv_buf;
  } * impl_type;

  // Construct a new stream socket service for the specified io_service.
  explicit openssl_stream_service(boost::asio::io_service& io_service)
    : boost::asio::detail::service_base<openssl_stream_service>(io_service),
      strand_(io_service)
  {
  }

  // Destroy all user-defined handler objects owned by the service.
  void shutdown_service()
  {
  }

  // Return a null stream implementation.
  impl_type null() const
  {
    return 0;
  }

  // Create a new stream implementation.
  template <typename Stream, typename Context_Service>
  void create(impl_type& impl, Stream& /*next_layer*/,
      basic_context<Context_Service>& context)
  {
    impl = new impl_struct;
    impl->ssl = ::SSL_new(context.impl());
    ::SSL_set_mode(impl->ssl, SSL_MODE_ENABLE_PARTIAL_WRITE);
    ::SSL_set_mode(impl->ssl, SSL_MODE_ACCEPT_MOVING_WRITE_BUFFER);
    ::BIO* int_bio = 0;
    impl->ext_bio = 0;
    ::BIO_new_bio_pair(&int_bio, 8192, &impl->ext_bio, 8192);
    ::SSL_set_bio(impl->ssl, int_bio, int_bio);
  }

  // Destroy a stream implementation.
  template <typename Stream>
  void destroy(impl_type& impl, Stream& /*next_layer*/)
  {
    if (impl != 0)
    {
      ::BIO_free(impl->ext_bio);
      ::SSL_free(impl->ssl);
      delete impl;
      impl = 0;
    }
  }

  // Perform SSL handshaking.
  template <typename Stream>
  boost::system::error_code handshake(impl_type& impl, Stream& next_layer,
      stream_base::handshake_type type, boost::system::error_code& ec)
  {
    try
    {
      openssl_operation<Stream> op(
        type == stream_base::client ?
          &ssl_wrap<mutex_type>::SSL_connect:
          &ssl_wrap<mutex_type>::SSL_accept,
        next_layer,
        impl->recv_buf,
        impl->ssl,
        impl->ext_bio);
      op.start();
    }
    catch (boost::system::system_error& e)
    {
      ec = e.code();
      return ec;
    }

    ec = boost::system::error_code();
    return ec;
  }

  // Start an asynchronous SSL handshake.
  template <typename Stream, typename Handler>
  void async_handshake(impl_type& impl, Stream& next_layer,
      stream_base::handshake_type type, Handler handler)
  {
    typedef handshake_handler<Stream, Handler> connect_handler;

    connect_handler* local_handler = 
      new connect_handler(handler, get_io_service());

    openssl_operation<Stream>* op = new openssl_operation<Stream>
    (
      type == stream_base::client ?
        &ssl_wrap<mutex_type>::SSL_connect:
        &ssl_wrap<mutex_type>::SSL_accept,
      next_layer,
      impl->recv_buf,
      impl->ssl,
      impl->ext_bio,
      boost::bind
      (
        &base_handler<Stream>::do_func, 
        local_handler,
        boost::arg<1>(),
        boost::arg<2>()
      ),
      strand_
    );
    local_handler->set_operation(op);

    strand_.post(boost::bind(&openssl_operation<Stream>::start, op));
  }

  // Shut down SSL on the stream.
  template <typename Stream>
  boost::system::error_code shutdown(impl_type& impl, Stream& next_layer,
      boost::system::error_code& ec)
  {
    try
    {
      openssl_operation<Stream> op(
        &ssl_wrap<mutex_type>::SSL_shutdown,
        next_layer,
        impl->recv_buf,
        impl->ssl,
        impl->ext_bio);
      op.start();
    }
    catch (boost::system::system_error& e)
    {
      ec = e.code();
      return ec;
    }

    ec = boost::system::error_code();
    return ec;
  }

  // Asynchronously shut down SSL on the stream.
  template <typename Stream, typename Handler>
  void async_shutdown(impl_type& impl, Stream& next_layer, Handler handler)
  {
    typedef shutdown_handler<Stream, Handler> disconnect_handler;

    disconnect_handler* local_handler = 
      new disconnect_handler(handler, get_io_service());

    openssl_operation<Stream>* op = new openssl_operation<Stream>
    (
      &ssl_wrap<mutex_type>::SSL_shutdown,
      next_layer,
      impl->recv_buf,
      impl->ssl,
      impl->ext_bio,
      boost::bind
      (
        &base_handler<Stream>::do_func, 
        local_handler, 
        boost::arg<1>(),
        boost::arg<2>()
      ),
      strand_
    );
    local_handler->set_operation(op);

    strand_.post(boost::bind(&openssl_operation<Stream>::start, op));        
  }

  // Write some data to the stream.
  template <typename Stream, typename Const_Buffers>
  std::size_t write_some(impl_type& impl, Stream& next_layer,
      const Const_Buffers& buffers, boost::system::error_code& ec)
  {
    size_t bytes_transferred = 0;
    try
    {
      boost::asio::const_buffer buffer =
        boost::asio::detail::buffer_sequence_adapter<
          boost::asio::const_buffer, Const_Buffers>::first(buffers);

      std::size_t buffer_size = boost::asio::buffer_size(buffer);
      if (buffer_size > max_buffer_size)
        buffer_size = max_buffer_size;
      else if (buffer_size == 0)
      {
        ec = boost::system::error_code();
        return 0;
      }

      boost::function<int (SSL*)> send_func =
        boost::bind(boost::type<int>(), &::SSL_write, boost::arg<1>(),  
            boost::asio::buffer_cast<const void*>(buffer),
            static_cast<int>(buffer_size));
      openssl_operation<Stream> op(
        send_func,
        next_layer,
        impl->recv_buf,
        impl->ssl,
        impl->ext_bio
      );
      bytes_transferred = static_cast<size_t>(op.start());
    }
    catch (boost::system::system_error& e)
    {
      ec = e.code();
      return 0;
    }

    ec = boost::system::error_code();
    return bytes_transferred;
  }

  // Start an asynchronous write.
  template <typename Stream, typename Const_Buffers, typename Handler>
  void async_write_some(impl_type& impl, Stream& next_layer,
      const Const_Buffers& buffers, Handler handler)
  {
    typedef io_handler<Stream, Handler> send_handler;

    boost::asio::const_buffer buffer =
      boost::asio::detail::buffer_sequence_adapter<
        boost::asio::const_buffer, Const_Buffers>::first(buffers);

    std::size_t buffer_size = boost::asio::buffer_size(buffer);
    if (buffer_size > max_buffer_size)
      buffer_size = max_buffer_size;
    else if (buffer_size == 0)
    {
      get_io_service().post(boost::asio::detail::bind_handler(
            handler, boost::system::error_code(), 0));
      return;
    }

    send_handler* local_handler = new send_handler(handler, get_io_service());

    boost::function<int (SSL*)> send_func =
      boost::bind(boost::type<int>(), &::SSL_write, boost::arg<1>(),
          boost::asio::buffer_cast<const void*>(buffer),
          static_cast<int>(buffer_size));

    openssl_operation<Stream>* op = new openssl_operation<Stream>
    (
      send_func,
      next_layer,
      impl->recv_buf,
      impl->ssl,
      impl->ext_bio,
      boost::bind
      (
        &base_handler<Stream>::do_func, 
        local_handler, 
        boost::arg<1>(),
        boost::arg<2>()
      ),
      strand_
    );
    local_handler->set_operation(op);

    strand_.post(boost::bind(&openssl_operation<Stream>::start, op));        
  }

  // Read some data from the stream.
  template <typename Stream, typename Mutable_Buffers>
  std::size_t read_some(impl_type& impl, Stream& next_layer,
      const Mutable_Buffers& buffers, boost::system::error_code& ec)
  {
    size_t bytes_transferred = 0;
    try
    {
      boost::asio::mutable_buffer buffer =
        boost::asio::detail::buffer_sequence_adapter<
          boost::asio::mutable_buffer, Mutable_Buffers>::first(buffers);

      std::size_t buffer_size = boost::asio::buffer_size(buffer);
      if (buffer_size > max_buffer_size)
        buffer_size = max_buffer_size;
      else if (buffer_size == 0)
      {
        ec = boost::system::error_code();
        return 0;
      }

      boost::function<int (SSL*)> recv_func =
        boost::bind(boost::type<int>(), &::SSL_read, boost::arg<1>(),
            boost::asio::buffer_cast<void*>(buffer),
            static_cast<int>(buffer_size));
      openssl_operation<Stream> op(recv_func,
        next_layer,
        impl->recv_buf,
        impl->ssl,
        impl->ext_bio
      );

      bytes_transferred = static_cast<size_t>(op.start());
    }
    catch (boost::system::system_error& e)
    {
      ec = e.code();
      return 0;
    }

    ec = boost::system::error_code();
    return bytes_transferred;
  }

  // Start an asynchronous read.
  template <typename Stream, typename Mutable_Buffers, typename Handler>
  void async_read_some(impl_type& impl, Stream& next_layer,
      const Mutable_Buffers& buffers, Handler handler)
  {
    typedef io_handler<Stream, Handler> recv_handler;

    boost::asio::mutable_buffer buffer =
      boost::asio::detail::buffer_sequence_adapter<
        boost::asio::mutable_buffer, Mutable_Buffers>::first(buffers);

    std::size_t buffer_size = boost::asio::buffer_size(buffer);
    if (buffer_size > max_buffer_size)
      buffer_size = max_buffer_size;
    else if (buffer_size == 0)
    {
      get_io_service().post(boost::asio::detail::bind_handler(
            handler, boost::system::error_code(), 0));
      return;
    }

    recv_handler* local_handler = new recv_handler(handler, get_io_service());

    boost::function<int (SSL*)> recv_func =
      boost::bind(boost::type<int>(), &::SSL_read, boost::arg<1>(),
          boost::asio::buffer_cast<void*>(buffer),
          static_cast<int>(buffer_size));

    openssl_operation<Stream>* op = new openssl_operation<Stream>
    (
      recv_func,
      next_layer,
      impl->recv_buf,
      impl->ssl,
      impl->ext_bio,
      boost::bind
      (
        &base_handler<Stream>::do_func, 
        local_handler, 
        boost::arg<1>(),
        boost::arg<2>()
      ),
      strand_
    );
    local_handler->set_operation(op);

    strand_.post(boost::bind(&openssl_operation<Stream>::start, op));        
  }

  // Peek at the incoming data on the stream.
  template <typename Stream, typename Mutable_Buffers>
  std::size_t peek(impl_type& /*impl*/, Stream& /*next_layer*/,
      const Mutable_Buffers& /*buffers*/, boost::system::error_code& ec)
  {
    ec = boost::system::error_code();
    return 0;
  }

  // Determine the amount of data that may be read without blocking.
  template <typename Stream>
  std::size_t in_avail(impl_type& /*impl*/, Stream& /*next_layer*/,
      boost::system::error_code& ec)
  {
    ec = boost::system::error_code();
    return 0;
  }

private:  
  boost::asio::io_service::strand strand_;

  typedef boost::asio::detail::mutex mutex_type;
  
  template<typename Mutex>
  struct ssl_wrap
  {
    static Mutex ssl_mutex_;

    static int SSL_accept(SSL *ssl)
    {
      typename Mutex::scoped_lock lock(ssl_mutex_);
      return ::SSL_accept(ssl);
    }
  
    static int SSL_connect(SSL *ssl)
    {
      typename Mutex::scoped_lock lock(ssl_mutex_);
      return ::SSL_connect(ssl);
    }
  
    static int SSL_shutdown(SSL *ssl)
    {
      typename Mutex::scoped_lock lock(ssl_mutex_);
      return ::SSL_shutdown(ssl);  
    }    
  };  
};

template<typename Mutex>
Mutex openssl_stream_service::ssl_wrap<Mutex>::ssl_mutex_;

} // namespace detail
} // namespace old
} // namespace ssl
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_SSL_OLD_DETAIL_OPENSSL_STREAM_SERVICE_HPP

//
// impl/write.hpp
// ~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_IMPL_WRITE_HPP
#define BOOST_ASIO_IMPL_WRITE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/buffer.hpp>
#include <boost/asio/completion_condition.hpp>
#include <boost/asio/detail/array_fwd.hpp>
#include <boost/asio/detail/base_from_completion_cond.hpp>
#include <boost/asio/detail/bind_handler.hpp>
#include <boost/asio/detail/consuming_buffers.hpp>
#include <boost/asio/detail/dependent_type.hpp>
#include <boost/asio/detail/handler_alloc_helpers.hpp>
#include <boost/asio/detail/handler_cont_helpers.hpp>
#include <boost/asio/detail/handler_invoke_helpers.hpp>
#include <boost/asio/detail/handler_type_requirements.hpp>
#include <boost/asio/detail/throw_error.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {

template <typename SyncWriteStream, typename ConstBufferSequence,
    typename CompletionCondition>
std::size_t write(SyncWriteStream& s, const ConstBufferSequence& buffers,
    CompletionCondition completion_condition, boost::system::error_code& ec)
{
  ec = boost::system::error_code();
  boost::asio::detail::consuming_buffers<
    const_buffer, ConstBufferSequence> tmp(buffers);
  std::size_t total_transferred = 0;
  tmp.prepare(detail::adapt_completion_condition_result(
        completion_condition(ec, total_transferred)));
  while (tmp.begin() != tmp.end())
  {
    std::size_t bytes_transferred = s.write_some(tmp, ec);
    tmp.consume(bytes_transferred);
    total_transferred += bytes_transferred;
    tmp.prepare(detail::adapt_completion_condition_result(
          completion_condition(ec, total_transferred)));
  }
  return total_transferred;
}

template <typename SyncWriteStream, typename ConstBufferSequence>
inline std::size_t write(SyncWriteStream& s, const ConstBufferSequence& buffers)
{
  boost::system::error_code ec;
  std::size_t bytes_transferred = write(s, buffers, transfer_all(), ec);
  boost::asio::detail::throw_error(ec, "write");
  return bytes_transferred;
}

template <typename SyncWriteStream, typename ConstBufferSequence>
inline std::size_t write(SyncWriteStream& s, const ConstBufferSequence& buffers,
    boost::system::error_code& ec)
{
  return write(s, buffers, transfer_all(), ec);
}

template <typename SyncWriteStream, typename ConstBufferSequence,
    typename CompletionCondition>
inline std::size_t write(SyncWriteStream& s, const ConstBufferSequence& buffers,
    CompletionCondition completion_condition)
{
  boost::system::error_code ec;
  std::size_t bytes_transferred = write(s, buffers, completion_condition, ec);
  boost::asio::detail::throw_error(ec, "write");
  return bytes_transferred;
}

#if !defined(BOOST_ASIO_NO_IOSTREAM)

template <typename SyncWriteStream, typename Allocator,
    typename CompletionCondition>
std::size_t write(SyncWriteStream& s,
    boost::asio::basic_streambuf<Allocator>& b,
    CompletionCondition completion_condition, boost::system::error_code& ec)
{
  std::size_t bytes_transferred = write(s, b.data(), completion_condition, ec);
  b.consume(bytes_transferred);
  return bytes_transferred;
}

template <typename SyncWriteStream, typename Allocator>
inline std::size_t write(SyncWriteStream& s,
    boost::asio::basic_streambuf<Allocator>& b)
{
  boost::system::error_code ec;
  std::size_t bytes_transferred = write(s, b, transfer_all(), ec);
  boost::asio::detail::throw_error(ec, "write");
  return bytes_transferred;
}

template <typename SyncWriteStream, typename Allocator>
inline std::size_t write(SyncWriteStream& s,
    boost::asio::basic_streambuf<Allocator>& b,
    boost::system::error_code& ec)
{
  return write(s, b, transfer_all(), ec);
}

template <typename SyncWriteStream, typename Allocator,
    typename CompletionCondition>
inline std::size_t write(SyncWriteStream& s,
    boost::asio::basic_streambuf<Allocator>& b,
    CompletionCondition completion_condition)
{
  boost::system::error_code ec;
  std::size_t bytes_transferred = write(s, b, completion_condition, ec);
  boost::asio::detail::throw_error(ec, "write");
  return bytes_transferred;
}

#endif // !defined(BOOST_ASIO_NO_IOSTREAM)

namespace detail
{
  template <typename AsyncWriteStream, typename ConstBufferSequence,
      typename CompletionCondition, typename WriteHandler>
  class write_op
    : detail::base_from_completion_cond<CompletionCondition>
  {
  public:
    write_op(AsyncWriteStream& stream, const ConstBufferSequence& buffers,
        CompletionCondition completion_condition, WriteHandler& handler)
      : detail::base_from_completion_cond<
          CompletionCondition>(completion_condition),
        stream_(stream),
        buffers_(buffers),
        start_(0),
        total_transferred_(0),
        handler_(BOOST_ASIO_MOVE_CAST(WriteHandler)(handler))
    {
    }

#if defined(BOOST_ASIO_HAS_MOVE)
    write_op(const write_op& other)
      : detail::base_from_completion_cond<CompletionCondition>(other),
        stream_(other.stream_),
        buffers_(other.buffers_),
        start_(other.start_),
        total_transferred_(other.total_transferred_),
        handler_(other.handler_)
    {
    }

    write_op(write_op&& other)
      : detail::base_from_completion_cond<CompletionCondition>(other),
        stream_(other.stream_),
        buffers_(other.buffers_),
        start_(other.start_),
        total_transferred_(other.total_transferred_),
        handler_(BOOST_ASIO_MOVE_CAST(WriteHandler)(other.handler_))
    {
    }
#endif // defined(BOOST_ASIO_HAS_MOVE)

    void operator()(const boost::system::error_code& ec,
        std::size_t bytes_transferred, int start = 0)
    {
      switch (start_ = start)
      {
        case 1:
        buffers_.prepare(this->check_for_completion(ec, total_transferred_));
        for (;;)
        {
          stream_.async_write_some(buffers_,
              BOOST_ASIO_MOVE_CAST(write_op)(*this));
          return; default:
          total_transferred_ += bytes_transferred;
          buffers_.consume(bytes_transferred);
          buffers_.prepare(this->check_for_completion(ec, total_transferred_));
          if ((!ec && bytes_transferred == 0)
              || buffers_.begin() == buffers_.end())
            break;
        }

        handler_(ec, static_cast<const std::size_t&>(total_transferred_));
      }
    }

  //private:
    AsyncWriteStream& stream_;
    boost::asio::detail::consuming_buffers<
      const_buffer, ConstBufferSequence> buffers_;
    int start_;
    std::size_t total_transferred_;
    WriteHandler handler_;
  };

  template <typename AsyncWriteStream,
      typename CompletionCondition, typename WriteHandler>
  class write_op<AsyncWriteStream, boost::asio::mutable_buffers_1,
      CompletionCondition, WriteHandler>
    : detail::base_from_completion_cond<CompletionCondition>
  {
  public:
    write_op(AsyncWriteStream& stream,
        const boost::asio::mutable_buffers_1& buffers,
        CompletionCondition completion_condition,
        WriteHandler& handler)
      : detail::base_from_completion_cond<
          CompletionCondition>(completion_condition),
        stream_(stream),
        buffer_(buffers),
        start_(0),
        total_transferred_(0),
        handler_(BOOST_ASIO_MOVE_CAST(WriteHandler)(handler))
    {
    }

#if defined(BOOST_ASIO_HAS_MOVE)
    write_op(const write_op& other)
      : detail::base_from_completion_cond<CompletionCondition>(other),
        stream_(other.stream_),
        buffer_(other.buffer_),
        start_(other.start_),
        total_transferred_(other.total_transferred_),
        handler_(other.handler_)
    {
    }

    write_op(write_op&& other)
      : detail::base_from_completion_cond<CompletionCondition>(other),
        stream_(other.stream_),
        buffer_(other.buffer_),
        start_(other.start_),
        total_transferred_(other.total_transferred_),
        handler_(BOOST_ASIO_MOVE_CAST(WriteHandler)(other.handler_))
    {
    }
#endif // defined(BOOST_ASIO_HAS_MOVE)

    void operator()(const boost::system::error_code& ec,
        std::size_t bytes_transferred, int start = 0)
    {
      std::size_t n = 0;
      switch (start_ = start)
      {
        case 1:
        n = this->check_for_completion(ec, total_transferred_);
        for (;;)
        {
          stream_.async_write_some(
              boost::asio::buffer(buffer_ + total_transferred_, n),
              BOOST_ASIO_MOVE_CAST(write_op)(*this));
          return; default:
          total_transferred_ += bytes_transferred;
          if ((!ec && bytes_transferred == 0)
              || (n = this->check_for_completion(ec, total_transferred_)) == 0
              || total_transferred_ == boost::asio::buffer_size(buffer_))
            break;
        }

        handler_(ec, static_cast<const std::size_t&>(total_transferred_));
      }
    }

  //private:
    AsyncWriteStream& stream_;
    boost::asio::mutable_buffer buffer_;
    int start_;
    std::size_t total_transferred_;
    WriteHandler handler_;
  };

  template <typename AsyncWriteStream,
      typename CompletionCondition, typename WriteHandler>
  class write_op<AsyncWriteStream, boost::asio::const_buffers_1,
      CompletionCondition, WriteHandler>
    : detail::base_from_completion_cond<CompletionCondition>
  {
  public:
    write_op(AsyncWriteStream& stream,
        const boost::asio::const_buffers_1& buffers,
        CompletionCondition completion_condition,
        WriteHandler& handler)
      : detail::base_from_completion_cond<
          CompletionCondition>(completion_condition),
        stream_(stream),
        buffer_(buffers),
        start_(0),
        total_transferred_(0),
        handler_(BOOST_ASIO_MOVE_CAST(WriteHandler)(handler))
    {
    }

#if defined(BOOST_ASIO_HAS_MOVE)
    write_op(const write_op& other)
      : detail::base_from_completion_cond<CompletionCondition>(other),
        stream_(other.stream_),
        buffer_(other.buffer_),
        start_(other.start_),
        total_transferred_(other.total_transferred_),
        handler_(other.handler_)
    {
    }

    write_op(write_op&& other)
      : detail::base_from_completion_cond<CompletionCondition>(other),
        stream_(other.stream_),
        buffer_(other.buffer_),
        start_(other.start_),
        total_transferred_(other.total_transferred_),
        handler_(BOOST_ASIO_MOVE_CAST(WriteHandler)(other.handler_))
    {
    }
#endif // defined(BOOST_ASIO_HAS_MOVE)

    void operator()(const boost::system::error_code& ec,
        std::size_t bytes_transferred, int start = 0)
    {
      std::size_t n = 0;
      switch (start_ = start)
      {
        case 1:
        n = this->check_for_completion(ec, total_transferred_);
        for (;;)
        {
          stream_.async_write_some(
              boost::asio::buffer(buffer_ + total_transferred_, n),
              BOOST_ASIO_MOVE_CAST(write_op)(*this));
          return; default:
          total_transferred_ += bytes_transferred;
          if ((!ec && bytes_transferred == 0)
              || (n = this->check_for_completion(ec, total_transferred_)) == 0
              || total_transferred_ == boost::asio::buffer_size(buffer_))
            break;
        }

        handler_(ec, static_cast<const std::size_t&>(total_transferred_));
      }
    }

  //private:
    AsyncWriteStream& stream_;
    boost::asio::const_buffer buffer_;
    int start_;
    std::size_t total_transferred_;
    WriteHandler handler_;
  };

  template <typename AsyncWriteStream, typename Elem,
      typename CompletionCondition, typename WriteHandler>
  class write_op<AsyncWriteStream, boost::array<Elem, 2>,
      CompletionCondition, WriteHandler>
    : detail::base_from_completion_cond<CompletionCondition>
  {
  public:
    write_op(AsyncWriteStream& stream, const boost::array<Elem, 2>& buffers,
        CompletionCondition completion_condition, WriteHandler& handler)
      : detail::base_from_completion_cond<
          CompletionCondition>(completion_condition),
        stream_(stream),
        buffers_(buffers),
        start_(0),
        total_transferred_(0),
        handler_(BOOST_ASIO_MOVE_CAST(WriteHandler)(handler))
    {
    }

#if defined(BOOST_ASIO_HAS_MOVE)
    write_op(const write_op& other)
      : detail::base_from_completion_cond<CompletionCondition>(other),
        stream_(other.stream_),
        buffers_(other.buffers_),
        start_(other.start_),
        total_transferred_(other.total_transferred_),
        handler_(other.handler_)
    {
    }

    write_op(write_op&& other)
      : detail::base_from_completion_cond<CompletionCondition>(other),
        stream_(other.stream_),
        buffers_(other.buffers_),
        start_(other.start_),
        total_transferred_(other.total_transferred_),
        handler_(BOOST_ASIO_MOVE_CAST(WriteHandler)(other.handler_))
    {
    }
#endif // defined(BOOST_ASIO_HAS_MOVE)

    void operator()(const boost::system::error_code& ec,
        std::size_t bytes_transferred, int start = 0)
    {
      typename boost::asio::detail::dependent_type<Elem,
          boost::array<boost::asio::const_buffer, 2> >::type bufs = {{
        boost::asio::const_buffer(buffers_[0]),
        boost::asio::const_buffer(buffers_[1]) }};
      std::size_t buffer_size0 = boost::asio::buffer_size(bufs[0]);
      std::size_t buffer_size1 = boost::asio::buffer_size(bufs[1]);
      std::size_t n = 0;
      switch (start_ = start)
      {
        case 1:
        n = this->check_for_completion(ec, total_transferred_);
        for (;;)
        {
          bufs[0] = boost::asio::buffer(bufs[0] + total_transferred_, n);
          bufs[1] = boost::asio::buffer(
              bufs[1] + (total_transferred_ < buffer_size0
                ? 0 : total_transferred_ - buffer_size0),
              n - boost::asio::buffer_size(bufs[0]));
          stream_.async_write_some(bufs, BOOST_ASIO_MOVE_CAST(write_op)(*this));
          return; default:
          total_transferred_ += bytes_transferred;
          if ((!ec && bytes_transferred == 0)
              || (n = this->check_for_completion(ec, total_transferred_)) == 0
              || total_transferred_ == buffer_size0 + buffer_size1)
            break;
        }

        handler_(ec, static_cast<const std::size_t&>(total_transferred_));
      }
    }

  //private:
    AsyncWriteStream& stream_;
    boost::array<Elem, 2> buffers_;
    int start_;
    std::size_t total_transferred_;
    WriteHandler handler_;
  };

#if defined(BOOST_ASIO_HAS_STD_ARRAY)

  template <typename AsyncWriteStream, typename Elem,
      typename CompletionCondition, typename WriteHandler>
  class write_op<AsyncWriteStream, std::array<Elem, 2>,
      CompletionCondition, WriteHandler>
    : detail::base_from_completion_cond<CompletionCondition>
  {
  public:
    write_op(AsyncWriteStream& stream, const std::array<Elem, 2>& buffers,
        CompletionCondition completion_condition, WriteHandler& handler)
      : detail::base_from_completion_cond<
          CompletionCondition>(completion_condition),
        stream_(stream),
        buffers_(buffers),
        start_(0),
        total_transferred_(0),
        handler_(BOOST_ASIO_MOVE_CAST(WriteHandler)(handler))
    {
    }

#if defined(BOOST_ASIO_HAS_MOVE)
    write_op(const write_op& other)
      : detail::base_from_completion_cond<CompletionCondition>(other),
        stream_(other.stream_),
        buffers_(other.buffers_),
        start_(other.start_),
        total_transferred_(other.total_transferred_),
        handler_(other.handler_)
    {
    }

    write_op(write_op&& other)
      : detail::base_from_completion_cond<CompletionCondition>(other),
        stream_(other.stream_),
        buffers_(other.buffers_),
        start_(other.start_),
        total_transferred_(other.total_transferred_),
        handler_(BOOST_ASIO_MOVE_CAST(WriteHandler)(other.handler_))
    {
    }
#endif // defined(BOOST_ASIO_HAS_MOVE)

    void operator()(const boost::system::error_code& ec,
        std::size_t bytes_transferred, int start = 0)
    {
      typename boost::asio::detail::dependent_type<Elem,
          std::array<boost::asio::const_buffer, 2> >::type bufs = {{
        boost::asio::const_buffer(buffers_[0]),
        boost::asio::const_buffer(buffers_[1]) }};
      std::size_t buffer_size0 = boost::asio::buffer_size(bufs[0]);
      std::size_t buffer_size1 = boost::asio::buffer_size(bufs[1]);
      std::size_t n = 0;
      switch (start_ = start)
      {
        case 1:
        n = this->check_for_completion(ec, total_transferred_);
        for (;;)
        {
          bufs[0] = boost::asio::buffer(bufs[0] + total_transferred_, n);
          bufs[1] = boost::asio::buffer(
              bufs[1] + (total_transferred_ < buffer_size0
                ? 0 : total_transferred_ - buffer_size0),
              n - boost::asio::buffer_size(bufs[0]));
          stream_.async_write_some(bufs, BOOST_ASIO_MOVE_CAST(write_op)(*this));
          return; default:
          total_transferred_ += bytes_transferred;
          if ((!ec && bytes_transferred == 0)
              || (n = this->check_for_completion(ec, total_transferred_)) == 0
              || total_transferred_ == buffer_size0 + buffer_size1)
            break;
        }

        handler_(ec, static_cast<const std::size_t&>(total_transferred_));
      }
    }

  //private:
    AsyncWriteStream& stream_;
    std::array<Elem, 2> buffers_;
    int start_;
    std::size_t total_transferred_;
    WriteHandler handler_;
  };

#endif // defined(BOOST_ASIO_HAS_STD_ARRAY)

  template <typename AsyncWriteStream, typename ConstBufferSequence,
      typename CompletionCondition, typename WriteHandler>
  inline void* asio_handler_allocate(std::size_t size,
      write_op<AsyncWriteStream, ConstBufferSequence,
        CompletionCondition, WriteHandler>* this_handler)
  {
    return boost_asio_handler_alloc_helpers::allocate(
        size, this_handler->handler_);
  }

  template <typename AsyncWriteStream, typename ConstBufferSequence,
      typename CompletionCondition, typename WriteHandler>
  inline void asio_handler_deallocate(void* pointer, std::size_t size,
      write_op<AsyncWriteStream, ConstBufferSequence,
        CompletionCondition, WriteHandler>* this_handler)
  {
    boost_asio_handler_alloc_helpers::deallocate(
        pointer, size, this_handler->handler_);
  }

  template <typename AsyncWriteStream, typename ConstBufferSequence,
      typename CompletionCondition, typename WriteHandler>
  inline bool asio_handler_is_continuation(
      write_op<AsyncWriteStream, ConstBufferSequence,
        CompletionCondition, WriteHandler>* this_handler)
  {
    return this_handler->start_ == 0 ? true
      : boost_asio_handler_cont_helpers::is_continuation(
          this_handler->handler_);
  }

  template <typename Function, typename AsyncWriteStream,
      typename ConstBufferSequence, typename CompletionCondition,
      typename WriteHandler>
  inline void asio_handler_invoke(Function& function,
      write_op<AsyncWriteStream, ConstBufferSequence,
        CompletionCondition, WriteHandler>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }

  template <typename Function, typename AsyncWriteStream,
      typename ConstBufferSequence, typename CompletionCondition,
      typename WriteHandler>
  inline void asio_handler_invoke(const Function& function,
      write_op<AsyncWriteStream, ConstBufferSequence,
        CompletionCondition, WriteHandler>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }
} // namespace detail

template <typename AsyncWriteStream, typename ConstBufferSequence,
  typename CompletionCondition, typename WriteHandler>
inline BOOST_ASIO_INITFN_RESULT_TYPE(WriteHandler,
    void (boost::system::error_code, std::size_t))
async_write(AsyncWriteStream& s, const ConstBufferSequence& buffers,
    CompletionCondition completion_condition,
    BOOST_ASIO_MOVE_ARG(WriteHandler) handler)
{
  // If you get an error on the following line it means that your handler does
  // not meet the documented type requirements for a WriteHandler.
  BOOST_ASIO_WRITE_HANDLER_CHECK(WriteHandler, handler) type_check;

  detail::async_result_init<
    WriteHandler, void (boost::system::error_code, std::size_t)> init(
      BOOST_ASIO_MOVE_CAST(WriteHandler)(handler));

  detail::write_op<AsyncWriteStream, ConstBufferSequence,
    CompletionCondition, BOOST_ASIO_HANDLER_TYPE(
      WriteHandler, void (boost::system::error_code, std::size_t))>(
        s, buffers, completion_condition, init.handler)(
          boost::system::error_code(), 0, 1);

  return init.result.get();
}

template <typename AsyncWriteStream, typename ConstBufferSequence,
    typename WriteHandler>
inline BOOST_ASIO_INITFN_RESULT_TYPE(WriteHandler,
    void (boost::system::error_code, std::size_t))
async_write(AsyncWriteStream& s, const ConstBufferSequence& buffers,
    BOOST_ASIO_MOVE_ARG(WriteHandler) handler)
{
  // If you get an error on the following line it means that your handler does
  // not meet the documented type requirements for a WriteHandler.
  BOOST_ASIO_WRITE_HANDLER_CHECK(WriteHandler, handler) type_check;

  detail::async_result_init<
    WriteHandler, void (boost::system::error_code, std::size_t)> init(
      BOOST_ASIO_MOVE_CAST(WriteHandler)(handler));

  detail::write_op<AsyncWriteStream, ConstBufferSequence,
    detail::transfer_all_t, BOOST_ASIO_HANDLER_TYPE(
      WriteHandler, void (boost::system::error_code, std::size_t))>(
        s, buffers, transfer_all(), init.handler)(
          boost::system::error_code(), 0, 1);

  return init.result.get();
}

#if !defined(BOOST_ASIO_NO_IOSTREAM)

namespace detail
{
  template <typename Allocator, typename WriteHandler>
  class write_streambuf_handler
  {
  public:
    write_streambuf_handler(boost::asio::basic_streambuf<Allocator>& streambuf,
        WriteHandler& handler)
      : streambuf_(streambuf),
        handler_(BOOST_ASIO_MOVE_CAST(WriteHandler)(handler))
    {
    }

#if defined(BOOST_ASIO_HAS_MOVE)
    write_streambuf_handler(const write_streambuf_handler& other)
      : streambuf_(other.streambuf_),
        handler_(other.handler_)
    {
    }

    write_streambuf_handler(write_streambuf_handler&& other)
      : streambuf_(other.streambuf_),
        handler_(BOOST_ASIO_MOVE_CAST(WriteHandler)(other.handler_))
    {
    }
#endif // defined(BOOST_ASIO_HAS_MOVE)

    void operator()(const boost::system::error_code& ec,
        const std::size_t bytes_transferred)
    {
      streambuf_.consume(bytes_transferred);
      handler_(ec, bytes_transferred);
    }

  //private:
    boost::asio::basic_streambuf<Allocator>& streambuf_;
    WriteHandler handler_;
  };

  template <typename Allocator, typename WriteHandler>
  inline void* asio_handler_allocate(std::size_t size,
      write_streambuf_handler<Allocator, WriteHandler>* this_handler)
  {
    return boost_asio_handler_alloc_helpers::allocate(
        size, this_handler->handler_);
  }

  template <typename Allocator, typename WriteHandler>
  inline void asio_handler_deallocate(void* pointer, std::size_t size,
      write_streambuf_handler<Allocator, WriteHandler>* this_handler)
  {
    boost_asio_handler_alloc_helpers::deallocate(
        pointer, size, this_handler->handler_);
  }

  template <typename Allocator, typename WriteHandler>
  inline bool asio_handler_is_continuation(
      write_streambuf_handler<Allocator, WriteHandler>* this_handler)
  {
    return boost_asio_handler_cont_helpers::is_continuation(
        this_handler->handler_);
  }

  template <typename Function, typename Allocator, typename WriteHandler>
  inline void asio_handler_invoke(Function& function,
      write_streambuf_handler<Allocator, WriteHandler>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }

  template <typename Function, typename Allocator, typename WriteHandler>
  inline void asio_handler_invoke(const Function& function,
      write_streambuf_handler<Allocator, WriteHandler>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }
} // namespace detail

template <typename AsyncWriteStream, typename Allocator,
    typename CompletionCondition, typename WriteHandler>
inline BOOST_ASIO_INITFN_RESULT_TYPE(WriteHandler,
    void (boost::system::error_code, std::size_t))
async_write(AsyncWriteStream& s,
    boost::asio::basic_streambuf<Allocator>& b,
    CompletionCondition completion_condition,
    BOOST_ASIO_MOVE_ARG(WriteHandler) handler)
{
  // If you get an error on the following line it means that your handler does
  // not meet the documented type requirements for a WriteHandler.
  BOOST_ASIO_WRITE_HANDLER_CHECK(WriteHandler, handler) type_check;

  detail::async_result_init<
    WriteHandler, void (boost::system::error_code, std::size_t)> init(
      BOOST_ASIO_MOVE_CAST(WriteHandler)(handler));

  async_write(s, b.data(), completion_condition,
    detail::write_streambuf_handler<Allocator, BOOST_ASIO_HANDLER_TYPE(
      WriteHandler, void (boost::system::error_code, std::size_t))>(
        b, init.handler));

  return init.result.get();
}

template <typename AsyncWriteStream, typename Allocator, typename WriteHandler>
inline BOOST_ASIO_INITFN_RESULT_TYPE(WriteHandler,
    void (boost::system::error_code, std::size_t))
async_write(AsyncWriteStream& s,
    boost::asio::basic_streambuf<Allocator>& b,
    BOOST_ASIO_MOVE_ARG(WriteHandler) handler)
{
  // If you get an error on the following line it means that your handler does
  // not meet the documented type requirements for a WriteHandler.
  BOOST_ASIO_WRITE_HANDLER_CHECK(WriteHandler, handler) type_check;

  detail::async_result_init<
    WriteHandler, void (boost::system::error_code, std::size_t)> init(
      BOOST_ASIO_MOVE_CAST(WriteHandler)(handler));

  async_write(s, b.data(), transfer_all(),
    detail::write_streambuf_handler<Allocator, BOOST_ASIO_HANDLER_TYPE(
      WriteHandler, void (boost::system::error_code, std::size_t))>(
        b, init.handler));

  return init.result.get();
}

#endif // !defined(BOOST_ASIO_NO_IOSTREAM)

} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_IMPL_WRITE_HPP

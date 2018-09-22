//
// impl/read_until.hpp
// ~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_IMPL_READ_UNTIL_HPP
#define BOOST_ASIO_IMPL_READ_UNTIL_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <algorithm>
#include <string>
#include <vector>
#include <utility>
#include <boost/asio/buffer.hpp>
#include <boost/asio/buffers_iterator.hpp>
#include <boost/asio/detail/bind_handler.hpp>
#include <boost/asio/detail/handler_alloc_helpers.hpp>
#include <boost/asio/detail/handler_cont_helpers.hpp>
#include <boost/asio/detail/handler_invoke_helpers.hpp>
#include <boost/asio/detail/handler_type_requirements.hpp>
#include <boost/asio/detail/limits.hpp>
#include <boost/asio/detail/throw_error.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {

template <typename SyncReadStream, typename Allocator>
inline std::size_t read_until(SyncReadStream& s,
    boost::asio::basic_streambuf<Allocator>& b, char delim)
{
  boost::system::error_code ec;
  std::size_t bytes_transferred = read_until(s, b, delim, ec);
  boost::asio::detail::throw_error(ec, "read_until");
  return bytes_transferred;
}

template <typename SyncReadStream, typename Allocator>
std::size_t read_until(SyncReadStream& s,
    boost::asio::basic_streambuf<Allocator>& b, char delim,
    boost::system::error_code& ec)
{
  std::size_t search_position = 0;
  for (;;)
  {
    // Determine the range of the data to be searched.
    typedef typename boost::asio::basic_streambuf<
      Allocator>::const_buffers_type const_buffers_type;
    typedef boost::asio::buffers_iterator<const_buffers_type> iterator;
    const_buffers_type buffers = b.data();
    iterator begin = iterator::begin(buffers);
    iterator start_pos = begin + search_position;
    iterator end = iterator::end(buffers);

    // Look for a match.
    iterator iter = std::find(start_pos, end, delim);
    if (iter != end)
    {
      // Found a match. We're done.
      ec = boost::system::error_code();
      return iter - begin + 1;
    }
    else
    {
      // No match. Next search can start with the new data.
      search_position = end - begin;
    }

    // Check if buffer is full.
    if (b.size() == b.max_size())
    {
      ec = error::not_found;
      return 0;
    }

    // Need more data.
    std::size_t bytes_to_read = read_size_helper(b, 65536);
    b.commit(s.read_some(b.prepare(bytes_to_read), ec));
    if (ec)
      return 0;
  }
}

template <typename SyncReadStream, typename Allocator>
inline std::size_t read_until(SyncReadStream& s,
    boost::asio::basic_streambuf<Allocator>& b, const std::string& delim)
{
  boost::system::error_code ec;
  std::size_t bytes_transferred = read_until(s, b, delim, ec);
  boost::asio::detail::throw_error(ec, "read_until");
  return bytes_transferred;
}

namespace detail
{
  // Algorithm that finds a subsequence of equal values in a sequence. Returns
  // (iterator,true) if a full match was found, in which case the iterator
  // points to the beginning of the match. Returns (iterator,false) if a
  // partial match was found at the end of the first sequence, in which case
  // the iterator points to the beginning of the partial match. Returns
  // (last1,false) if no full or partial match was found.
  template <typename Iterator1, typename Iterator2>
  std::pair<Iterator1, bool> partial_search(
      Iterator1 first1, Iterator1 last1, Iterator2 first2, Iterator2 last2)
  {
    for (Iterator1 iter1 = first1; iter1 != last1; ++iter1)
    {
      Iterator1 test_iter1 = iter1;
      Iterator2 test_iter2 = first2;
      for (;; ++test_iter1, ++test_iter2)
      {
        if (test_iter2 == last2)
          return std::make_pair(iter1, true);
        if (test_iter1 == last1)
        {
          if (test_iter2 != first2)
            return std::make_pair(iter1, false);
          else
            break;
        }
        if (*test_iter1 != *test_iter2)
          break;
      }
    }
    return std::make_pair(last1, false);
  }
} // namespace detail

template <typename SyncReadStream, typename Allocator>
std::size_t read_until(SyncReadStream& s,
    boost::asio::basic_streambuf<Allocator>& b, const std::string& delim,
    boost::system::error_code& ec)
{
  std::size_t search_position = 0;
  for (;;)
  {
    // Determine the range of the data to be searched.
    typedef typename boost::asio::basic_streambuf<
      Allocator>::const_buffers_type const_buffers_type;
    typedef boost::asio::buffers_iterator<const_buffers_type> iterator;
    const_buffers_type buffers = b.data();
    iterator begin = iterator::begin(buffers);
    iterator start_pos = begin + search_position;
    iterator end = iterator::end(buffers);

    // Look for a match.
    std::pair<iterator, bool> result = detail::partial_search(
        start_pos, end, delim.begin(), delim.end());
    if (result.first != end)
    {
      if (result.second)
      {
        // Full match. We're done.
        ec = boost::system::error_code();
        return result.first - begin + delim.length();
      }
      else
      {
        // Partial match. Next search needs to start from beginning of match.
        search_position = result.first - begin;
      }
    }
    else
    {
      // No match. Next search can start with the new data.
      search_position = end - begin;
    }

    // Check if buffer is full.
    if (b.size() == b.max_size())
    {
      ec = error::not_found;
      return 0;
    }

    // Need more data.
    std::size_t bytes_to_read = read_size_helper(b, 65536);
    b.commit(s.read_some(b.prepare(bytes_to_read), ec));
    if (ec)
      return 0;
  }
}

#if defined(BOOST_ASIO_HAS_BOOST_REGEX)

template <typename SyncReadStream, typename Allocator>
inline std::size_t read_until(SyncReadStream& s,
    boost::asio::basic_streambuf<Allocator>& b, const boost::regex& expr)
{
  boost::system::error_code ec;
  std::size_t bytes_transferred = read_until(s, b, expr, ec);
  boost::asio::detail::throw_error(ec, "read_until");
  return bytes_transferred;
}

template <typename SyncReadStream, typename Allocator>
std::size_t read_until(SyncReadStream& s,
    boost::asio::basic_streambuf<Allocator>& b, const boost::regex& expr,
    boost::system::error_code& ec)
{
  std::size_t search_position = 0;
  for (;;)
  {
    // Determine the range of the data to be searched.
    typedef typename boost::asio::basic_streambuf<
      Allocator>::const_buffers_type const_buffers_type;
    typedef boost::asio::buffers_iterator<const_buffers_type> iterator;
    const_buffers_type buffers = b.data();
    iterator begin = iterator::begin(buffers);
    iterator start_pos = begin + search_position;
    iterator end = iterator::end(buffers);

    // Look for a match.
    boost::match_results<iterator,
      typename std::vector<boost::sub_match<iterator> >::allocator_type>
        match_results;
    if (regex_search(start_pos, end, match_results, expr,
          boost::match_default | boost::match_partial))
    {
      if (match_results[0].matched)
      {
        // Full match. We're done.
        ec = boost::system::error_code();
        return match_results[0].second - begin;
      }
      else
      {
        // Partial match. Next search needs to start from beginning of match.
        search_position = match_results[0].first - begin;
      }
    }
    else
    {
      // No match. Next search can start with the new data.
      search_position = end - begin;
    }

    // Check if buffer is full.
    if (b.size() == b.max_size())
    {
      ec = error::not_found;
      return 0;
    }

    // Need more data.
    std::size_t bytes_to_read = read_size_helper(b, 65536);
    b.commit(s.read_some(b.prepare(bytes_to_read), ec));
    if (ec)
      return 0;
  }
}

#endif // defined(BOOST_ASIO_HAS_BOOST_REGEX)

template <typename SyncReadStream, typename Allocator, typename MatchCondition>
std::size_t read_until(SyncReadStream& s,
    boost::asio::basic_streambuf<Allocator>& b,
    MatchCondition match_condition, boost::system::error_code& ec,
    typename enable_if<is_match_condition<MatchCondition>::value>::type*)
{
  std::size_t search_position = 0;
  for (;;)
  {
    // Determine the range of the data to be searched.
    typedef typename boost::asio::basic_streambuf<
      Allocator>::const_buffers_type const_buffers_type;
    typedef boost::asio::buffers_iterator<const_buffers_type> iterator;
    const_buffers_type buffers = b.data();
    iterator begin = iterator::begin(buffers);
    iterator start_pos = begin + search_position;
    iterator end = iterator::end(buffers);

    // Look for a match.
    std::pair<iterator, bool> result = match_condition(start_pos, end);
    if (result.second)
    {
      // Full match. We're done.
      ec = boost::system::error_code();
      return result.first - begin;
    }
    else if (result.first != end)
    {
      // Partial match. Next search needs to start from beginning of match.
      search_position = result.first - begin;
    }
    else
    {
      // No match. Next search can start with the new data.
      search_position = end - begin;
    }

    // Check if buffer is full.
    if (b.size() == b.max_size())
    {
      ec = error::not_found;
      return 0;
    }

    // Need more data.
    std::size_t bytes_to_read = read_size_helper(b, 65536);
    b.commit(s.read_some(b.prepare(bytes_to_read), ec));
    if (ec)
      return 0;
  }
}

template <typename SyncReadStream, typename Allocator, typename MatchCondition>
inline std::size_t read_until(SyncReadStream& s,
    boost::asio::basic_streambuf<Allocator>& b, MatchCondition match_condition,
    typename enable_if<is_match_condition<MatchCondition>::value>::type*)
{
  boost::system::error_code ec;
  std::size_t bytes_transferred = read_until(s, b, match_condition, ec);
  boost::asio::detail::throw_error(ec, "read_until");
  return bytes_transferred;
}

namespace detail
{
  template <typename AsyncReadStream, typename Allocator, typename ReadHandler>
  class read_until_delim_op
  {
  public:
    read_until_delim_op(AsyncReadStream& stream,
        boost::asio::basic_streambuf<Allocator>& streambuf,
        char delim, ReadHandler& handler)
      : stream_(stream),
        streambuf_(streambuf),
        delim_(delim),
        start_(0),
        search_position_(0),
        handler_(BOOST_ASIO_MOVE_CAST(ReadHandler)(handler))
    {
    }

#if defined(BOOST_ASIO_HAS_MOVE)
    read_until_delim_op(const read_until_delim_op& other)
      : stream_(other.stream_),
        streambuf_(other.streambuf_),
        delim_(other.delim_),
        start_(other.start_),
        search_position_(other.search_position_),
        handler_(other.handler_)
    {
    }

    read_until_delim_op(read_until_delim_op&& other)
      : stream_(other.stream_),
        streambuf_(other.streambuf_),
        delim_(other.delim_),
        start_(other.start_),
        search_position_(other.search_position_),
        handler_(BOOST_ASIO_MOVE_CAST(ReadHandler)(other.handler_))
    {
    }
#endif // defined(BOOST_ASIO_HAS_MOVE)

    void operator()(const boost::system::error_code& ec,
        std::size_t bytes_transferred, int start = 0)
    {
      const std::size_t not_found = (std::numeric_limits<std::size_t>::max)();
      std::size_t bytes_to_read;
      switch (start_ = start)
      {
      case 1:
        for (;;)
        {
          {
            // Determine the range of the data to be searched.
            typedef typename boost::asio::basic_streambuf<
              Allocator>::const_buffers_type const_buffers_type;
            typedef boost::asio::buffers_iterator<const_buffers_type> iterator;
            const_buffers_type buffers = streambuf_.data();
            iterator begin = iterator::begin(buffers);
            iterator start_pos = begin + search_position_;
            iterator end = iterator::end(buffers);

            // Look for a match.
            iterator iter = std::find(start_pos, end, delim_);
            if (iter != end)
            {
              // Found a match. We're done.
              search_position_ = iter - begin + 1;
              bytes_to_read = 0;
            }

            // No match yet. Check if buffer is full.
            else if (streambuf_.size() == streambuf_.max_size())
            {
              search_position_ = not_found;
              bytes_to_read = 0;
            }

            // Need to read some more data.
            else
            {
              // Next search can start with the new data.
              search_position_ = end - begin;
              bytes_to_read = read_size_helper(streambuf_, 65536);
            }
          }

          // Check if we're done.
          if (!start && bytes_to_read == 0)
            break;

          // Start a new asynchronous read operation to obtain more data.
          stream_.async_read_some(streambuf_.prepare(bytes_to_read),
              BOOST_ASIO_MOVE_CAST(read_until_delim_op)(*this));
          return; default:
          streambuf_.commit(bytes_transferred);
          if (ec || bytes_transferred == 0)
            break;
        }

        const boost::system::error_code result_ec =
          (search_position_ == not_found)
          ? error::not_found : ec;

        const std::size_t result_n =
          (ec || search_position_ == not_found)
          ? 0 : search_position_;

        handler_(result_ec, result_n);
      }
    }

  //private:
    AsyncReadStream& stream_;
    boost::asio::basic_streambuf<Allocator>& streambuf_;
    char delim_;
    int start_;
    std::size_t search_position_;
    ReadHandler handler_;
  };

  template <typename AsyncReadStream, typename Allocator, typename ReadHandler>
  inline void* asio_handler_allocate(std::size_t size,
      read_until_delim_op<AsyncReadStream,
        Allocator, ReadHandler>* this_handler)
  {
    return boost_asio_handler_alloc_helpers::allocate(
        size, this_handler->handler_);
  }

  template <typename AsyncReadStream, typename Allocator, typename ReadHandler>
  inline void asio_handler_deallocate(void* pointer, std::size_t size,
      read_until_delim_op<AsyncReadStream,
        Allocator, ReadHandler>* this_handler)
  {
    boost_asio_handler_alloc_helpers::deallocate(
        pointer, size, this_handler->handler_);
  }

  template <typename AsyncReadStream, typename Allocator, typename ReadHandler>
  inline bool asio_handler_is_continuation(
      read_until_delim_op<AsyncReadStream,
        Allocator, ReadHandler>* this_handler)
  {
    return this_handler->start_ == 0 ? true
      : boost_asio_handler_cont_helpers::is_continuation(
          this_handler->handler_);
  }

  template <typename Function, typename AsyncReadStream, typename Allocator,
      typename ReadHandler>
  inline void asio_handler_invoke(Function& function,
      read_until_delim_op<AsyncReadStream,
        Allocator, ReadHandler>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }

  template <typename Function, typename AsyncReadStream, typename Allocator,
      typename ReadHandler>
  inline void asio_handler_invoke(const Function& function,
      read_until_delim_op<AsyncReadStream,
        Allocator, ReadHandler>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }
} // namespace detail

template <typename AsyncReadStream, typename Allocator, typename ReadHandler>
BOOST_ASIO_INITFN_RESULT_TYPE(ReadHandler,
    void (boost::system::error_code, std::size_t))
async_read_until(AsyncReadStream& s,
    boost::asio::basic_streambuf<Allocator>& b, char delim,
    BOOST_ASIO_MOVE_ARG(ReadHandler) handler)
{
  // If you get an error on the following line it means that your handler does
  // not meet the documented type requirements for a ReadHandler.
  BOOST_ASIO_READ_HANDLER_CHECK(ReadHandler, handler) type_check;

  detail::async_result_init<
    ReadHandler, void (boost::system::error_code, std::size_t)> init(
      BOOST_ASIO_MOVE_CAST(ReadHandler)(handler));

  detail::read_until_delim_op<AsyncReadStream,
    Allocator, BOOST_ASIO_HANDLER_TYPE(ReadHandler,
      void (boost::system::error_code, std::size_t))>(
        s, b, delim, init.handler)(
          boost::system::error_code(), 0, 1);

  return init.result.get();
}

namespace detail
{
  template <typename AsyncReadStream, typename Allocator, typename ReadHandler>
  class read_until_delim_string_op
  {
  public:
    read_until_delim_string_op(AsyncReadStream& stream,
        boost::asio::basic_streambuf<Allocator>& streambuf,
        const std::string& delim, ReadHandler& handler)
      : stream_(stream),
        streambuf_(streambuf),
        delim_(delim),
        start_(0),
        search_position_(0),
        handler_(BOOST_ASIO_MOVE_CAST(ReadHandler)(handler))
    {
    }

#if defined(BOOST_ASIO_HAS_MOVE)
    read_until_delim_string_op(const read_until_delim_string_op& other)
      : stream_(other.stream_),
        streambuf_(other.streambuf_),
        delim_(other.delim_),
        start_(other.start_),
        search_position_(other.search_position_),
        handler_(other.handler_)
    {
    }

    read_until_delim_string_op(read_until_delim_string_op&& other)
      : stream_(other.stream_),
        streambuf_(other.streambuf_),
        delim_(BOOST_ASIO_MOVE_CAST(std::string)(other.delim_)),
        start_(other.start_),
        search_position_(other.search_position_),
        handler_(BOOST_ASIO_MOVE_CAST(ReadHandler)(other.handler_))
    {
    }
#endif // defined(BOOST_ASIO_HAS_MOVE)

    void operator()(const boost::system::error_code& ec,
        std::size_t bytes_transferred, int start = 0)
    {
      const std::size_t not_found = (std::numeric_limits<std::size_t>::max)();
      std::size_t bytes_to_read;
      switch (start_ = start)
      {
      case 1:
        for (;;)
        {
          {
            // Determine the range of the data to be searched.
            typedef typename boost::asio::basic_streambuf<
              Allocator>::const_buffers_type const_buffers_type;
            typedef boost::asio::buffers_iterator<const_buffers_type> iterator;
            const_buffers_type buffers = streambuf_.data();
            iterator begin = iterator::begin(buffers);
            iterator start_pos = begin + search_position_;
            iterator end = iterator::end(buffers);

            // Look for a match.
            std::pair<iterator, bool> result = detail::partial_search(
                start_pos, end, delim_.begin(), delim_.end());
            if (result.first != end && result.second)
            {
              // Full match. We're done.
              search_position_ = result.first - begin + delim_.length();
              bytes_to_read = 0;
            }

            // No match yet. Check if buffer is full.
            else if (streambuf_.size() == streambuf_.max_size())
            {
              search_position_ = not_found;
              bytes_to_read = 0;
            }

            // Need to read some more data.
            else
            {
              if (result.first != end)
              {
                // Partial match. Next search needs to start from beginning of
                // match.
                search_position_ = result.first - begin;
              }
              else
              {
                // Next search can start with the new data.
                search_position_ = end - begin;
              }

              bytes_to_read = read_size_helper(streambuf_, 65536);
            }
          }

          // Check if we're done.
          if (!start && bytes_to_read == 0)
            break;

          // Start a new asynchronous read operation to obtain more data.
          stream_.async_read_some(streambuf_.prepare(bytes_to_read),
              BOOST_ASIO_MOVE_CAST(read_until_delim_string_op)(*this));
          return; default:
          streambuf_.commit(bytes_transferred);
          if (ec || bytes_transferred == 0)
            break;
        }

        const boost::system::error_code result_ec =
          (search_position_ == not_found)
          ? error::not_found : ec;

        const std::size_t result_n =
          (ec || search_position_ == not_found)
          ? 0 : search_position_;

        handler_(result_ec, result_n);
      }
    }

  //private:
    AsyncReadStream& stream_;
    boost::asio::basic_streambuf<Allocator>& streambuf_;
    std::string delim_;
    int start_;
    std::size_t search_position_;
    ReadHandler handler_;
  };

  template <typename AsyncReadStream, typename Allocator, typename ReadHandler>
  inline void* asio_handler_allocate(std::size_t size,
      read_until_delim_string_op<AsyncReadStream,
        Allocator, ReadHandler>* this_handler)
  {
    return boost_asio_handler_alloc_helpers::allocate(
        size, this_handler->handler_);
  }

  template <typename AsyncReadStream, typename Allocator, typename ReadHandler>
  inline void asio_handler_deallocate(void* pointer, std::size_t size,
      read_until_delim_string_op<AsyncReadStream,
        Allocator, ReadHandler>* this_handler)
  {
    boost_asio_handler_alloc_helpers::deallocate(
        pointer, size, this_handler->handler_);
  }

  template <typename AsyncReadStream, typename Allocator, typename ReadHandler>
  inline bool asio_handler_is_continuation(
      read_until_delim_string_op<AsyncReadStream,
        Allocator, ReadHandler>* this_handler)
  {
    return this_handler->start_ == 0 ? true
      : boost_asio_handler_cont_helpers::is_continuation(
          this_handler->handler_);
  }

  template <typename Function, typename AsyncReadStream,
      typename Allocator, typename ReadHandler>
  inline void asio_handler_invoke(Function& function,
      read_until_delim_string_op<AsyncReadStream,
        Allocator, ReadHandler>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }

  template <typename Function, typename AsyncReadStream,
      typename Allocator, typename ReadHandler>
  inline void asio_handler_invoke(const Function& function,
      read_until_delim_string_op<AsyncReadStream,
        Allocator, ReadHandler>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }
} // namespace detail

template <typename AsyncReadStream, typename Allocator, typename ReadHandler>
BOOST_ASIO_INITFN_RESULT_TYPE(ReadHandler,
    void (boost::system::error_code, std::size_t))
async_read_until(AsyncReadStream& s,
    boost::asio::basic_streambuf<Allocator>& b, const std::string& delim,
    BOOST_ASIO_MOVE_ARG(ReadHandler) handler)
{
  // If you get an error on the following line it means that your handler does
  // not meet the documented type requirements for a ReadHandler.
  BOOST_ASIO_READ_HANDLER_CHECK(ReadHandler, handler) type_check;

  detail::async_result_init<
    ReadHandler, void (boost::system::error_code, std::size_t)> init(
      BOOST_ASIO_MOVE_CAST(ReadHandler)(handler));

  detail::read_until_delim_string_op<AsyncReadStream,
    Allocator, BOOST_ASIO_HANDLER_TYPE(ReadHandler,
      void (boost::system::error_code, std::size_t))>(
        s, b, delim, init.handler)(
          boost::system::error_code(), 0, 1);

  return init.result.get();
}

#if defined(BOOST_ASIO_HAS_BOOST_REGEX)

namespace detail
{
  template <typename AsyncReadStream, typename Allocator,
      typename RegEx, typename ReadHandler>
  class read_until_expr_op
  {
  public:
    read_until_expr_op(AsyncReadStream& stream,
        boost::asio::basic_streambuf<Allocator>& streambuf,
        const boost::regex& expr, ReadHandler& handler)
      : stream_(stream),
        streambuf_(streambuf),
        expr_(expr),
        start_(0),
        search_position_(0),
        handler_(BOOST_ASIO_MOVE_CAST(ReadHandler)(handler))
    {
    }

#if defined(BOOST_ASIO_HAS_MOVE)
    read_until_expr_op(const read_until_expr_op& other)
      : stream_(other.stream_),
        streambuf_(other.streambuf_),
        expr_(other.expr_),
        start_(other.start_),
        search_position_(other.search_position_),
        handler_(other.handler_)
    {
    }

    read_until_expr_op(read_until_expr_op&& other)
      : stream_(other.stream_),
        streambuf_(other.streambuf_),
        expr_(other.expr_),
        start_(other.start_),
        search_position_(other.search_position_),
        handler_(BOOST_ASIO_MOVE_CAST(ReadHandler)(other.handler_))
    {
    }
#endif // defined(BOOST_ASIO_HAS_MOVE)

    void operator()(const boost::system::error_code& ec,
        std::size_t bytes_transferred, int start = 0)
    {
      const std::size_t not_found = (std::numeric_limits<std::size_t>::max)();
      std::size_t bytes_to_read;
      switch (start_ = start)
      {
      case 1:
        for (;;)
        {
          {
            // Determine the range of the data to be searched.
            typedef typename boost::asio::basic_streambuf<
              Allocator>::const_buffers_type const_buffers_type;
            typedef boost::asio::buffers_iterator<const_buffers_type> iterator;
            const_buffers_type buffers = streambuf_.data();
            iterator begin = iterator::begin(buffers);
            iterator start_pos = begin + search_position_;
            iterator end = iterator::end(buffers);

            // Look for a match.
            boost::match_results<iterator,
              typename std::vector<boost::sub_match<iterator> >::allocator_type>
                match_results;
            bool match = regex_search(start_pos, end, match_results, expr_,
                boost::match_default | boost::match_partial);
            if (match && match_results[0].matched)
            {
              // Full match. We're done.
              search_position_ = match_results[0].second - begin;
              bytes_to_read = 0;
            }

            // No match yet. Check if buffer is full.
            else if (streambuf_.size() == streambuf_.max_size())
            {
              search_position_ = not_found;
              bytes_to_read = 0;
            }

            // Need to read some more data.
            else
            {
              if (match)
              {
                // Partial match. Next search needs to start from beginning of
                // match.
                search_position_ = match_results[0].first - begin;
              }
              else
              {
                // Next search can start with the new data.
                search_position_ = end - begin;
              }

              bytes_to_read = read_size_helper(streambuf_, 65536);
            }
          }

          // Check if we're done.
          if (!start && bytes_to_read == 0)
            break;

          // Start a new asynchronous read operation to obtain more data.
          stream_.async_read_some(streambuf_.prepare(bytes_to_read),
              BOOST_ASIO_MOVE_CAST(read_until_expr_op)(*this));
          return; default:
          streambuf_.commit(bytes_transferred);
          if (ec || bytes_transferred == 0)
            break;
        }

        const boost::system::error_code result_ec =
          (search_position_ == not_found)
          ? error::not_found : ec;

        const std::size_t result_n =
          (ec || search_position_ == not_found)
          ? 0 : search_position_;

        handler_(result_ec, result_n);
      }
    }

  //private:
    AsyncReadStream& stream_;
    boost::asio::basic_streambuf<Allocator>& streambuf_;
    RegEx expr_;
    int start_;
    std::size_t search_position_;
    ReadHandler handler_;
  };

  template <typename AsyncReadStream, typename Allocator,
      typename RegEx, typename ReadHandler>
  inline void* asio_handler_allocate(std::size_t size,
      read_until_expr_op<AsyncReadStream,
        Allocator, RegEx, ReadHandler>* this_handler)
  {
    return boost_asio_handler_alloc_helpers::allocate(
        size, this_handler->handler_);
  }

  template <typename AsyncReadStream, typename Allocator,
      typename RegEx, typename ReadHandler>
  inline void asio_handler_deallocate(void* pointer, std::size_t size,
      read_until_expr_op<AsyncReadStream,
        Allocator, RegEx, ReadHandler>* this_handler)
  {
    boost_asio_handler_alloc_helpers::deallocate(
        pointer, size, this_handler->handler_);
  }

  template <typename AsyncReadStream, typename Allocator,
      typename RegEx, typename ReadHandler>
  inline bool asio_handler_is_continuation(
      read_until_expr_op<AsyncReadStream,
        Allocator, RegEx, ReadHandler>* this_handler)
  {
    return this_handler->start_ == 0 ? true
      : boost_asio_handler_cont_helpers::is_continuation(
          this_handler->handler_);
  }

  template <typename Function, typename AsyncReadStream, typename Allocator,
      typename RegEx, typename ReadHandler>
  inline void asio_handler_invoke(Function& function,
      read_until_expr_op<AsyncReadStream,
        Allocator, RegEx, ReadHandler>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }

  template <typename Function, typename AsyncReadStream, typename Allocator,
      typename RegEx, typename ReadHandler>
  inline void asio_handler_invoke(const Function& function,
      read_until_expr_op<AsyncReadStream,
        Allocator, RegEx, ReadHandler>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }
} // namespace detail

template <typename AsyncReadStream, typename Allocator, typename ReadHandler>
BOOST_ASIO_INITFN_RESULT_TYPE(ReadHandler,
    void (boost::system::error_code, std::size_t))
async_read_until(AsyncReadStream& s,
    boost::asio::basic_streambuf<Allocator>& b, const boost::regex& expr,
    BOOST_ASIO_MOVE_ARG(ReadHandler) handler)
{
  // If you get an error on the following line it means that your handler does
  // not meet the documented type requirements for a ReadHandler.
  BOOST_ASIO_READ_HANDLER_CHECK(ReadHandler, handler) type_check;

  detail::async_result_init<
    ReadHandler, void (boost::system::error_code, std::size_t)> init(
      BOOST_ASIO_MOVE_CAST(ReadHandler)(handler));

  detail::read_until_expr_op<AsyncReadStream, Allocator,
    boost::regex, BOOST_ASIO_HANDLER_TYPE(ReadHandler,
      void (boost::system::error_code, std::size_t))>(
        s, b, expr, init.handler)(
          boost::system::error_code(), 0, 1);

  return init.result.get();
}

#endif // defined(BOOST_ASIO_HAS_BOOST_REGEX)

namespace detail
{
  template <typename AsyncReadStream, typename Allocator,
      typename MatchCondition, typename ReadHandler>
  class read_until_match_op
  {
  public:
    read_until_match_op(AsyncReadStream& stream,
        boost::asio::basic_streambuf<Allocator>& streambuf,
        MatchCondition match_condition, ReadHandler& handler)
      : stream_(stream),
        streambuf_(streambuf),
        match_condition_(match_condition),
        start_(0),
        search_position_(0),
        handler_(BOOST_ASIO_MOVE_CAST(ReadHandler)(handler))
    {
    }

#if defined(BOOST_ASIO_HAS_MOVE)
    read_until_match_op(const read_until_match_op& other)
      : stream_(other.stream_),
        streambuf_(other.streambuf_),
        match_condition_(other.match_condition_),
        start_(other.start_),
        search_position_(other.search_position_),
        handler_(other.handler_)
    {
    }

    read_until_match_op(read_until_match_op&& other)
      : stream_(other.stream_),
        streambuf_(other.streambuf_),
        match_condition_(other.match_condition_),
        start_(other.start_),
        search_position_(other.search_position_),
        handler_(BOOST_ASIO_MOVE_CAST(ReadHandler)(other.handler_))
    {
    }
#endif // defined(BOOST_ASIO_HAS_MOVE)

    void operator()(const boost::system::error_code& ec,
        std::size_t bytes_transferred, int start = 0)
    {
      const std::size_t not_found = (std::numeric_limits<std::size_t>::max)();
      std::size_t bytes_to_read;
      switch (start_ = start)
      {
      case 1:
        for (;;)
        {
          {
            // Determine the range of the data to be searched.
            typedef typename boost::asio::basic_streambuf<
              Allocator>::const_buffers_type const_buffers_type;
            typedef boost::asio::buffers_iterator<const_buffers_type> iterator;
            const_buffers_type buffers = streambuf_.data();
            iterator begin = iterator::begin(buffers);
            iterator start_pos = begin + search_position_;
            iterator end = iterator::end(buffers);

            // Look for a match.
            std::pair<iterator, bool> result = match_condition_(start_pos, end);
            if (result.second)
            {
              // Full match. We're done.
              search_position_ = result.first - begin;
              bytes_to_read = 0;
            }

            // No match yet. Check if buffer is full.
            else if (streambuf_.size() == streambuf_.max_size())
            {
              search_position_ = not_found;
              bytes_to_read = 0;
            }

            // Need to read some more data.
            else
            {
              if (result.first != end)
              {
                // Partial match. Next search needs to start from beginning of
                // match.
                search_position_ = result.first - begin;
              }
              else
              {
                // Next search can start with the new data.
                search_position_ = end - begin;
              }

              bytes_to_read = read_size_helper(streambuf_, 65536);
            }
          }

          // Check if we're done.
          if (!start && bytes_to_read == 0)
            break;

          // Start a new asynchronous read operation to obtain more data.
          stream_.async_read_some(streambuf_.prepare(bytes_to_read),
              BOOST_ASIO_MOVE_CAST(read_until_match_op)(*this));
          return; default:
          streambuf_.commit(bytes_transferred);
          if (ec || bytes_transferred == 0)
            break;
        }

        const boost::system::error_code result_ec =
          (search_position_ == not_found)
          ? error::not_found : ec;

        const std::size_t result_n =
          (ec || search_position_ == not_found)
          ? 0 : search_position_;

        handler_(result_ec, result_n);
      }
    }

  //private:
    AsyncReadStream& stream_;
    boost::asio::basic_streambuf<Allocator>& streambuf_;
    MatchCondition match_condition_;
    int start_;
    std::size_t search_position_;
    ReadHandler handler_;
  };

  template <typename AsyncReadStream, typename Allocator,
      typename MatchCondition, typename ReadHandler>
  inline void* asio_handler_allocate(std::size_t size,
      read_until_match_op<AsyncReadStream,
        Allocator, MatchCondition, ReadHandler>* this_handler)
  {
    return boost_asio_handler_alloc_helpers::allocate(
        size, this_handler->handler_);
  }

  template <typename AsyncReadStream, typename Allocator,
      typename MatchCondition, typename ReadHandler>
  inline void asio_handler_deallocate(void* pointer, std::size_t size,
      read_until_match_op<AsyncReadStream,
        Allocator, MatchCondition, ReadHandler>* this_handler)
  {
    boost_asio_handler_alloc_helpers::deallocate(
        pointer, size, this_handler->handler_);
  }

  template <typename AsyncReadStream, typename Allocator,
      typename MatchCondition, typename ReadHandler>
  inline bool asio_handler_is_continuation(
      read_until_match_op<AsyncReadStream,
        Allocator, MatchCondition, ReadHandler>* this_handler)
  {
    return this_handler->start_ == 0 ? true
      : boost_asio_handler_cont_helpers::is_continuation(
          this_handler->handler_);
  }

  template <typename Function, typename AsyncReadStream, typename Allocator,
      typename MatchCondition, typename ReadHandler>
  inline void asio_handler_invoke(Function& function,
      read_until_match_op<AsyncReadStream,
        Allocator, MatchCondition, ReadHandler>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }

  template <typename Function, typename AsyncReadStream, typename Allocator,
      typename MatchCondition, typename ReadHandler>
  inline void asio_handler_invoke(const Function& function,
      read_until_match_op<AsyncReadStream,
        Allocator, MatchCondition, ReadHandler>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }
} // namespace detail

template <typename AsyncReadStream, typename Allocator,
    typename MatchCondition, typename ReadHandler>
BOOST_ASIO_INITFN_RESULT_TYPE(ReadHandler,
    void (boost::system::error_code, std::size_t))
async_read_until(AsyncReadStream& s,
    boost::asio::basic_streambuf<Allocator>& b,
    MatchCondition match_condition, BOOST_ASIO_MOVE_ARG(ReadHandler) handler,
    typename enable_if<is_match_condition<MatchCondition>::value>::type*)
{
  // If you get an error on the following line it means that your handler does
  // not meet the documented type requirements for a ReadHandler.
  BOOST_ASIO_READ_HANDLER_CHECK(ReadHandler, handler) type_check;

  detail::async_result_init<
    ReadHandler, void (boost::system::error_code, std::size_t)> init(
      BOOST_ASIO_MOVE_CAST(ReadHandler)(handler));

  detail::read_until_match_op<AsyncReadStream, Allocator,
    MatchCondition, BOOST_ASIO_HANDLER_TYPE(ReadHandler,
      void (boost::system::error_code, std::size_t))>(
        s, b, match_condition, init.handler)(
          boost::system::error_code(), 0, 1);

  return init.result.get();
}

} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_IMPL_READ_UNTIL_HPP

//
// impl/handler_alloc_hook.ipp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_IMPL_HANDLER_ALLOC_HOOK_IPP
#define BOOST_ASIO_IMPL_HANDLER_ALLOC_HOOK_IPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <boost/asio/detail/call_stack.hpp>
#include <boost/asio/handler_alloc_hook.hpp>

#if !defined(BOOST_ASIO_DISABLE_SMALL_BLOCK_RECYCLING)
# if defined(BOOST_ASIO_HAS_IOCP)
#  include <boost/asio/detail/win_iocp_thread_info.hpp>
# else // defined(BOOST_ASIO_HAS_IOCP)
#  include <boost/asio/detail/task_io_service_thread_info.hpp>
# endif // defined(BOOST_ASIO_HAS_IOCP)
#endif // !defined(BOOST_ASIO_DISABLE_SMALL_BLOCK_RECYCLING)

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {

#if defined(BOOST_ASIO_HAS_IOCP)
namespace detail { class win_iocp_io_service; }
#endif // defined(BOOST_ASIO_HAS_IOCP)

void* asio_handler_allocate(std::size_t size, ...)
{
#if !defined(BOOST_ASIO_DISABLE_SMALL_BLOCK_RECYCLING)
# if defined(BOOST_ASIO_HAS_IOCP)
  typedef detail::win_iocp_io_service io_service_impl;
  typedef detail::win_iocp_thread_info thread_info;
# else // defined(BOOST_ASIO_HAS_IOCP)
  typedef detail::task_io_service io_service_impl;
  typedef detail::task_io_service_thread_info thread_info;
# endif // defined(BOOST_ASIO_HAS_IOCP)
  typedef detail::call_stack<io_service_impl, thread_info> call_stack;
  return thread_info::allocate(call_stack::top(), size);
#else // !defined(BOOST_ASIO_DISABLE_SMALL_BLOCK_RECYCLING)
  return ::operator new(size);
#endif // !defined(BOOST_ASIO_DISABLE_SMALL_BLOCK_RECYCLING)
}

void asio_handler_deallocate(void* pointer, std::size_t size, ...)
{
#if !defined(BOOST_ASIO_DISABLE_SMALL_BLOCK_RECYCLING)
# if defined(BOOST_ASIO_HAS_IOCP)
  typedef detail::win_iocp_io_service io_service_impl;
  typedef detail::win_iocp_thread_info thread_info;
# else // defined(BOOST_ASIO_HAS_IOCP)
  typedef detail::task_io_service io_service_impl;
  typedef detail::task_io_service_thread_info thread_info;
# endif // defined(BOOST_ASIO_HAS_IOCP)
  typedef detail::call_stack<io_service_impl, thread_info> call_stack;
  thread_info::deallocate(call_stack::top(), pointer, size);
#else // !defined(BOOST_ASIO_DISABLE_SMALL_BLOCK_RECYCLING)
  (void)size;
  ::operator delete(pointer);
#endif // !defined(BOOST_ASIO_DISABLE_SMALL_BLOCK_RECYCLING)
}

} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_IMPL_HANDLER_ALLOC_HOOK_IPP

//  local_free_on_exit.hpp  ------------------------------------------------------------//

//  Copyright (c) 2003-2010 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//  Copyright (c) 2010 Beman Dawes

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt

//  This is derived from boost/asio/detail/local_free_on_block_exit.hpp to avoid
//  a dependency on asio. Thanks to Chris Kohlhoff for pointing it out.

#ifndef BOOST_SYSTEM_LOCAL_FREE_ON_EXIT_HPP
#define BOOST_SYSTEM_LOCAL_FREE_ON_EXIT_HPP

namespace boost {
namespace system {
namespace detail {

class local_free_on_destruction
{
public:
  explicit local_free_on_destruction(void* p)
    : p_(p) {}

  ~local_free_on_destruction()
  {
    ::LocalFree(p_);
  }

private:
  void* p_;
  local_free_on_destruction(const local_free_on_destruction&);  // = deleted
  local_free_on_destruction& operator=(const local_free_on_destruction&);  // = deleted
};

} // namespace detail
} // namespace system
} // namespace boost

#endif  // BOOST_SYSTEM_LOCAL_FREE_ON_EXIT_HPP

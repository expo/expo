#ifndef BOOST_SMART_PTR_OWNER_LESS_HPP_INCLUDED
#define BOOST_SMART_PTR_OWNER_LESS_HPP_INCLUDED

//
//  owner_less.hpp
//
//  Copyright (c) 2008 Frank Mori Hess
//
//  Distributed under the Boost Software License, Version 1.0. (See
//  accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)
//
//  See http://www.boost.org/libs/smart_ptr/smart_ptr.htm for documentation.
//

#include <functional>

namespace boost
{
  template<typename T> class shared_ptr;
  template<typename T> class weak_ptr;

  namespace detail
  {
    template<typename T, typename U>
      struct generic_owner_less : public std::binary_function<T, T, bool>
    {
      bool operator()(const T &lhs, const T &rhs) const
      {
        return lhs.owner_before(rhs);
      }
      bool operator()(const T &lhs, const U &rhs) const
      {
        return lhs.owner_before(rhs);
      }
      bool operator()(const U &lhs, const T &rhs) const
      {
        return lhs.owner_before(rhs);
      }
    };
  } // namespace detail

  template<typename T> struct owner_less;

  template<typename T>
    struct owner_less<shared_ptr<T> >:
    public detail::generic_owner_less<shared_ptr<T>, weak_ptr<T> >
  {};

  template<typename T>
    struct owner_less<weak_ptr<T> >:
    public detail::generic_owner_less<weak_ptr<T>, shared_ptr<T> >
  {};

} // namespace boost

#endif  // #ifndef BOOST_SMART_PTR_OWNER_LESS_HPP_INCLUDED

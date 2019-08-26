
//  (C) Copyright Dave Abrahams, Steve Cleary, Beman Dawes, Howard
//  Hinnant & John Maddock 2000.  
//  Use, modification and distribution are subject to the Boost Software License,
//  Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt).
//
//  See http://www.boost.org/libs/type_traits for most recent version including documentation.


#ifndef BOOST_TT_DETAIL_CV_TRAITS_IMPL_HPP_INCLUDED
#define BOOST_TT_DETAIL_CV_TRAITS_IMPL_HPP_INCLUDED

#include <cstddef>
#include <boost/config.hpp>
#include <boost/detail/workaround.hpp>


// implementation helper:


namespace boost {
namespace detail {

#if BOOST_WORKAROUND(BOOST_MSVC, == 1700)
#define BOOST_TT_AUX_CV_TRAITS_IMPL_PARAM(X) X
   template <typename T>
   struct cv_traits_imp
   {
      BOOST_STATIC_CONSTANT(bool, is_const = false);
      BOOST_STATIC_CONSTANT(bool, is_volatile = false);
      typedef T unqualified_type;
   };

   template <typename T>
   struct cv_traits_imp<T[]>
   {
      BOOST_STATIC_CONSTANT(bool, is_const = false);
      BOOST_STATIC_CONSTANT(bool, is_volatile = false);
      typedef T unqualified_type[];
   };

   template <typename T>
   struct cv_traits_imp<const T[]>
   {
      BOOST_STATIC_CONSTANT(bool, is_const = true);
      BOOST_STATIC_CONSTANT(bool, is_volatile = false);
      typedef T unqualified_type[];
   };

   template <typename T>
   struct cv_traits_imp<volatile T[]>
   {
      BOOST_STATIC_CONSTANT(bool, is_const = false);
      BOOST_STATIC_CONSTANT(bool, is_volatile = true);
      typedef T unqualified_type[];
   };

   template <typename T>
   struct cv_traits_imp<const volatile T[]>
   {
      BOOST_STATIC_CONSTANT(bool, is_const = true);
      BOOST_STATIC_CONSTANT(bool, is_volatile = true);
      typedef T unqualified_type[];
   };

   template <typename T, std::size_t N>
   struct cv_traits_imp<T[N]>
   {
      BOOST_STATIC_CONSTANT(bool, is_const = false);
      BOOST_STATIC_CONSTANT(bool, is_volatile = false);
      typedef T unqualified_type[N];
   };

   template <typename T, std::size_t N>
   struct cv_traits_imp<const T[N]>
   {
      BOOST_STATIC_CONSTANT(bool, is_const = true);
      BOOST_STATIC_CONSTANT(bool, is_volatile = false);
      typedef T unqualified_type[N];
   };

   template <typename T, std::size_t N>
   struct cv_traits_imp<volatile T[N]>
   {
      BOOST_STATIC_CONSTANT(bool, is_const = false);
      BOOST_STATIC_CONSTANT(bool, is_volatile = true);
      typedef T unqualified_type[N];
   };

   template <typename T, std::size_t N>
   struct cv_traits_imp<const volatile T[N]>
   {
      BOOST_STATIC_CONSTANT(bool, is_const = true);
      BOOST_STATIC_CONSTANT(bool, is_volatile = true);
      typedef T unqualified_type[N];
   };

#else
#define BOOST_TT_AUX_CV_TRAITS_IMPL_PARAM(X) X *
template <typename T> struct cv_traits_imp {};

template <typename T>
struct cv_traits_imp<T*>
{
    BOOST_STATIC_CONSTANT(bool, is_const = false);
    BOOST_STATIC_CONSTANT(bool, is_volatile = false);
    typedef T unqualified_type;
};
#endif

template <typename T>
struct cv_traits_imp<BOOST_TT_AUX_CV_TRAITS_IMPL_PARAM(const T)>
{
    BOOST_STATIC_CONSTANT(bool, is_const = true);
    BOOST_STATIC_CONSTANT(bool, is_volatile = false);
    typedef T unqualified_type;
};

template <typename T>
struct cv_traits_imp<BOOST_TT_AUX_CV_TRAITS_IMPL_PARAM(volatile T)>
{
    BOOST_STATIC_CONSTANT(bool, is_const = false);
    BOOST_STATIC_CONSTANT(bool, is_volatile = true);
    typedef T unqualified_type;
};

template <typename T>
struct cv_traits_imp<BOOST_TT_AUX_CV_TRAITS_IMPL_PARAM(const volatile T)>
{
    BOOST_STATIC_CONSTANT(bool, is_const = true);
    BOOST_STATIC_CONSTANT(bool, is_volatile = true);
    typedef T unqualified_type;
};

} // namespace detail
} // namespace boost 


#endif // BOOST_TT_DETAIL_CV_TRAITS_IMPL_HPP_INCLUDED

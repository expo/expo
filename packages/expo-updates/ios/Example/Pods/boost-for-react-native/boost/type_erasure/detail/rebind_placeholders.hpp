// Boost.TypeErasure library
//
// Copyright 2011 Steven Watanabe
//
// Distributed under the Boost Software License Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
// $Id$

#if !defined(BOOST_PP_IS_ITERATING)

#ifndef BOOST_TYPE_ERASURE_DETAIL_REBIND_PLACEHOLDERS_HPP_INCLUDED
#define BOOST_TYPE_ERASURE_DETAIL_REBIND_PLACEHOLDERS_HPP_INCLUDED

#include <boost/mpl/eval_if.hpp>
#include <boost/mpl/identity.hpp>
#include <boost/mpl/at.hpp>
#include <boost/mpl/has_key.hpp>
#include <boost/mpl/not.hpp>
#include <boost/mpl/or.hpp>
#include <boost/mpl/assert.hpp>
#include <boost/preprocessor/cat.hpp>
#include <boost/preprocessor/iteration/iterate.hpp>
#include <boost/preprocessor/repetition/enum.hpp>
#include <boost/preprocessor/repetition/enum_params.hpp>
#include <boost/preprocessor/repetition/enum_trailing_params.hpp>
#include <boost/type_erasure/config.hpp>
#include <boost/type_erasure/is_placeholder.hpp>

namespace boost {
namespace type_erasure {

template<class F>
struct deduced;

namespace detail {

template<class T, class Bindings>
struct rebind_placeholders
{
    typedef void type;
};

template<class T>
struct identity
{
    typedef T type;
};

template<class T, class Bindings>
struct rebind_placeholders_in_argument
{
    BOOST_MPL_ASSERT((boost::mpl::or_<
        ::boost::mpl::not_< ::boost::type_erasure::is_placeholder<T> >,
        ::boost::mpl::has_key<Bindings, T>
    >));
    typedef typename ::boost::mpl::eval_if<
        ::boost::type_erasure::is_placeholder<T>,
        ::boost::mpl::at<Bindings, T>,
        ::boost::type_erasure::detail::identity<T>
    >::type type;
};

template<class T, class Bindings>
struct rebind_placeholders_in_argument<T&, Bindings>
{
    typedef typename ::boost::type_erasure::detail::rebind_placeholders_in_argument<
        T,
        Bindings
    >::type& type;
};

#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES

template<class T, class Bindings>
struct rebind_placeholders_in_argument<T&&, Bindings>
{
    typedef typename ::boost::type_erasure::detail::rebind_placeholders_in_argument<
        T,
        Bindings
    >::type&& type;
};

#endif

template<class T, class Bindings>
struct rebind_placeholders_in_argument<const T, Bindings>
{
    typedef const typename ::boost::type_erasure::detail::rebind_placeholders_in_argument<
        T,
        Bindings
    >::type type;
};

template<class F, class Bindings>
struct rebind_placeholders_in_deduced
{
    typedef typename ::boost::type_erasure::deduced<
        typename ::boost::type_erasure::detail::rebind_placeholders<F, Bindings>::type
    >::type type;
};

template<class F, class Bindings>
struct rebind_placeholders_in_argument<
    ::boost::type_erasure::deduced<F>,
    Bindings
> 
{
    typedef typename ::boost::mpl::eval_if<
        ::boost::mpl::has_key<Bindings, ::boost::type_erasure::deduced<F> >,
        ::boost::mpl::at<Bindings, ::boost::type_erasure::deduced<F> >,
        ::boost::type_erasure::detail::rebind_placeholders_in_deduced<
            F,
            Bindings
        >
    >::type type;
};

#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

template<template<class...> class T, class... U, class Bindings>
struct rebind_placeholders<T<U...>, Bindings>
{
    typedef T<typename rebind_placeholders_in_argument<U, Bindings>::type...> type;
};

template<class R, class... T, class Bindings>
struct rebind_placeholders_in_argument<R(T...), Bindings>
{
    typedef typename ::boost::type_erasure::detail::rebind_placeholders_in_argument<
        R,
        Bindings
    >::type type(typename rebind_placeholders_in_argument<T, Bindings>::type...);
};

#else

#define BOOST_PP_FILENAME_1 <boost/type_erasure/detail/rebind_placeholders.hpp>
#define BOOST_PP_ITERATION_LIMITS (0, BOOST_TYPE_ERASURE_MAX_ARITY)
#include BOOST_PP_ITERATE()

#endif

}
}
}

#endif

#else

#define N BOOST_PP_ITERATION()
#define BOOST_TYPE_ERASURE_REBIND(z, n, data)                           \
    typename rebind_placeholders_in_argument<BOOST_PP_CAT(data, n), Bindings>::type

#if N != 0

template<template<BOOST_PP_ENUM_PARAMS(N, class T)> class T,
    BOOST_PP_ENUM_PARAMS(N, class T), class Bindings>
struct rebind_placeholders<T<BOOST_PP_ENUM_PARAMS(N, T)>, Bindings>
{
    typedef T<BOOST_PP_ENUM(N, BOOST_TYPE_ERASURE_REBIND, T)> type;
};

#endif

template<class R
    BOOST_PP_ENUM_TRAILING_PARAMS(N, class T), class Bindings>
struct rebind_placeholders_in_argument<R(BOOST_PP_ENUM_PARAMS(N, T)), Bindings>
{
    typedef typename ::boost::type_erasure::detail::rebind_placeholders_in_argument<
        R,
        Bindings
    >::type type(BOOST_PP_ENUM(N, BOOST_TYPE_ERASURE_REBIND, T));
};

#undef BOOST_TYPE_ERASURE_REBIND
#undef N

#endif

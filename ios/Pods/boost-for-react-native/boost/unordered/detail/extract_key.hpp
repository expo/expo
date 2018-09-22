
// Copyright (C) 2005-2011 Daniel James
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_UNORDERED_DETAIL_EXTRACT_KEY_HPP_INCLUDED
#define BOOST_UNORDERED_DETAIL_EXTRACT_KEY_HPP_INCLUDED

#include <boost/config.hpp>
#if defined(BOOST_HAS_PRAGMA_ONCE)
#pragma once
#endif

#include <boost/unordered/detail/table.hpp>

namespace boost {
namespace unordered {
namespace detail {

    // key extractors
    //
    // no throw
    //
    // 'extract_key' is called with the emplace parameters to return a
    // key if available or 'no_key' is one isn't and will need to be
    // constructed. This could be done by overloading the emplace implementation
    // for the different cases, but that's a bit tricky on compilers without
    // variadic templates.

    struct no_key {
        no_key() {}
        template <class T> no_key(T const&) {}
    };

    template <typename Key, typename T>
    struct is_key {
        template <typename T2>
        static choice1::type test(T2 const&);
        static choice2::type test(Key const&);
        
        enum { value = sizeof(test(boost::unordered::detail::make<T>())) ==
            sizeof(choice2::type) };
        
        typedef typename boost::detail::if_true<value>::
            BOOST_NESTED_TEMPLATE then<Key const&, no_key>::type type;
    };

    template <class ValueType>
    struct set_extractor
    {
        typedef ValueType value_type;
        typedef ValueType key_type;

        static key_type const& extract(value_type const& v)
        {
            return v;
        }

        static no_key extract()
        {
            return no_key();
        }
        
        template <class Arg>
        static no_key extract(Arg const&)
        {
            return no_key();
        }

#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)
        template <class Arg1, class Arg2, class... Args>
        static no_key extract(Arg1 const&, Arg2 const&, Args const&...)
        {
            return no_key();
        }
#else
        template <class Arg1, class Arg2>
        static no_key extract(Arg1 const&, Arg2 const&)
        {
            return no_key();
        }
#endif
    };

    template <class Key, class ValueType>
    struct map_extractor
    {
        typedef ValueType value_type;
        typedef typename boost::remove_const<Key>::type key_type;

        static key_type const& extract(value_type const& v)
        {
            return v.first;
        }
            
        template <class Second>
        static key_type const& extract(std::pair<key_type, Second> const& v)
        {
            return v.first;
        }

        template <class Second>
        static key_type const& extract(
            std::pair<key_type const, Second> const& v)
        {
            return v.first;
        }

        template <class Arg1>
        static key_type const& extract(key_type const& k, Arg1 const&)
        {
            return k;
        }

        static no_key extract()
        {
            return no_key();
        }

        template <class Arg>
        static no_key extract(Arg const&)
        {
            return no_key();
        }

        template <class Arg1, class Arg2>
        static no_key extract(Arg1 const&, Arg2 const&)
        {
            return no_key();
        }

#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)
        template <class Arg1, class Arg2, class Arg3, class... Args>
        static no_key extract(Arg1 const&, Arg2 const&, Arg3 const&,
                Args const&...)
        {
            return no_key();
        }
#endif

#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

#define BOOST_UNORDERED_KEY_FROM_TUPLE(namespace_)                          \
        template <typename T2>                                              \
        static no_key extract(boost::unordered::piecewise_construct_t,      \
                namespace_ tuple<> const&, T2 const&)                       \
        {                                                                   \
            return no_key();                                                \
        }                                                                   \
                                                                            \
        template <typename T, typename T2>                                  \
        static typename is_key<key_type, T>::type                           \
            extract(boost::unordered::piecewise_construct_t,                \
                namespace_ tuple<T> const& k, T2 const&)                    \
        {                                                                   \
            return typename is_key<key_type, T>::type(                      \
                namespace_ get<0>(k));                                      \
        }

#else

#define BOOST_UNORDERED_KEY_FROM_TUPLE(namespace_)                          \
        static no_key extract(boost::unordered::piecewise_construct_t,      \
                namespace_ tuple<> const&)                                  \
        {                                                                   \
            return no_key();                                                \
        }                                                                   \
                                                                            \
        template <typename T>                                               \
        static typename is_key<key_type, T>::type                           \
            extract(boost::unordered::piecewise_construct_t,                \
                namespace_ tuple<T> const& k)                               \
        {                                                                   \
            return typename is_key<key_type, T>::type(                      \
                namespace_ get<0>(k));                                      \
        }

#endif

BOOST_UNORDERED_KEY_FROM_TUPLE(boost::)

#if !defined(BOOST_NO_CXX11_HDR_TUPLE)
BOOST_UNORDERED_KEY_FROM_TUPLE(std::)
#endif
    };
}}}

#endif

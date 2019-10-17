/*
 (c) 2014 Glen Joseph Fernandes
 glenjofe at gmail dot com

 Distributed under the Boost Software
 License, Version 1.0.
 http://boost.org/LICENSE_1_0.txt
*/
#ifndef BOOST_ALIGN_DETAIL_REMOVE_TRAITS_HPP
#define BOOST_ALIGN_DETAIL_REMOVE_TRAITS_HPP

#include <boost/config.hpp>

#if !defined(BOOST_NO_CXX11_HDR_TYPE_TRAITS)
#include <type_traits>
#else
#include <cstddef>
#endif

namespace boost {
    namespace alignment {
        namespace detail {
#if !defined(BOOST_NO_CXX11_HDR_TYPE_TRAITS)
            using std::remove_reference;
            using std::remove_all_extents;
            using std::remove_cv;
#else
            template<class T>
            struct remove_reference {
                typedef T type;
            };

            template<class T>
            struct remove_reference<T&> {
                typedef T type;
            };

#if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
            template<class T>
            struct remove_reference<T&&> {
                typedef T type;
            };
#endif

            template<class T>
            struct remove_all_extents {
                typedef T type;
            };

            template<class T>
            struct remove_all_extents<T[]> {
                typedef typename remove_all_extents<T>::type type;
            };

            template<class T, std::size_t N>
            struct remove_all_extents<T[N]> {
                typedef typename remove_all_extents<T>::type type;
            };

            template<class T>
            struct remove_const {
                typedef T type;
            };

            template<class T>
            struct remove_const<const T> {
                typedef T type;
            };

            template<class T>
            struct remove_volatile {
                typedef T type;
            };

            template<class T>
            struct remove_volatile<volatile T> {
                typedef T type;
            };

            template<class T>
            struct remove_cv {
                typedef typename remove_volatile<typename
                    remove_const<T>::type>::type type;
            };
#endif
        }
    }
}

#endif

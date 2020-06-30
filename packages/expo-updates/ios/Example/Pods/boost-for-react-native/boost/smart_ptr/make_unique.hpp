/*
(c) 2014-2015 Glen Joseph Fernandes
<glenjofe -at- gmail.com>

Distributed under the Boost Software
License, Version 1.0.
http://boost.org/LICENSE_1_0.txt
*/
#ifndef BOOST_SMART_PTR_MAKE_UNIQUE_HPP
#define BOOST_SMART_PTR_MAKE_UNIQUE_HPP

#include <boost/config.hpp>
#include <memory>
#include <utility>

namespace boost {
namespace detail {
template<class T>
struct up_if_object {
    typedef std::unique_ptr<T> type;
};

template<class T>
struct up_if_object<T[]> { };

template<class T, std::size_t N>
struct up_if_object<T[N]> { };

template<class T>
struct up_if_array { };

template<class T>
struct up_if_array<T[]> {
    typedef std::unique_ptr<T[]> type;
};

template<class T>
struct up_remove_reference {
    typedef T type;
};

template<class T>
struct up_remove_reference<T&> {
    typedef T type;
};

template<class T>
struct up_remove_reference<T&&> {
    typedef T type;
};

template<class T>
struct up_element { };

template<class T>
struct up_element<T[]> {
    typedef T type;
};
} /* detail */

template<class T>
inline typename detail::up_if_object<T>::type make_unique()
{
    return std::unique_ptr<T>(new T());
}

#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)
template<class T, class... Args>
inline typename detail::up_if_object<T>::type
    make_unique(Args&&... args)
{
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}
#endif

template<class T>
inline typename detail::up_if_object<T>::type
    make_unique(typename detail::up_remove_reference<T>::type&& value)
{
    return std::unique_ptr<T>(new T(std::move(value)));
}

template<class T>
inline typename detail::up_if_object<T>::type make_unique_noinit()
{
    return std::unique_ptr<T>(new T);
}

template<class T>
inline typename detail::up_if_array<T>::type make_unique(std::size_t n)
{
    return std::unique_ptr<T>(new
        typename detail::up_element<T>::type[n]());
}

template<class T>
inline typename detail::up_if_array<T>::type
    make_unique_noinit(std::size_t n)
{
    return std::unique_ptr<T>(new
        typename detail::up_element<T>::type[n]);
}
} /* boost */

#endif

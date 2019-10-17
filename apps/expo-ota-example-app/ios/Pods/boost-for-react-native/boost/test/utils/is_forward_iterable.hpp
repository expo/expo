//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//! @file
//! Defines the is_forward_iterable collection type trait
// ***************************************************************************

#ifndef BOOST_TEST_UTILS_IS_FORWARD_ITERABLE_HPP
#define BOOST_TEST_UTILS_IS_FORWARD_ITERABLE_HPP

#if defined(BOOST_NO_CXX11_DECLTYPE) || \
    defined(BOOST_NO_CXX11_NULLPTR) || \
    defined(BOOST_NO_CXX11_TRAILING_RESULT_TYPES)

  // some issues with boost.config
  #if !defined(BOOST_MSVC) || BOOST_MSVC_FULL_VER < 170061030 /* VC2012 upd 5 */
    #define BOOST_TEST_FWD_ITERABLE_CXX03
  #endif
#endif

#if defined(BOOST_TEST_FWD_ITERABLE_CXX03)
// Boost
#include <boost/mpl/bool.hpp>

// STL
#include <list>
#include <vector>
#include <map>
#include <set>

#else

// Boost
#include <boost/utility/declval.hpp>
#include <boost/type_traits/is_same.hpp>
#include <boost/type_traits/remove_reference.hpp>
#include <boost/type_traits/remove_cv.hpp>
#include <boost/test/utils/is_cstring.hpp>

// STL
#include <utility>
#include <type_traits>

#endif
//____________________________________________________________________________//

namespace boost {
namespace unit_test {

// ************************************************************************** //
// **************             is_forward_iterable              ************** //
// ************************************************************************** //

#if defined(BOOST_TEST_FWD_ITERABLE_CXX03) && !defined(BOOST_TEST_DOXYGEN_DOC__)
template<typename T>
struct is_forward_iterable : public mpl::false_ {};

template<typename T>
struct is_forward_iterable<T const> : public is_forward_iterable<T> {};

template<typename T>
struct is_forward_iterable<T&> : public is_forward_iterable<T> {};

template<typename T, typename A>
struct is_forward_iterable< std::vector<T, A> > : public mpl::true_ {};

template<typename T, typename A>
struct is_forward_iterable< std::list<T, A> > : public mpl::true_ {};

template<typename K, typename V, typename C, typename A>
struct is_forward_iterable< std::map<K, V, C, A> > : public mpl::true_ {};

template<typename K, typename C, typename A>
struct is_forward_iterable< std::set<K, C, A> > : public mpl::true_ {};

// string is also forward iterable, even if sometimes we want to treat the
// assertions differently.
template<>
struct is_forward_iterable< std::string > : public mpl::true_ {};

#else

namespace ut_detail {

template<typename T>
struct is_present : public mpl::true_ {};

//____________________________________________________________________________//

// some compiler do not implement properly decltype non expression involving members (eg. VS2013)
// a workaround is to use -> decltype syntax.
template <class T>
struct has_member_size {
private:
    struct nil_t {};
    template<typename U> static auto  test( U* ) -> decltype(boost::declval<U>().size());
    template<typename>   static nil_t test( ... );

public:
    static bool const value = !std::is_same< decltype(test<T>( nullptr )), nil_t>::value;
};

//____________________________________________________________________________//

template <class T>
struct has_member_begin {
private:
    struct nil_t {};
    template<typename U>  static auto  test( U* ) -> decltype(boost::declval<U>().begin());
    template<typename>    static nil_t test( ... );
public:
    static bool const value = !std::is_same< decltype(test<T>( nullptr )), nil_t>::value;
};

//____________________________________________________________________________//

template <class T>
struct has_member_end {
private:
    struct nil_t {};
    template<typename U>  static auto  test( U* ) -> decltype(boost::declval<U>().end());
    template<typename>    static nil_t test( ... );
public:
    static bool const value = !std::is_same< decltype(test<T>( nullptr )), nil_t>::value;
};

//____________________________________________________________________________//

template <class T, class enabled = void>
struct is_forward_iterable_impl : std::false_type {
};

//____________________________________________________________________________//

template <class T>
struct is_forward_iterable_impl<
    T,
    typename std::enable_if<
    is_present<typename T::const_iterator>::value &&
    is_present<typename T::value_type>::value &&
    has_member_size<T>::value &&
    has_member_begin<T>::value &&
    has_member_end<T>::value &&
    !is_cstring<T>::value
    >::type
> : std::true_type
{};

//____________________________________________________________________________//

} // namespace ut_detail

/*! Indicates that a specific type implements the forward iterable concept. */
template<typename T>
struct is_forward_iterable {
    typedef typename std::remove_reference<T>::type T_ref;
    typedef ut_detail::is_forward_iterable_impl<T_ref> is_fwd_it_t;
    typedef mpl::bool_<is_fwd_it_t::value> type;
    enum { value = is_fwd_it_t::value };
};

#endif /* defined(BOOST_TEST_FWD_ITERABLE_CXX03) */

} // namespace unit_test
} // namespace boost

#endif // BOOST_TEST_UTILS_IS_FORWARD_ITERABLE_HPP

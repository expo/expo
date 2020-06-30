// Boost.Geometry Index
//
// Copyright (c) 2011-2013 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_DETAIL_TUPLES_HPP
#define BOOST_GEOMETRY_INDEX_DETAIL_TUPLES_HPP

#include <boost/tuple/tuple.hpp>
#include <boost/type_traits/is_same.hpp>

// TODO move this to index/tuples and separate algorithms

namespace boost { namespace geometry { namespace index { namespace detail {

namespace tuples {

// find_index

namespace detail {

template <typename Tuple, typename El, size_t N>
struct find_index;

template <typename Tuple, typename El, size_t N, typename CurrentEl>
struct find_index_impl
{
    static const size_t value = find_index<Tuple, El, N - 1>::value;
};

template <typename Tuple, typename El, size_t N>
struct find_index_impl<Tuple, El, N, El>
{
    static const size_t value = N - 1;
};

template <typename Tuple, typename El, typename CurrentEl>
struct find_index_impl<Tuple, El, 1, CurrentEl>
{
    BOOST_MPL_ASSERT_MSG(
        (false),
        ELEMENT_NOT_FOUND,
        (find_index_impl));
};

template <typename Tuple, typename El>
struct find_index_impl<Tuple, El, 1, El>
{
    static const size_t value = 0;
};

template <typename Tuple, typename El, size_t N>
struct find_index
{
    static const size_t value =
        find_index_impl<
            Tuple,
            El,
            N,
            typename boost::tuples::element<N - 1, Tuple>::type
        >::value;
};

} // namespace detail

template <typename Tuple, typename El>
struct find_index
{
    static const size_t value =
        detail::find_index<
            Tuple,
            El,
            boost::tuples::length<Tuple>::value
        >::value;
};

// has

namespace detail {

template <typename Tuple, typename El, size_t N>
struct has
{
    static const bool value
        = boost::is_same<
            typename boost::tuples::element<N - 1, Tuple>::type,
            El
        >::value
        || has<Tuple, El, N - 1>::value;
};

template <typename Tuple, typename El>
struct has<Tuple, El, 1>
{
    static const bool value
        = boost::is_same<
            typename boost::tuples::element<0, Tuple>::type,
            El
        >::value;
};

} // namespace detail

template <typename Tuple, typename El>
struct has
{
    static const bool value
        = detail::has<
            Tuple,
            El,
            boost::tuples::length<Tuple>::value
        >::value;
};

// add

template <typename Tuple, typename El>
struct add
{
    BOOST_MPL_ASSERT_MSG(
        (false),
        NOT_IMPLEMENTED_FOR_THIS_TUPLE_TYPE,
        (add));
};

template <typename T1, typename T>
struct add<boost::tuple<T1>, T>
{
    typedef boost::tuple<T1, T> type;
};

template <typename T1, typename T2, typename T>
struct add<boost::tuple<T1, T2>, T>
{
    typedef boost::tuple<T1, T2, T> type;
};

// add_if

template <typename Tuple, typename El, bool Cond>
struct add_if
{
    typedef Tuple type;
};

template <typename Tuple, typename El>
struct add_if<Tuple, El, true>
{
    typedef typename add<Tuple, El>::type type;
};

// add_unique

template <typename Tuple, typename El>
struct add_unique
{
    typedef typename add_if<
        Tuple,
        El,
        !has<Tuple, El>::value
    >::type type;
};

template <typename Tuple,
          typename T,
          size_t I = 0,
          size_t N = boost::tuples::length<Tuple>::value>
struct push_back
{
    typedef
    boost::tuples::cons<
        typename boost::tuples::element<I, Tuple>::type,
        typename push_back<Tuple, T, I+1, N>::type
    > type;

    static type apply(Tuple const& tup, T const& t)
    {
        return
        type(
            boost::get<I>(tup),
            push_back<Tuple, T, I+1, N>::apply(tup, t)
        );
    }
};

template <typename Tuple, typename T, size_t N>
struct push_back<Tuple, T, N, N>
{
    typedef boost::tuples::cons<T, boost::tuples::null_type> type;

    static type apply(Tuple const&, T const& t)
    {
        return type(t, boost::tuples::null_type());
    }
};

} // namespace tuples

}}}} // namespace boost::geometry::index::detail

#endif // BOOST_GEOMETRY_INDEX_DETAIL_RTREE_TAGS_HPP

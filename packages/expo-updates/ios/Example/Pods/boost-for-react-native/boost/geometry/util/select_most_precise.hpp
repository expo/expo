// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// This file was modified by Oracle on 2014.
// Modifications copyright (c) 2014 Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_UTIL_SELECT_MOST_PRECISE_HPP
#define BOOST_GEOMETRY_UTIL_SELECT_MOST_PRECISE_HPP

#include <boost/mpl/if.hpp>
#include <boost/type_traits/is_floating_point.hpp>
#include <boost/type_traits/is_fundamental.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL

namespace detail { namespace select_most_precise
{


// At least one of the types is non-fundamental. Take that one.
// if both are non-fundamental, the type-to-be-selected
// is unknown, it should be defined by explicit specialization.
template <bool Fundamental1, bool Fundamental2, typename T1, typename T2>
struct select_non_fundamental
{
    typedef T1 type;
};

template <typename T1, typename T2>
struct select_non_fundamental<true, false, T1, T2>
{
    typedef T2 type;
};

template <typename T1, typename T2>
struct select_non_fundamental<false, true, T1, T2>
{
    typedef T1 type;
};


// Selection of largest type (e.g. int of <short int,int>
// It defaults takes the first one, if second is larger, take the second one
template <bool SecondLarger, typename T1, typename T2>
struct select_largest
{
    typedef T1 type;
};

template <typename T1, typename T2>
struct select_largest<true, T1, T2>
{
    typedef T2 type;
};



// Selection of floating point and specializations:
// both FP or both !FP does never occur...
template <bool FP1, bool FP2, typename T1, typename T2>
struct select_floating_point
{
    typedef char type;
};


// ... so if ONE but not both of these types is floating point, take that one
template <typename T1, typename T2>
struct select_floating_point<true, false, T1, T2>
{
    typedef T1 type;
};


template <typename T1, typename T2>
struct select_floating_point<false, true, T1, T2>
{
    typedef T2 type;
};


}} // namespace detail::select_most_precise
#endif // DOXYGEN_NO_DETAIL


/*!
    \brief Meta-function to select, of two types, the most accurate type for
        calculations
    \ingroup utility
    \details select_most_precise classes, compares two types on compile time.
    For example, if an addition must be done with a double and an integer, the
        result must be a double.
    If both types are integer, the result can be an integer.
    \note It is different from the "promote" class, already in boost. That
        class promotes e.g. a (one) float to a double. This class selects a
        type from two types. It takes the most accurate, but does not promote
        afterwards.
    \note This traits class is completely independant from GGL and might be a
        separate addition to Boost
    \note If the input is a non-fundamental type, it might be a calculation
        type such as a GMP-value or another high precision value. Therefore,
        if one is non-fundamental, that one is chosen.
    \note If both types are non-fundamental, the result is indeterminate and
        currently the first one is chosen.
*/
template <typename T1, typename T2 = void, typename T3 = void>
struct select_most_precise
{
    typedef typename select_most_precise
        <
            typename select_most_precise<T1, T2>::type,
            T3
        >::type type;
};

template <typename T1, typename T2>
struct select_most_precise<T1, T2, void>
{
    static const bool second_larger = sizeof(T2) > sizeof(T1);
    static const bool one_not_fundamental = !
        (boost::is_fundamental<T1>::type::value
          && boost::is_fundamental<T2>::type::value);

    static const bool both_same =
        boost::is_floating_point<T1>::type::value
        == boost::is_floating_point<T2>::type::value;

    typedef typename boost::mpl::if_c
        <
            one_not_fundamental,
            typename detail::select_most_precise::select_non_fundamental
            <
                boost::is_fundamental<T1>::type::value,
                boost::is_fundamental<T2>::type::value,
                T1,
                T2
            >::type,
            typename boost::mpl::if_c
            <
                both_same,
                typename detail::select_most_precise::select_largest
                <
                    second_larger,
                    T1,
                    T2
                >::type,
                typename detail::select_most_precise::select_floating_point
                <
                    boost::is_floating_point<T1>::type::value,
                    boost::is_floating_point<T2>::type::value,
                    T1,
                    T2
                >::type
            >::type
        >::type type;
};

template <typename T1>
struct select_most_precise<T1, void, void>
{
    typedef T1 type;
};

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_UTIL_SELECT_MOST_PRECISE_HPP

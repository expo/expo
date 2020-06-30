// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_UTIL_PARAMETER_TYPE_OF_HPP
#define BOOST_GEOMETRY_UTIL_PARAMETER_TYPE_OF_HPP


#include <boost/function_types/function_arity.hpp>
#include <boost/function_types/is_member_function_pointer.hpp>
#include <boost/function_types/parameter_types.hpp>
#include <boost/mpl/at.hpp>
#include <boost/mpl/int.hpp>
#include <boost/mpl/plus.hpp>
#include <boost/type_traits/remove_reference.hpp>


namespace boost { namespace geometry
{


/*!
\brief Meta-function selecting a parameter type of a (member) function, by index
\ingroup utility
 */
template <typename Method, std::size_t Index>
struct parameter_type_of
{
    typedef typename boost::function_types::parameter_types
        <
            Method
        >::type parameter_types;

    typedef typename boost::mpl::if_
        <
            boost::function_types::is_member_function_pointer<Method>,
            boost::mpl::int_<1>,
            boost::mpl::int_<0>
        >::type base_index_type;

    typedef typename boost::mpl::if_c
        <
            Index == 0,
            base_index_type,
            typename boost::mpl::plus
                <
                    base_index_type,
                    boost::mpl::int_<Index>
                >::type
        >::type indexed_type;

    typedef typename boost::remove_reference
        <
            typename boost::mpl::at
                <
                    parameter_types,
                    indexed_type
                >::type
        >::type type;
};


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_UTIL_PARAMETER_TYPE_OF_HPP

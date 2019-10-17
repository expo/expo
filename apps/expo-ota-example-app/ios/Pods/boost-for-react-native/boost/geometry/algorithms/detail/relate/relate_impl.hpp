// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2013, 2014, 2015.
// Modifications copyright (c) 2013-2015 Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_RELATE_IMPL_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_RELATE_IMPL_HPP

#include <boost/mpl/if.hpp>
#include <boost/mpl/or.hpp>
#include <boost/type_traits/is_base_of.hpp>

#include <boost/geometry/algorithms/detail/relate/interface.hpp>
#include <boost/geometry/algorithms/not_implemented.hpp>
#include <boost/geometry/core/tag.hpp>

namespace boost { namespace geometry {


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace relate {

struct implemented_tag {};

template <template <typename, typename> class StaticMaskTrait,
          typename Geometry1,
          typename Geometry2>
struct relate_impl
    : boost::mpl::if_
        <
            boost::mpl::or_
                <
                    boost::is_base_of
                        <
                            nyi::not_implemented_tag,
                            StaticMaskTrait<Geometry1, Geometry2>
                        >,
                    boost::is_base_of
                        <
                            nyi::not_implemented_tag,
                            dispatch::relate<Geometry1, Geometry2>
                        >
                >,
            not_implemented
                <
                    typename geometry::tag<Geometry1>::type,
                    typename geometry::tag<Geometry2>::type
                >,
            implemented_tag
        >::type
{
    static inline bool apply(Geometry1 const& g1, Geometry2 const& g2)
    {
        typename detail::relate::result_handler_type
            <
                Geometry1,
                Geometry2,
                typename StaticMaskTrait<Geometry1, Geometry2>::type
            >::type handler;

        dispatch::relate<Geometry1, Geometry2>::apply(g1, g2, handler);

        return handler.result();
    }
};

}} // namespace detail::relate
#endif // DOXYGEN_NO_DETAIL

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_RELATE_IMPL_HPP

// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2014 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2014.
// Modifications copyright (c) 2014 Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_UNION_HPP
#define BOOST_GEOMETRY_ALGORITHMS_UNION_HPP


#include <boost/range/metafunctions.hpp>

#include <boost/geometry/core/is_areal.hpp>
#include <boost/geometry/core/point_order.hpp>
#include <boost/geometry/core/reverse_dispatch.hpp>
#include <boost/geometry/geometries/concepts/check.hpp>
#include <boost/geometry/algorithms/not_implemented.hpp>
#include <boost/geometry/algorithms/detail/overlay/overlay.hpp>
#include <boost/geometry/policies/robustness/get_rescale_policy.hpp>

#include <boost/geometry/algorithms/detail/overlay/linear_linear.hpp>
#include <boost/geometry/algorithms/detail/overlay/pointlike_pointlike.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

template
<
    typename Geometry1, typename Geometry2, typename GeometryOut,
    typename TagIn1 = typename tag<Geometry1>::type,
    typename TagIn2 = typename tag<Geometry2>::type,
    typename TagOut = typename tag<GeometryOut>::type,
    bool Areal1 = geometry::is_areal<Geometry1>::value,
    bool Areal2 = geometry::is_areal<Geometry2>::value,
    bool ArealOut = geometry::is_areal<GeometryOut>::value,
    bool Reverse1 = detail::overlay::do_reverse<geometry::point_order<Geometry1>::value>::value,
    bool Reverse2 = detail::overlay::do_reverse<geometry::point_order<Geometry2>::value>::value,
    bool ReverseOut = detail::overlay::do_reverse<geometry::point_order<GeometryOut>::value>::value,
    bool Reverse = geometry::reverse_dispatch<Geometry1, Geometry2>::type::value
>
struct union_insert: not_implemented<TagIn1, TagIn2, TagOut>
{};


// If reversal is needed, perform it first

template
<
    typename Geometry1, typename Geometry2, typename GeometryOut,
    typename TagIn1, typename TagIn2, typename TagOut,
    bool Areal1, bool Areal2, bool ArealOut,
    bool Reverse1, bool Reverse2, bool ReverseOut
>
struct union_insert
    <
        Geometry1, Geometry2, GeometryOut,
        TagIn1, TagIn2, TagOut,
        Areal1, Areal2, ArealOut,
        Reverse1, Reverse2, ReverseOut,
        true
    >: union_insert<Geometry2, Geometry1, GeometryOut>
{
    template <typename RobustPolicy, typename OutputIterator, typename Strategy>
    static inline OutputIterator apply(Geometry1 const& g1,
            Geometry2 const& g2,
            RobustPolicy const& robust_policy,
            OutputIterator out,
            Strategy const& strategy)
    {
        return union_insert
            <
                Geometry2, Geometry1, GeometryOut
            >::apply(g2, g1, robust_policy, out, strategy);
    }
};


template
<
    typename Geometry1, typename Geometry2, typename GeometryOut,
    typename TagIn1, typename TagIn2, typename TagOut,
    bool Reverse1, bool Reverse2, bool ReverseOut
>
struct union_insert
    <
        Geometry1, Geometry2, GeometryOut,
        TagIn1, TagIn2, TagOut,
        true, true, true,
        Reverse1, Reverse2, ReverseOut,
        false
    > : detail::overlay::overlay
        <Geometry1, Geometry2, Reverse1, Reverse2, ReverseOut, GeometryOut, overlay_union>
{};


// dispatch for union of non-areal geometries
template
<
    typename Geometry1, typename Geometry2, typename GeometryOut,
    typename TagIn1, typename TagIn2, typename TagOut,
    bool Reverse1, bool Reverse2, bool ReverseOut
>
struct union_insert
    <
        Geometry1, Geometry2, GeometryOut,
        TagIn1, TagIn2, TagOut,
        false, false, false,
        Reverse1, Reverse2, ReverseOut,
        false
    > : union_insert
        <
            Geometry1, Geometry2, GeometryOut,
            typename tag_cast<TagIn1, pointlike_tag, linear_tag>::type,
            typename tag_cast<TagIn2, pointlike_tag, linear_tag>::type,
            TagOut,
            false, false, false,
            Reverse1, Reverse2, ReverseOut,
            false
        >
{};


// dispatch for union of linear geometries
template
<
    typename Linear1, typename Linear2, typename LineStringOut,
    bool Reverse1, bool Reverse2, bool ReverseOut
>
struct union_insert
    <
        Linear1, Linear2, LineStringOut,
        linear_tag, linear_tag, linestring_tag,
        false, false, false,
        Reverse1, Reverse2, ReverseOut,
        false
    > : detail::overlay::linear_linear_linestring
        <
            Linear1, Linear2, LineStringOut, overlay_union
        >
{};


// dispatch for point-like geometries
template
<
    typename PointLike1, typename PointLike2, typename PointOut,
    bool Reverse1, bool Reverse2, bool ReverseOut
>
struct union_insert
    <
        PointLike1, PointLike2, PointOut,
        pointlike_tag, pointlike_tag, point_tag,
        false, false, false,
        Reverse1, Reverse2, ReverseOut,
        false
    > : detail::overlay::union_pointlike_pointlike_point
        <
            PointLike1, PointLike2, PointOut
        >
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace union_
{

/*!
\brief_calc2{union}
\ingroup union
\details \details_calc2{union_insert, spatial set theoretic union}.
    \details_insert{union}
\tparam GeometryOut output geometry type, must be specified
\tparam Geometry1 \tparam_geometry
\tparam Geometry2 \tparam_geometry
\tparam OutputIterator output iterator
\param geometry1 \param_geometry
\param geometry2 \param_geometry
\param out \param_out{union}
\return \return_out
*/
template
<
    typename GeometryOut,
    typename Geometry1,
    typename Geometry2,
    typename OutputIterator
>
inline OutputIterator union_insert(Geometry1 const& geometry1,
            Geometry2 const& geometry2,
            OutputIterator out)
{
    concepts::check<Geometry1 const>();
    concepts::check<Geometry2 const>();
    concepts::check<GeometryOut>();

    typedef typename geometry::rescale_overlay_policy_type
        <
            Geometry1,
            Geometry2
        >::type rescale_policy_type;

    typedef intersection_strategies
        <
            typename cs_tag<GeometryOut>::type,
            Geometry1,
            Geometry2,
            typename geometry::point_type<GeometryOut>::type,
            rescale_policy_type
        > strategy;

    rescale_policy_type robust_policy
            = geometry::get_rescale_policy<rescale_policy_type>(geometry1, geometry2);

    return dispatch::union_insert
           <
               Geometry1, Geometry2, GeometryOut
           >::apply(geometry1, geometry2, robust_policy, out, strategy());
}


}} // namespace detail::union_
#endif // DOXYGEN_NO_DETAIL




/*!
\brief Combines two geometries which each other
\ingroup union
\details \details_calc2{union, spatial set theoretic union}.
\tparam Geometry1 \tparam_geometry
\tparam Geometry2 \tparam_geometry
\tparam Collection output collection, either a multi-geometry,
    or a std::vector<Geometry> / std::deque<Geometry> etc
\param geometry1 \param_geometry
\param geometry2 \param_geometry
\param output_collection the output collection
\note Called union_ because union is a reserved word.

\qbk{[include reference/algorithms/union.qbk]}
*/
template
<
    typename Geometry1,
    typename Geometry2,
    typename Collection
>
inline void union_(Geometry1 const& geometry1,
            Geometry2 const& geometry2,
            Collection& output_collection)
{
    concepts::check<Geometry1 const>();
    concepts::check<Geometry2 const>();

    typedef typename boost::range_value<Collection>::type geometry_out;
    concepts::check<geometry_out>();

    detail::union_::union_insert<geometry_out>(geometry1, geometry2,
                range::back_inserter(output_collection));
}


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_UNION_HPP

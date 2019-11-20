// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2014.
// Modifications copyright (c) 2014, Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_INTERSECTION_INTERFACE_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_INTERSECTION_INTERFACE_HPP


// TODO: those headers probably may be removed
#include <boost/geometry/core/coordinate_dimension.hpp>
#include <boost/geometry/algorithms/intersects.hpp>

#include <boost/geometry/algorithms/detail/overlay/intersection_insert.hpp>
#include <boost/geometry/policies/robustness/get_rescale_policy.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

// By default, all is forwarded to the intersection_insert-dispatcher
template
<
    typename Geometry1, typename Geometry2,
    typename Tag1 = typename geometry::tag<Geometry1>::type,
    typename Tag2 = typename geometry::tag<Geometry2>::type,
    bool Reverse = reverse_dispatch<Geometry1, Geometry2>::type::value
>
struct intersection
{
    template <typename RobustPolicy, typename GeometryOut, typename Strategy>
    static inline bool apply(Geometry1 const& geometry1,
            Geometry2 const& geometry2,
            RobustPolicy const& robust_policy,
            GeometryOut& geometry_out,
            Strategy const& strategy)
    {
        typedef typename boost::range_value<GeometryOut>::type OneOut;

        intersection_insert
        <
            Geometry1, Geometry2, OneOut,
            overlay_intersection
        >::apply(geometry1, geometry2, robust_policy, range::back_inserter(geometry_out), strategy);

        return true;
    }

};


// If reversal is needed, perform it
template
<
    typename Geometry1, typename Geometry2,
    typename Tag1, typename Tag2
>
struct intersection
<
    Geometry1, Geometry2,
    Tag1, Tag2,
    true
>
    : intersection<Geometry2, Geometry1, Tag2, Tag1, false>
{
    template <typename RobustPolicy, typename GeometryOut, typename Strategy>
    static inline bool apply(
        Geometry1 const& g1,
        Geometry2 const& g2,
        RobustPolicy const& robust_policy,
        GeometryOut& out,
        Strategy const& strategy)
    {
        return intersection<
                   Geometry2, Geometry1,
                   Tag2, Tag1,
                   false
               >::apply(g2, g1, robust_policy, out, strategy);
    }
};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH

    
namespace resolve_variant
{
    
template <typename Geometry1, typename Geometry2>
struct intersection
{
    template <typename GeometryOut>
    static inline bool
    apply(
          const Geometry1& geometry1,
          const Geometry2& geometry2,
          GeometryOut& geometry_out)
    {
        concepts::check<Geometry1 const>();
        concepts::check<Geometry2 const>();
        
        typedef typename geometry::rescale_overlay_policy_type
        <
            Geometry1,
            Geometry2
        >::type rescale_policy_type;
        
        rescale_policy_type robust_policy
            = geometry::get_rescale_policy<rescale_policy_type>(geometry1,
                                                                geometry2);
        
        typedef intersection_strategies
        <
            typename cs_tag<Geometry1>::type,
            Geometry1,
            Geometry2,
            typename geometry::point_type<Geometry1>::type,
            rescale_policy_type
        > strategy;
        
        return dispatch::intersection
        <
            Geometry1,
            Geometry2
        >::apply(geometry1, geometry2, robust_policy, geometry_out, strategy());
    }
};


template <BOOST_VARIANT_ENUM_PARAMS(typename T), typename Geometry2>
struct intersection<variant<BOOST_VARIANT_ENUM_PARAMS(T)>, Geometry2>
{
    template <typename GeometryOut>
    struct visitor: static_visitor<bool>
    {
        Geometry2 const& m_geometry2;
        GeometryOut& m_geometry_out;
        
        visitor(Geometry2 const& geometry2,
                GeometryOut& geometry_out)
            : m_geometry2(geometry2)
            , m_geometry_out(geometry_out)
        {}
        
        template <typename Geometry1>
        result_type operator()(Geometry1 const& geometry1) const
        {
            return intersection
            <
                Geometry1,
                Geometry2
            >::template apply
            <
                GeometryOut
            >
            (geometry1, m_geometry2, m_geometry_out);
        }
    };
    
    template <typename GeometryOut>
    static inline bool
    apply(variant<BOOST_VARIANT_ENUM_PARAMS(T)> const& geometry1,
          Geometry2 const& geometry2,
          GeometryOut& geometry_out)
    {
        return boost::apply_visitor(visitor<GeometryOut>(geometry2, geometry_out), geometry1);
    }
};


template <typename Geometry1, BOOST_VARIANT_ENUM_PARAMS(typename T)>
struct intersection<Geometry1, variant<BOOST_VARIANT_ENUM_PARAMS(T)> >
{
    template <typename GeometryOut>
    struct visitor: static_visitor<bool>
    {
        Geometry1 const& m_geometry1;
        GeometryOut& m_geometry_out;
        
        visitor(Geometry1 const& geometry1,
                GeometryOut& geometry_out)
            : m_geometry1(geometry1)
            , m_geometry_out(geometry_out)
        {}
        
        template <typename Geometry2>
        result_type operator()(Geometry2 const& geometry2) const
        {
            return intersection
            <
                Geometry1,
                Geometry2
            >::template apply
            <
                GeometryOut
            >
            (m_geometry1, geometry2, m_geometry_out);
        }
    };
    
    template <typename GeometryOut>
    static inline bool
    apply(Geometry1 const& geometry1,
          const variant<BOOST_VARIANT_ENUM_PARAMS(T)>& geometry2,
          GeometryOut& geometry_out)
    {
        return boost::apply_visitor(visitor<GeometryOut>(geometry1, geometry_out), geometry2);
    }
};


template <BOOST_VARIANT_ENUM_PARAMS(typename T1), BOOST_VARIANT_ENUM_PARAMS(typename T2)>
struct intersection<variant<BOOST_VARIANT_ENUM_PARAMS(T1)>, variant<BOOST_VARIANT_ENUM_PARAMS(T2)> >
{
    template <typename GeometryOut>
    struct visitor: static_visitor<bool>
    {
        GeometryOut& m_geometry_out;
        
        visitor(GeometryOut& geometry_out)
            : m_geometry_out(geometry_out)
        {}
        
        template <typename Geometry1, typename Geometry2>
        result_type operator()(Geometry1 const& geometry1,
                               Geometry2 const& geometry2) const
        {
            return intersection
            <
                Geometry1,
                Geometry2
            >::template apply
            <
                GeometryOut
            >
            (geometry1, geometry2, m_geometry_out);
        }
    };
    
    template <typename GeometryOut>
    static inline bool
    apply(const variant<BOOST_VARIANT_ENUM_PARAMS(T1)>& geometry1,
          const variant<BOOST_VARIANT_ENUM_PARAMS(T2)>& geometry2,
          GeometryOut& geometry_out)
    {
        return boost::apply_visitor(visitor<GeometryOut>(geometry_out), geometry1, geometry2);
    }
};
    
} // namespace resolve_variant
    

/*!
\brief \brief_calc2{intersection}
\ingroup intersection
\details \details_calc2{intersection, spatial set theoretic intersection}.
\tparam Geometry1 \tparam_geometry
\tparam Geometry2 \tparam_geometry
\tparam GeometryOut Collection of geometries (e.g. std::vector, std::deque, boost::geometry::multi*) of which
    the value_type fulfills a \p_l_or_c concept, or it is the output geometry (e.g. for a box)
\param geometry1 \param_geometry
\param geometry2 \param_geometry
\param geometry_out The output geometry, either a multi_point, multi_polygon,
    multi_linestring, or a box (for intersection of two boxes)

\qbk{[include reference/algorithms/intersection.qbk]}
*/
template
<
    typename Geometry1,
    typename Geometry2,
    typename GeometryOut
>
inline bool intersection(Geometry1 const& geometry1,
            Geometry2 const& geometry2,
            GeometryOut& geometry_out)
{
    return resolve_variant::intersection
        <
           Geometry1,
           Geometry2
        >::template apply
        <
            GeometryOut
        >
        (geometry1, geometry2, geometry_out);
}


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_INTERSECTION_INTERFACE_HPP

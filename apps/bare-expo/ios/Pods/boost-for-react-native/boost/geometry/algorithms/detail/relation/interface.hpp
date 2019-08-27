// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2015 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2013, 2014, 2015.
// Modifications copyright (c) 2013-2015 Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATION_INTERFACE_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATION_INTERFACE_HPP


#include <boost/geometry/algorithms/detail/relate/interface.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace relate
{

template <typename Geometry1, typename Geometry2>
struct result_handler_type<Geometry1, Geometry2, geometry::de9im::matrix, false>
{
    typedef matrix_handler<geometry::de9im::matrix> type;
};


}} // namespace detail::relate
#endif // DOXYGEN_NO_DETAIL


namespace resolve_variant
{

template <typename Geometry1, typename Geometry2>
struct relation
{
    template <typename Matrix>
    static inline Matrix apply(Geometry1 const& geometry1,
                               Geometry2 const& geometry2)
    {
        concepts::check<Geometry1 const>();
        concepts::check<Geometry2 const>();
        assert_dimension_equal<Geometry1, Geometry2>();

        typename detail::relate::result_handler_type
            <
                Geometry1,
                Geometry2,
                Matrix
            >::type handler;

        dispatch::relate
            <
                Geometry1,
                Geometry2
            >::apply(geometry1, geometry2, handler);

        return handler.result();
    }
};

template <BOOST_VARIANT_ENUM_PARAMS(typename T), typename Geometry2>
struct relation<boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)>, Geometry2>
{
    template <typename Matrix>
    struct visitor : boost::static_visitor<Matrix>
    {
        Geometry2 const& m_geometry2;

        visitor(Geometry2 const& geometry2)
            : m_geometry2(geometry2) {}

        template <typename Geometry1>
        Matrix operator()(Geometry1 const& geometry1) const
        {
            return relation<Geometry1, Geometry2>
                   ::template apply<Matrix>(geometry1, m_geometry2);
        }
    };

    template <typename Matrix>
    static inline Matrix
    apply(boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)> const& geometry1,
          Geometry2 const& geometry2)
    {
        return boost::apply_visitor(visitor<Matrix>(geometry2), geometry1);
    }
};

template <typename Geometry1, BOOST_VARIANT_ENUM_PARAMS(typename T)>
struct relation<Geometry1, boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)> >
{
    template <typename Matrix>
    struct visitor : boost::static_visitor<Matrix>
    {
        Geometry1 const& m_geometry1;

        visitor(Geometry1 const& geometry1)
            : m_geometry1(geometry1) {}

        template <typename Geometry2>
        Matrix operator()(Geometry2 const& geometry2) const
        {
            return relation<Geometry1, Geometry2>
                   ::template apply<Matrix>(m_geometry1, geometry2);
        }
    };

    template <typename Matrix>
    static inline Matrix
    apply(Geometry1 const& geometry1,
          boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)> const& geometry2)
    {
        return boost::apply_visitor(visitor<Matrix>(geometry1), geometry2);
    }
};

template
<
    BOOST_VARIANT_ENUM_PARAMS(typename T1),
    BOOST_VARIANT_ENUM_PARAMS(typename T2)
>
struct relation
    <
        boost::variant<BOOST_VARIANT_ENUM_PARAMS(T1)>,
        boost::variant<BOOST_VARIANT_ENUM_PARAMS(T2)>
    >
{
    template <typename Matrix>
    struct visitor : boost::static_visitor<Matrix>
    {
        template <typename Geometry1, typename Geometry2>
        Matrix operator()(Geometry1 const& geometry1,
                          Geometry2 const& geometry2) const
        {
            return relation<Geometry1, Geometry2>
                   ::template apply<Matrix>(geometry1, geometry2);
        }
    };

    template <typename Matrix>
    static inline Matrix
    apply(boost::variant<BOOST_VARIANT_ENUM_PARAMS(T1)> const& geometry1,
          boost::variant<BOOST_VARIANT_ENUM_PARAMS(T2)> const& geometry2)
    {
        return boost::apply_visitor(visitor<Matrix>(), geometry1, geometry2);
    }
};

} // namespace resolve_variant


/*!
\brief Calculates the relation between a pair of geometries as defined in DE-9IM.
\ingroup relation
\tparam Geometry1 \tparam_geometry
\tparam Geometry2 \tparam_geometry
\param geometry1 \param_geometry
\param geometry2 \param_geometry
\return The DE-9IM matrix expressing the relation between geometries.

\qbk{[include reference/algorithms/relation.qbk]}
 */
template <typename Geometry1, typename Geometry2>
inline de9im::matrix relation(Geometry1 const& geometry1,
                              Geometry2 const& geometry2)
{
    return resolve_variant::relation
        <
            Geometry1,
            Geometry2
        >::template apply<de9im::matrix>(geometry1, geometry2);
}


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_INTERFACE_HPP

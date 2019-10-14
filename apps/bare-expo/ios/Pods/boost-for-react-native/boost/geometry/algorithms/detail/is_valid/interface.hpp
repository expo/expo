// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2014-2015, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Licensed under the Boost Software License version 1.0.
// http://www.boost.org/users/license.html

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_IS_VALID_INTERFACE_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_IS_VALID_INTERFACE_HPP

#include <sstream>
#include <string>

#include <boost/variant/apply_visitor.hpp>
#include <boost/variant/static_visitor.hpp>
#include <boost/variant/variant_fwd.hpp>

#include <boost/geometry/geometries/concepts/check.hpp>

#include <boost/geometry/algorithms/dispatch/is_valid.hpp>
#include <boost/geometry/policies/is_valid/default_policy.hpp>
#include <boost/geometry/policies/is_valid/failing_reason_policy.hpp>
#include <boost/geometry/policies/is_valid/failure_type_policy.hpp>


namespace boost { namespace geometry
{


namespace resolve_variant {

template <typename Geometry>
struct is_valid
{
    template <typename VisitPolicy>
    static inline bool apply(Geometry const& geometry, VisitPolicy& visitor)
    {
        concepts::check<Geometry const>();
        return dispatch::is_valid<Geometry>::apply(geometry, visitor);
    }
};

template <BOOST_VARIANT_ENUM_PARAMS(typename T)>
struct is_valid<boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)> >
{
    template <typename VisitPolicy>
    struct visitor : boost::static_visitor<bool>
    {
        visitor(VisitPolicy& policy) : m_policy(policy) {}

        template <typename Geometry>
        bool operator()(Geometry const& geometry) const
        {
            return is_valid<Geometry>::apply(geometry, m_policy);
        }

        VisitPolicy& m_policy;
    };

    template <typename VisitPolicy>
    static inline bool
    apply(boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)> const& geometry,
          VisitPolicy& policy_visitor)
    {
        return boost::apply_visitor(visitor<VisitPolicy>(policy_visitor),
                                    geometry);
    }
};

} // namespace resolve_variant


// Undocumented for now
template <typename Geometry, typename VisitPolicy>
inline bool is_valid(Geometry const& geometry, VisitPolicy& visitor)
{
    return resolve_variant::is_valid<Geometry>::apply(geometry, visitor);
}


/*!
\brief \brief_check{is valid (in the OGC sense)}
\ingroup is_valid
\tparam Geometry \tparam_geometry
\param geometry \param_geometry
\return \return_check{is valid (in the OGC sense);
    furthermore, the following geometries are considered valid:
    multi-geometries with no elements,
    linear geometries containing spikes,
    areal geometries with duplicate (consecutive) points}

\qbk{[include reference/algorithms/is_valid.qbk]}
*/
template <typename Geometry>
inline bool is_valid(Geometry const& geometry)
{
    is_valid_default_policy<> policy_visitor;
    return geometry::is_valid(geometry, policy_visitor);
}


/*!
\brief \brief_check{is valid (in the OGC sense)}
\ingroup is_valid
\tparam Geometry \tparam_geometry
\param geometry \param_geometry
\param failure An enumeration value indicating that the geometry is
    valid or not, and if not valid indicating the reason why
\return \return_check{is valid (in the OGC sense);
    furthermore, the following geometries are considered valid:
    multi-geometries with no elements,
    linear geometries containing spikes,
    areal geometries with duplicate (consecutive) points}

\qbk{distinguish,with failure value}
\qbk{[include reference/algorithms/is_valid_with_failure.qbk]}
*/
template <typename Geometry>
inline bool is_valid(Geometry const& geometry, validity_failure_type& failure)
{
    failure_type_policy<> policy_visitor;
    bool result = geometry::is_valid(geometry, policy_visitor);
    failure = policy_visitor.failure();
    return result;
}


/*!
\brief \brief_check{is valid (in the OGC sense)}
\ingroup is_valid
\tparam Geometry \tparam_geometry
\param geometry \param_geometry
\param message A string containing a message stating if the geometry
    is valid or not, and if not valid a reason why
\return \return_check{is valid (in the OGC sense);
    furthermore, the following geometries are considered valid:
    multi-geometries with no elements,
    linear geometries containing spikes,
    areal geometries with duplicate (consecutive) points}

\qbk{distinguish,with message}
\qbk{[include reference/algorithms/is_valid_with_message.qbk]}
*/
template <typename Geometry>
inline bool is_valid(Geometry const& geometry, std::string& message)
{
    std::ostringstream stream;
    failing_reason_policy<> policy_visitor(stream);
    bool result = geometry::is_valid(geometry, policy_visitor);
    message = stream.str();
    return result;
}


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_IS_VALID_INTERFACE_HPP

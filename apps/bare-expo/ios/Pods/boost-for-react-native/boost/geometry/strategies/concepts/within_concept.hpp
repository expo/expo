// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGIES_CONCEPTS_WITHIN_CONCEPT_HPP
#define BOOST_GEOMETRY_STRATEGIES_CONCEPTS_WITHIN_CONCEPT_HPP



#include <boost/concept_check.hpp>
#include <boost/function_types/result_type.hpp>

#include <boost/geometry/util/parameter_type_of.hpp>


namespace boost { namespace geometry { namespace concepts
{


/*!
\brief Checks strategy for within (point-in-polygon)
\ingroup within
*/
template <typename Strategy>
class WithinStrategyPolygonal
{
#ifndef DOXYGEN_NO_CONCEPT_MEMBERS

    // 1) must define state_type
    typedef typename Strategy::state_type state_type;

    struct checker
    {
        template <typename ApplyMethod, typename ResultMethod>
        static void apply(ApplyMethod const&, ResultMethod const& )
        {
            typedef typename parameter_type_of
                <
                    ApplyMethod, 0
                >::type point_type;
            typedef typename parameter_type_of
                <
                    ApplyMethod, 1
                >::type segment_point_type;

            // CHECK: apply-arguments should both fulfill point concept
            BOOST_CONCEPT_ASSERT
                (
                    (concepts::ConstPoint<point_type>)
                );

            BOOST_CONCEPT_ASSERT
                (
                    (concepts::ConstPoint<segment_point_type>)
                );

            // CHECK: return types (result: int, apply: bool)
            BOOST_MPL_ASSERT_MSG
                (
                    (boost::is_same
                        <
                            bool, typename boost::function_types::result_type<ApplyMethod>::type
                        >::type::value),
                    WRONG_RETURN_TYPE_OF_APPLY
                    , (bool)
                );
            BOOST_MPL_ASSERT_MSG
                (
                    (boost::is_same
                        <
                            int, typename boost::function_types::result_type<ResultMethod>::type
                        >::type::value),
                    WRONG_RETURN_TYPE_OF_RESULT
                    , (int)
                );


            // CHECK: calling method apply and result
            Strategy const* str = 0;
            state_type* st = 0;
            point_type const* p = 0;
            segment_point_type const* sp = 0;

            bool b = str->apply(*p, *sp, *sp, *st);
            int r = str->result(*st);

            boost::ignore_unused_variable_warning(r);
            boost::ignore_unused_variable_warning(b);
            boost::ignore_unused_variable_warning(str);
        }
    };


public :
    BOOST_CONCEPT_USAGE(WithinStrategyPolygonal)
    {
        checker::apply(&Strategy::apply, &Strategy::result);
    }
#endif
};

template <typename Strategy>
class WithinStrategyPointBox
{
#ifndef DOXYGEN_NO_CONCEPT_MEMBERS

    struct checker
    {
        template <typename ApplyMethod>
        static void apply(ApplyMethod const&)
        {
            typedef typename parameter_type_of
                <
                    ApplyMethod, 0
                >::type point_type;
            typedef typename parameter_type_of
                <
                    ApplyMethod, 1
                >::type box_type;

            // CHECK: apply-arguments should fulfill point/box concept
            BOOST_CONCEPT_ASSERT
                (
                    (concepts::ConstPoint<point_type>)
                );

            BOOST_CONCEPT_ASSERT
                (
                    (concepts::ConstBox<box_type>)
                );

            // CHECK: return types (apply: bool)
            BOOST_MPL_ASSERT_MSG
                (
                    (boost::is_same
                        <
                            bool,
                            typename boost::function_types::result_type<ApplyMethod>::type
                        >::type::value),
                    WRONG_RETURN_TYPE
                    , (bool)
                );


            // CHECK: calling method apply
            Strategy const* str = 0;
            point_type const* p = 0;
            box_type const* bx = 0;

            bool b = str->apply(*p, *bx);

            boost::ignore_unused_variable_warning(b);
            boost::ignore_unused_variable_warning(str);
        }
    };


public :
    BOOST_CONCEPT_USAGE(WithinStrategyPointBox)
    {
        checker::apply(&Strategy::apply);
    }
#endif
};

template <typename Strategy>
class WithinStrategyBoxBox
{
#ifndef DOXYGEN_NO_CONCEPT_MEMBERS

    struct checker
    {
        template <typename ApplyMethod>
        static void apply(ApplyMethod const&)
        {
            typedef typename parameter_type_of
                <
                    ApplyMethod, 0
                >::type box_type1;
            typedef typename parameter_type_of
                <
                    ApplyMethod, 1
                >::type box_type2;

            // CHECK: apply-arguments should both fulfill box concept
            BOOST_CONCEPT_ASSERT
                (
                    (concepts::ConstBox<box_type1>)
                );

            BOOST_CONCEPT_ASSERT
                (
                    (concepts::ConstBox<box_type2>)
                );

            // CHECK: return types (apply: bool)
            BOOST_MPL_ASSERT_MSG
                (
                    (boost::is_same
                        <
                            bool,
                            typename boost::function_types::result_type<ApplyMethod>::type
                        >::type::value),
                    WRONG_RETURN_TYPE
                    , (bool)
                );


            // CHECK: calling method apply
            Strategy const* str = 0;
            box_type1 const* b1 = 0;
            box_type2 const* b2 = 0;

            bool b = str->apply(*b1, *b2);

            boost::ignore_unused_variable_warning(b);
            boost::ignore_unused_variable_warning(str);
        }
    };


public :
    BOOST_CONCEPT_USAGE(WithinStrategyBoxBox)
    {
        checker::apply(&Strategy::apply);
    }
#endif
};

// So now: boost::geometry::concepts::within
namespace within
{

#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

template <typename FirstTag, typename SecondTag, typename CastedTag, typename Strategy>
struct check_within
{};


template <typename AnyTag, typename Strategy>
struct check_within<point_tag, AnyTag, areal_tag, Strategy>
{
    BOOST_CONCEPT_ASSERT( (WithinStrategyPolygonal<Strategy>) );
};


template <typename Strategy>
struct check_within<point_tag, box_tag, areal_tag, Strategy>
{
    BOOST_CONCEPT_ASSERT( (WithinStrategyPointBox<Strategy>) );
};

template <typename Strategy>
struct check_within<box_tag, box_tag, areal_tag, Strategy>
{
    BOOST_CONCEPT_ASSERT( (WithinStrategyBoxBox<Strategy>) );
};


} // namespace dispatch
#endif


/*!
\brief Checks, in compile-time, the concept of any within-strategy
\ingroup concepts
*/
template <typename FirstTag, typename SecondTag, typename CastedTag, typename Strategy>
inline void check()
{
    dispatch::check_within<FirstTag, SecondTag, CastedTag, Strategy> c;
    boost::ignore_unused_variable_warning(c);
}


}}}} // namespace boost::geometry::concepts::within


#endif // BOOST_GEOMETRY_STRATEGIES_CONCEPTS_WITHIN_CONCEPT_HPP

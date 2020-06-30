/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman
    Copyright (c) 2005-2006 Dan Marsden

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !defined(BOOST_FUSION_VALUE_AT_IMPL_20061101_0745)
#define BOOST_FUSION_VALUE_AT_IMPL_20061101_0745

#include <boost/fusion/support/config.hpp>
#include <boost/mpl/apply.hpp>
#include <boost/fusion/view/transform_view/detail/apply_transform_result.hpp>
#include <boost/fusion/sequence/intrinsic/value_at.hpp>

namespace boost { namespace fusion {
    struct transform_view_tag;
    struct transform_view2_tag;

    namespace extension
    {
        template<typename Tag>
        struct value_at_impl;

        template<>
        struct value_at_impl<transform_view_tag>
        {
            template<typename Seq, typename N>
            struct apply
            {
                typedef typename Seq::transform_type F;
                typedef detail::apply_transform_result<F> transform_type;
                typedef typename boost::fusion::result_of::value_at<typename Seq::sequence_type, N>::type value_type;
                typedef typename mpl::apply<transform_type, value_type>::type type;
            };
        };

        template<>
        struct value_at_impl<transform_view2_tag>
        {
            template<typename Seq, typename N>
            struct apply
            {
                typedef typename Seq::transform_type F;
                typedef detail::apply_transform_result<F> transform_type;
                typedef typename boost::fusion::result_of::value_at<typename Seq::sequence1_type, N>::type value1_type;
                typedef typename boost::fusion::result_of::value_at<typename Seq::sequence2_type, N>::type value2_type;
                typedef typename mpl::apply<transform_type, value1_type, value2_type>::type type;
            };
        };
    }
}}

#endif

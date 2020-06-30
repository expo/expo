/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman
    Copyright (c) 2007 Dan Marsden

    Distributed under the Boost Software License, Version 1.0. (See accompanying 
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !defined(BOOST_FUSION_APPLY_TRANSFORM_RESULT_02092006_1936)
#define BOOST_FUSION_APPLY_TRANSFORM_RESULT_02092006_1936

#include <boost/fusion/support/config.hpp>
#include <boost/utility/result_of.hpp>

namespace boost { namespace fusion
{
    struct void_;
    
    namespace detail
    {
        template <typename F>
        struct apply_transform_result
        {
            template <typename T0, typename T1 = void_>
            struct apply
                : boost::result_of<F(T0, T1)>
            {};

            template <typename T0>
            struct apply<T0, void_>
                : boost::result_of<F(T0)>
            {};
        };
    }
}}

#endif



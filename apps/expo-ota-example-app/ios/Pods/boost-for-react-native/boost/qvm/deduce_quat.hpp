//Copyright (c) 2008-2016 Emil Dotchevski and Reverge Studios, Inc.

//Distributed under the Boost Software License, Version 1.0. (See accompanying
//file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef UUID_435FA7E8196311E0A176DE6BDFD72085
#define UUID_435FA7E8196311E0A176DE6BDFD72085

#include <boost/qvm/deduce_scalar.hpp>
#include <boost/qvm/quat_traits.hpp>
#include <boost/qvm/static_assert.hpp>

namespace
boost
    {
    namespace
    qvm
        {
        template <class T>
        struct quat;

        template <class Q>
        struct
        deduce_quat
            {
            BOOST_QVM_STATIC_ASSERT(is_quat<Q>::value);
            typedef Q type;
            };

        namespace
        qvm_detail
            {
            template <class A,class B,
                bool QA=is_quat<A>::value,
                bool QB=is_quat<B>::value>
            struct
            deduce_quat2_default
                {
                typedef quat<
                    typename deduce_scalar<
                        typename scalar<A>::type,
                        typename scalar<B>::type>::type> type;
                };

            template <class Q>
            struct
            deduce_quat2_default<Q,Q,true,true>
                {
                typedef Q type;
                };
            }

        template <class A,class B>
        struct
        deduce_quat2
            {
            BOOST_QVM_STATIC_ASSERT(is_quat<A>::value || is_quat<B>::value);
            typedef typename qvm_detail::deduce_quat2_default<A,B>::type type;
            };
        }
    }

#endif

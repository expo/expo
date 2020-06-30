//Copyright (c) 2008-2016 Emil Dotchevski and Reverge Studios, Inc.

//Distributed under the Boost Software License, Version 1.0. (See accompanying
//file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef UUID_49C5A1042AEF11DF9603880056D89593
#define UUID_49C5A1042AEF11DF9603880056D89593

#include <boost/qvm/inline.hpp>
#include <boost/qvm/assert.hpp>
#include <boost/qvm/static_assert.hpp>

namespace
boost
    {
    namespace
    qvm
        {
        template <class T>
        struct
        quat
            {
            T a[4];
            template <class R>
            operator R() const
                {
                R r;
                assign(r,*this);
                return r;
                }
            };

        template <class Q>
        struct quat_traits;

        template <class T>
        struct
        quat_traits< quat<T> >
            {
            typedef quat<T> this_quaternion;
            typedef T scalar_type;

            template <int I>
            static
            BOOST_QVM_INLINE_CRITICAL
            scalar_type
            read_element( this_quaternion const & x )
                {
                BOOST_QVM_STATIC_ASSERT(I>=0);
                BOOST_QVM_STATIC_ASSERT(I<4);
                return x.a[I];
                }

            template <int I>
            static
            BOOST_QVM_INLINE_CRITICAL
            scalar_type &
            write_element( this_quaternion & x )
                {
                BOOST_QVM_STATIC_ASSERT(I>=0);
                BOOST_QVM_STATIC_ASSERT(I<4);
                return x.a[I];
                }
            };
        }
    }

#endif

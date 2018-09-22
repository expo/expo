//Copyright (c) 2008-2016 Emil Dotchevski and Reverge Studios, Inc.

//Distributed under the Boost Software License, Version 1.0. (See accompanying
//file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef UUID_7FF8E2E00E5411E2AB79F7FE6188709B
#define UUID_7FF8E2E00E5411E2AB79F7FE6188709B

#include <boost/qvm/vec_traits.hpp>
#include <boost/qvm/inline.hpp>
#include <boost/qvm/assert.hpp>
#include <boost/qvm/enable_if.hpp>
#include <boost/qvm/error.hpp>
#include <boost/exception/info.hpp>

namespace
boost
    {
    namespace
    qvm
        {
        ////////////////////////////////////////////////

        namespace
        qvm_detail
            {
            template <int D>
            struct
            vec_index_read_defined
                {
                static bool const value=false;
                };

            template <int I,int N>
            struct
            vector_r
                {
                template <class A>
                static
                BOOST_QVM_INLINE_CRITICAL
                typename vec_traits<A>::scalar_type
                read_element_idx( A const & a, int i )
                    {
                    return I==i?
                        vec_traits<A>::template read_element<I>(a) :
                        vector_r<I+1,N>::read_element_idx(a,i);
                    }
                };

            template <int N>
            struct
            vector_r<N,N>
                {
                template <class A>
                static
                BOOST_QVM_INLINE_TRIVIAL
                typename vec_traits<A>::scalar_type
                read_element_idx( A const & a, int )
                    {
                    BOOST_QVM_ASSERT(0);
                    return vec_traits<A>::template read_element<0>(a);
                    }
                };
            }

        template <class A>
        BOOST_QVM_INLINE_TRIVIAL
        typename boost::enable_if_c<
            is_vec<A>::value &&
            !qvm_detail::vec_index_read_defined<vec_traits<A>::dim>::value,
            typename vec_traits<A>::scalar_type>::type
        vec_index_read( A const & a, int i )
            {
            return qvm_detail::vector_r<0,vec_traits<A>::dim>::read_element_idx(a,i);
            }

        ////////////////////////////////////////////////

        namespace
        qvm_detail
            {
            template <int D>
            struct
            vec_index_write_defined
                {
                static bool const value=false;
                };

            template <int I,int N>
            struct
            vector_w
                {
                template <class A>
                static
                BOOST_QVM_INLINE_CRITICAL
                typename vec_traits<A>::scalar_type &
                write_element_idx( A & a, int i )
                    {
                    return I==i?
                        vec_traits<A>::template write_element<I>(a) :
                        vector_w<I+1,N>::write_element_idx(a,i);
                    }
                };

            template <int N>
            struct
            vector_w<N,N>
                {
                template <class A>
                static
                BOOST_QVM_INLINE_TRIVIAL
                typename vec_traits<A>::scalar_type &
                write_element_idx( A & a, int )
                    {
                    BOOST_QVM_ASSERT(0);
                    return vec_traits<A>::template write_element<0>(a);
                    }
                };
            }

        template <class A>
        BOOST_QVM_INLINE_TRIVIAL
        typename boost::enable_if_c<
            is_vec<A>::value &&
            !qvm_detail::vec_index_write_defined<vec_traits<A>::dim>::value,
            typename vec_traits<A>::scalar_type &>::type
        vec_index_write( A & a, int i )
            {
            return qvm_detail::vector_w<0,vec_traits<A>::dim>::write_element_idx(a,i);
            }

        ////////////////////////////////////////////////

        namespace
        sfinae
            {
            using ::boost::qvm::vec_index_read;
            using ::boost::qvm::vec_index_write;
            }

        ////////////////////////////////////////////////
        }
    }

#endif

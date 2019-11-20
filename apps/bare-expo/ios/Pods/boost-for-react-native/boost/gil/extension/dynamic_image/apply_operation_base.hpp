/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_APPLY_OPERATION_BASE_HPP
#define GIL_APPLY_OPERATION_BASE_HPP

#include "../../gil_config.hpp"
#include "../../utilities.hpp"
#include <boost/mpl/begin.hpp>
#include <boost/mpl/next.hpp>
#include <boost/mpl/deref.hpp>
#include <boost/mpl/size.hpp>
#include <boost/preprocessor/repeat.hpp> 

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief Given an object with run-time specified type (denoted as an array of Bits, dynamic index, and a static set of Types) and a generic operation, 
///        casts the object to its appropriate type and applies the operation
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date 2005-2007 \n Last updated on November 6, 2007
///
////////////////////////////////////////////////////////////////////////////////////////

namespace boost { namespace gil {

/*
GENERATE_APPLY_FWD_OPS generates for every N functions that look like this (for N==2):

    template <> struct apply_operation_fwd_fn<3> {
        template <typename Types, typename Bits, typename UnaryOp>
        typename UnaryOp::result_type apply(Bits& bits, std::size_t index, UnaryOp op) const {
            typedef typename mpl::begin<Types>::type T0;
            typedef typename mpl::next<T0>::type T1;
            typedef typename mpl::next<T1>::type T2;
            switch (index) {
                case 0: return op(reinterpret_cast<typename mpl::deref<T0>::type&>(bits));
                case 1: return op(reinterpret_cast<typename mpl::deref<T1>::type&>(bits));
                case 2: return op(reinterpret_cast<typename mpl::deref<T2>::type&>(bits));
            }
            throw;
        }

        template <typename Types, typename Bits, typename UnaryOp>
        typename UnaryOp::result_type applyc(const Bits& bits, std::size_t index, UnaryOp op) const {
            typedef typename mpl::begin<Types>::type T0;
            typedef typename mpl::next<T0>::type T1;
            typedef typename mpl::next<T1>::type T2;
            switch (index) {
                case 0: return op(reinterpret_cast<const typename mpl::deref<T0>::type&>(bits));
                case 1: return op(reinterpret_cast<const typename mpl::deref<T1>::type&>(bits));
                case 2: return op(reinterpret_cast<const typename mpl::deref<T2>::type&>(bits));
            }
            throw;
        }
    };
*/

#define GIL_FWD_TYPEDEFS(z, N, text)   T##N; typedef typename mpl::next<T##N>::type 
#define GIL_FWD_CASE(z, N, SUM)       case N: return op(*gil_reinterpret_cast<typename mpl::deref<T##N>::type*>(&bits));
#define GIL_FWD_CONST_CASE(z, N, SUM) case N: return op(*gil_reinterpret_cast_c<const typename mpl::deref<T##N>::type*>(&bits));

#define GIL_FWD_CASE_WITH_INFO(z, N, SUM)       case N: return op(*gil_reinterpret_cast<typename mpl::deref<T##N>::type*>(&bits), info);
#define GIL_FWD_CONST_CASE_WITH_INFO(z, N, SUM) case N: return op(*gil_reinterpret_cast_c<const typename mpl::deref<T##N>::type*>(&bits), info);

#define GIL_APPLY_FWD_OP(z, N, text)                                                                        \
    template <> struct apply_operation_fwd_fn<BOOST_PP_ADD(N,1)> {                                      \
        template <typename Types, typename Bits, typename UnaryOp>                                     \
        typename UnaryOp::result_type apply(Bits& bits, std::size_t index, UnaryOp op) const {        \
            typedef typename mpl::begin<Types>::type                                             \
            BOOST_PP_REPEAT(N, GIL_FWD_TYPEDEFS, BOOST_PP_EMPTY)                                            \
            T##N;                                                                                       \
            switch (index) {                                                                            \
                BOOST_PP_REPEAT(BOOST_PP_ADD(N,1), GIL_FWD_CASE, BOOST_PP_EMPTY)                            \
            }                                                                                           \
            throw;                                                                                      \
        }                                                                                               \
        template <typename Types, typename Bits, typename UnaryOp>                                     \
        typename UnaryOp::result_type applyc(const Bits& bits, std::size_t index, UnaryOp op) const { \
            typedef typename mpl::begin<Types>::type                                             \
            BOOST_PP_REPEAT(N, GIL_FWD_TYPEDEFS, BOOST_PP_EMPTY)                                            \
            T##N;                                                                                       \
            switch (index) {                                                                            \
                BOOST_PP_REPEAT(BOOST_PP_ADD(N,1), GIL_FWD_CONST_CASE,BOOST_PP_EMPTY)                       \
            }                                                                                           \
            throw;                                                                                      \
        }                                                                                               \
        template <typename Types, typename Info, typename Bits, typename UnaryOp>                                     \
        typename UnaryOp::result_type apply(Bits& bits, std::size_t index, const Info& info, UnaryOp op) const {        \
            typedef typename mpl::begin<Types>::type                                             \
            BOOST_PP_REPEAT(N, GIL_FWD_TYPEDEFS, BOOST_PP_EMPTY)                                            \
            T##N;                                                                                       \
            switch (index) {                                                                            \
                BOOST_PP_REPEAT(BOOST_PP_ADD(N,1), GIL_FWD_CASE_WITH_INFO, BOOST_PP_EMPTY)                            \
            }                                                                                           \
            throw;                                                                                      \
        }                                                                                               \
        template <typename Types, typename Bits, typename Info, typename UnaryOp>                                     \
        typename UnaryOp::result_type applyc(const Bits& bits, std::size_t index, const Info& info, UnaryOp op) const { \
            typedef typename mpl::begin<Types>::type                                             \
            BOOST_PP_REPEAT(N, GIL_FWD_TYPEDEFS, BOOST_PP_EMPTY)                                            \
            T##N;                                                                                       \
            switch (index) {                                                                            \
                BOOST_PP_REPEAT(BOOST_PP_ADD(N,1), GIL_FWD_CONST_CASE_WITH_INFO,BOOST_PP_EMPTY)                       \
            }                                                                                           \
            throw;                                                                                      \
        }                                                                                               \
    };

#define GIL_GENERATE_APPLY_FWD_OPS(N) BOOST_PP_REPEAT(N, GIL_APPLY_FWD_OP, BOOST_PP_EMPTY)

namespace detail {
template <std::size_t N> struct apply_operation_fwd_fn {};

// Create specializations of apply_operation_fn for each N 0..100
GIL_GENERATE_APPLY_FWD_OPS(99)
} // namespace detail

// unary application
template <typename Types, typename Bits, typename Op> 
typename Op::result_type GIL_FORCEINLINE apply_operation_basec(const Bits& bits, std::size_t index, Op op) {
    return detail::apply_operation_fwd_fn<mpl::size<Types>::value>().template applyc<Types>(bits,index,op);
}

// unary application
template <typename Types, typename Bits, typename Op> 
typename Op::result_type GIL_FORCEINLINE apply_operation_base(      Bits& bits, std::size_t index, Op op) {
    return detail::apply_operation_fwd_fn<mpl::size<Types>::value>().template apply<Types>(bits,index,op);
}

namespace detail {
    template <typename T2, typename Op>
    struct reduce_bind1 {
        const T2& _t2;
		Op&  _op;

        typedef typename Op::result_type result_type;

        reduce_bind1(const T2& t2, Op& op) : _t2(t2), _op(op) {}

        template <typename T1> GIL_FORCEINLINE result_type operator()(const T1& t1) { return _op(t1, _t2); }
    };

    template <typename Types1, typename Bits1, typename Op>
    struct reduce_bind2 {
        const Bits1& _bits1;
        std::size_t _index1;
		Op&  _op;

        typedef typename Op::result_type result_type;

        reduce_bind2(const Bits1& bits1, std::size_t index1, Op& op) : _bits1(bits1), _index1(index1), _op(op) {}

        template <typename T2> GIL_FORCEINLINE result_type operator()(const T2& t2) { 
            return apply_operation_basec<Types1>(_bits1, _index1, reduce_bind1<T2,Op>(t2, _op));
        }
    };
} // namespace detail

// Binary application by applying on each dimension separately
template <typename Types1, typename Types2, typename Bits1, typename Bits2, typename Op>
static typename Op::result_type GIL_FORCEINLINE apply_operation_base(const Bits1& bits1, std::size_t index1, const Bits2& bits2, std::size_t index2, Op op) {
    return apply_operation_basec<Types2>(bits2,index2,detail::reduce_bind2<Types1,Bits1,Op>(bits1,index1,op));
}

#undef GIL_FWD_TYPEDEFS
#undef GIL_FWD_CASE
#undef GIL_FWD_CONST_CASE
#undef GIL_APPLY_FWD_OP
#undef GIL_GENERATE_APPLY_FWD_OPS
#undef BHS

} }  // namespace boost::gil


#endif

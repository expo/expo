/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_APPLY_OPERATION_HPP
#define GIL_APPLY_OPERATION_HPP

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief Implements apply_operation for variants. Optionally performs type reduction
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date 2005-2007 \n Last updated on May 4, 2006
///
////////////////////////////////////////////////////////////////////////////////////////

#include "apply_operation_base.hpp"
#include "variant.hpp"

#ifndef GIL_REDUCE_CODE_BLOAT

namespace boost { namespace gil {

/// \ingroup Variant
/// \brief Invokes a generic mutable operation (represented as a unary function object) on a variant
template <typename Types, typename UnaryOp> GIL_FORCEINLINE
typename UnaryOp::result_type apply_operation(variant<Types>& arg, UnaryOp op) {
    return apply_operation_base<Types>(arg._bits, arg._index ,op);
}

/// \ingroup Variant
/// \brief Invokes a generic constant operation (represented as a unary function object) on a variant
template <typename Types, typename UnaryOp> GIL_FORCEINLINE
typename UnaryOp::result_type apply_operation(const variant<Types>& arg, UnaryOp op) {
    return apply_operation_basec<Types>(arg._bits, arg._index ,op);
}

/// \ingroup Variant
/// \brief Invokes a generic constant operation (represented as a binary function object) on two variants
template <typename Types1, typename Types2, typename BinaryOp> GIL_FORCEINLINE
typename BinaryOp::result_type apply_operation(const variant<Types1>& arg1, const variant<Types2>& arg2, BinaryOp op) {    
    return apply_operation_base<Types1,Types2>(arg1._bits, arg1._index, arg2._bits, arg2._index, op);
}

} }  // namespace boost::gil

#else
   
#include "reduce.hpp"

#endif

#endif

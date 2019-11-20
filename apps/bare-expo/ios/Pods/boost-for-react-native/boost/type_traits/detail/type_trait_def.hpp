
// NO INCLUDE GUARDS, THE HEADER IS INTENDED FOR MULTIPLE INCLUSION

// Copyright Aleksey Gurtovoy 2002-2004
//
// Distributed under the Boost Software License, Version 1.0. 
// (See accompanying file LICENSE_1_0.txt or copy at 
// http://www.boost.org/LICENSE_1_0.txt)

// $Source$
// $Date$
// $Revision$

#include <boost/type_traits/detail/template_arity_spec.hpp>
#include <boost/mpl/aux_/lambda_support.hpp>

#define BOOST_TT_AUX_TYPE_TRAIT_DEF1(trait,T,result) \
template< typename T > struct trait \
{ \
public:\
    typedef result type; \
    BOOST_MPL_AUX_LAMBDA_SUPPORT(1,trait,(T)) \
}; \
\
BOOST_TT_AUX_TEMPLATE_ARITY_SPEC(1,trait) \
/**/

#define BOOST_TT_AUX_TYPE_TRAIT_SPEC1(trait,spec,result) \
template<> struct trait<spec> \
{ \
public:\
    typedef result type; \
    BOOST_MPL_AUX_LAMBDA_SUPPORT_SPEC(1,trait,(spec)) \
}; \
/**/

#define BOOST_TT_AUX_TYPE_TRAIT_IMPL_SPEC1(trait,spec,result) \
template<> struct trait##_impl<spec> \
{ \
public:\
    typedef result type; \
}; \
/**/

#define BOOST_TT_AUX_TYPE_TRAIT_PARTIAL_SPEC1_1(param,trait,spec,result) \
template< param > struct trait<spec> \
{ \
public:\
    typedef result type; \
}; \
/**/

#define BOOST_TT_AUX_TYPE_TRAIT_PARTIAL_SPEC1_2(param1,param2,trait,spec,result) \
template< param1, param2 > struct trait<spec> \
{ \
public:\
    typedef result; \
}; \
/**/

#define BOOST_TT_AUX_TYPE_TRAIT_IMPL_PARTIAL_SPEC1_1(param,trait,spec,result) \
template< param > struct trait##_impl<spec> \
{ \
public:\
    typedef result type; \
}; \
/**/

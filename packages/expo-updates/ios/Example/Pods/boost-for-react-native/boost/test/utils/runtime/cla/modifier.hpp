//  (C) Copyright Gennadiy Rozental 2005-2008.
//  Use, modification, and distribution are subject to the 
//  Boost Software License, Version 1.0. (See accompanying file 
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : parameter modifiers
// ***************************************************************************

#ifndef BOOST_RT_CLA_MODIFIER_HPP_062604GER
#define BOOST_RT_CLA_MODIFIER_HPP_062604GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

// Boost.Test
#include <boost/test/utils/named_params.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace cla {

// ************************************************************************** //
// **************         environment variable modifiers       ************** //
// ************************************************************************** //

namespace {

nfp::typed_keyword<bool,struct optional_t>              optional_m;
nfp::named_parameter<bool,optional_t,bool>              optional( true );
nfp::typed_keyword<bool,struct required_t>              required_m;
nfp::named_parameter<bool,required_t,bool>              required( true );
nfp::typed_keyword<bool,struct multiplicable_t>         multiplicable_m;
nfp::named_parameter<bool,multiplicable_t,bool>         multiplicable( true );
nfp::typed_keyword<bool,struct guess_name_t>            guess_name_m;
nfp::named_parameter<bool,guess_name_t,bool>            guess_name( true );
nfp::typed_keyword<bool,struct ignore_mismatch_t>       ignore_mismatch_m;
nfp::named_parameter<bool,ignore_mismatch_t,bool>       ignore_mismatch( true );
nfp::typed_keyword<bool,struct optional_value_t>        optional_value_m;
nfp::named_parameter<bool,optional_value_t,bool>        optional_value( true );

nfp::typed_keyword<char_type,struct input_separator_t>  input_separator;
nfp::typed_keyword<cstring,struct prefix_t>             prefix;
nfp::typed_keyword<cstring,struct name_t>               name;
nfp::typed_keyword<cstring,struct separator_t>          separator;
nfp::typed_keyword<cstring,struct description_t>        description;
nfp::typed_keyword<cstring,struct refer_to_t>           default_refer_to;

nfp::keyword<struct default_value_t>                    default_value;
nfp::keyword<struct handler_t>                          handler;
nfp::keyword<struct interpreter_t>                      interpreter;
nfp::keyword<struct assign_to_t>                        assign_to;

} // local namespace

} // namespace cla

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#endif // BOOST_RT_CLA_MODIFIER_HPP_062604GER

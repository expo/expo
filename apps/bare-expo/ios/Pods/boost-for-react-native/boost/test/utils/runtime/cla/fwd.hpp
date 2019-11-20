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
//  Description : cla subsystem forward declarations
// ***************************************************************************

#ifndef BOOST_RT_CLA_FWD_HPP_062604GER
#define BOOST_RT_CLA_FWD_HPP_062604GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

// Boost
#include <boost/shared_ptr.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace cla {

class parser;
class parameter;
typedef shared_ptr<parameter> parameter_ptr;
class naming_policy;
typedef shared_ptr<naming_policy> naming_policy_ptr;
class argv_traverser;

namespace rt_cla_detail {

template<typename T> class const_generator;
template<typename T> class ref_generator;

template<typename T> class assigner;

class named_parameter_base;
class positional_parameter_base;

} // namespace rt_cla_detail

} // namespace cla

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#endif // BOOST_RT_CLA_FWD_HPP_062604GER

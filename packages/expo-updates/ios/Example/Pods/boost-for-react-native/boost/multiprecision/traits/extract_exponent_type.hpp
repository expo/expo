///////////////////////////////////////////////////////////////
//  Copyright 2012 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_

#ifndef BOOST_MATH_EXTRACT_EXPONENT_HPP
#define BOOST_MATH_EXTRACT_EXPONENT_HPP

#include <boost/multiprecision/number.hpp>

namespace boost{
namespace multiprecision{
namespace backends{

template <class Backend, int cat>
struct extract_exponent_type
{
   typedef int type;
};
template <class Backend>
struct extract_exponent_type<Backend, number_kind_floating_point>
{
   typedef typename Backend::exponent_type type;
};

}}} // namespaces

#endif

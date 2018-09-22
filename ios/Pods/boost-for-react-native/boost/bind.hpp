#ifndef BOOST_BIND_HPP_INCLUDED
#define BOOST_BIND_HPP_INCLUDED

// MS compatible compilers support #pragma once

#if defined(_MSC_VER) && (_MSC_VER >= 1020)
# pragma once
#endif

//
//  bind.hpp - binds function objects to arguments
//
//  Copyright (c) 2009, 2015 Peter Dimov
//
//  Distributed under the Boost Software License, Version 1.0.
//  See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt
//
//  See http://www.boost.org/libs/bind/bind.html for documentation.
//

#include <boost/bind/bind.hpp>

#ifndef BOOST_BIND_NO_PLACEHOLDERS

#if defined(BOOST_CLANG)
# pragma clang diagnostic push
# if  __has_warning("-Wheader-hygiene")
#  pragma clang diagnostic ignored "-Wheader-hygiene"
# endif
#endif

using namespace boost::placeholders;

#if defined(BOOST_CLANG)
# pragma clang diagnostic pop
#endif

#endif // #ifndef BOOST_BIND_NO_PLACEHOLDERS

#endif // #ifndef BOOST_BIND_HPP_INCLUDED

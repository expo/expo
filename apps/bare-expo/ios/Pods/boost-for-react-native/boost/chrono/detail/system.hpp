//  Copyright 2009-2010 Vicente J. Botet Escriba

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt

#ifndef BOOST_CHRONO_DETAIL_SYSTEM_HPP
#define BOOST_CHRONO_DETAIL_SYSTEM_HPP

#if !defined BOOST_CHRONO_DONT_PROVIDE_HYBRID_ERROR_HANDLING

#include <boost/version.hpp>
#include <boost/system/error_code.hpp>

#if ((BOOST_VERSION / 100000) < 2) && ((BOOST_VERSION / 100 % 1000) < 44)
#define BOOST_CHRONO_SYSTEM_CATEGORY boost::system::system_category
#else
#define BOOST_CHRONO_SYSTEM_CATEGORY boost::system::system_category()
#endif

#ifdef BOOST_SYSTEM_NO_DEPRECATED
#define BOOST_CHRONO_THROWS boost::throws()
#define BOOST_CHRONO_IS_THROWS(EC) (&EC==&boost::throws())
#else
#define BOOST_CHRONO_THROWS boost::system::throws
#define BOOST_CHRONO_IS_THROWS(EC) (&EC==&boost::system::throws)
#endif

#endif
#endif

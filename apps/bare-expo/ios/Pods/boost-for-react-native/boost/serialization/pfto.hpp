#ifndef BOOST_SERIALIZATION_PFTO_HPP
#define BOOST_SERIALIZATION_PFTO_HPP

// MS compatible compilers support #pragma once
#if defined(_MSC_VER)
# pragma once
#endif

/////////1/////////2/////////3/////////4/////////5/////////6/////////7/////////8
// pfto.hpp: workarounds for compilers which have problems supporting
// Partial Function Template Ordering (PFTO).

// (C) Copyright 2002 Robert Ramey - http://www.rrsd.com . 
// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/serialization for updates, documentation, and revision history.
// PFTO version is used to specify the last argument of certain functions
// Function it is used to support  compilers that fail to support correct Partial 
// Template Ordering
#include <boost/config.hpp>

// some compilers can use an exta argument and use function overloading
// to choose desired function.  This extra argument is long in the default
// function implementation and int for the rest.  The function is called
// with an int argument.  This first attempts to match functions with an
// int argument before the default one (with a long argument).  This is
// known to function with VC 6.0. On other compilers this fails (Borland)
// or causes other problems (GCC).  note: this 

#if defined(BOOST_NO_FUNCTION_TEMPLATE_ORDERING)
    #define BOOST_PFTO long
#else
    #define BOOST_PFTO
#endif

// here's another approach.  Rather than use a default function - make sure
// there is no default at all by requiring that all function invocations
// have a "wrapped" argument type.  This solves a problem with VC 6.0
// (and perhaps others) while implementing templated constructors.

namespace boost {
namespace serialization {

template<class T>
struct pfto_wrapper {
    const T & t;
    operator const T & (){
        return t;
    }
    pfto_wrapper (const T & rhs) : t(rhs) {}
};

template<class T>
pfto_wrapper< T > make_pfto_wrapper(const T & t, BOOST_PFTO int){
    return pfto_wrapper< T >(t);
}

template<class T>
pfto_wrapper< T > make_pfto_wrapper(const pfto_wrapper< T > & t, int){
    return t;
}

} // namespace serialization
} // namespace boost

#ifdef BOOST_NO_FUNCTION_TEMPLATE_ORDERING
    #define BOOST_PFTO_WRAPPER(T) \
        boost::serialization::pfto_wrapper< T >
    #define BOOST_MAKE_PFTO_WRAPPER(t) \
        boost::serialization::make_pfto_wrapper(t, 0)
#else
    #define BOOST_PFTO_WRAPPER(T) T
    #define BOOST_MAKE_PFTO_WRAPPER(t) t
#endif

#endif // BOOST_SERIALIZATION_PFTO_HPP

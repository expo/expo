#ifndef BOOST_SMART_PTR_HPP_INCLUDED
#define BOOST_SMART_PTR_HPP_INCLUDED

//
//  smart_ptr.hpp
//
//  For convenience, this header includes the rest of the smart
//  pointer library headers.
//
//  Copyright (c) 2003 Peter Dimov  Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
//  http://www.boost.org/libs/smart_ptr/smart_ptr.htm
//

#include <boost/config.hpp>

#include <boost/scoped_ptr.hpp>
#include <boost/scoped_array.hpp>
#include <boost/shared_ptr.hpp>
#include <boost/shared_array.hpp>

#if !defined(BOOST_NO_MEMBER_TEMPLATES) || defined(BOOST_MSVC6_MEMBER_TEMPLATES)
# include <boost/weak_ptr.hpp>
# include <boost/intrusive_ptr.hpp>
# include <boost/enable_shared_from_this.hpp>
# include <boost/make_shared.hpp>
#endif

#endif // #ifndef BOOST_SMART_PTR_HPP_INCLUDED

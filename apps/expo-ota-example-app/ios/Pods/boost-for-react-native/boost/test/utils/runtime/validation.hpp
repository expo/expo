//  (C) Copyright Gennadiy Rozental 2005-2008.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at 
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : defines exceptions and validation tools
// ***************************************************************************

#ifndef BOOST_RT_VALIDATION_HPP_062604GER
#define BOOST_RT_VALIDATION_HPP_062604GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

// Boost.Test
#include <boost/test/utils/class_properties.hpp>

// Boost
#include <boost/shared_ptr.hpp>

// STL
#ifdef BOOST_RT_PARAM_EXCEPTION_INHERIT_STD
#include <stdexcept>
#endif

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

// ************************************************************************** //
// **************             runtime::logic_error             ************** //
// ************************************************************************** //

class logic_error 
#ifdef BOOST_RT_PARAM_EXCEPTION_INHERIT_STD
: public std::exception
#endif
{
    typedef shared_ptr<dstring> dstring_ptr;
public:
    // Constructor // !! could we eliminate shared_ptr
    explicit    logic_error( cstring msg ) : m_msg( new dstring( msg.begin(), msg.size() ) ) {}
    ~logic_error() throw()                          {}

    dstring const&   msg() const                    { return *m_msg; }
    virtual char_type const* what() const throw()   { return m_msg->c_str(); }

private:
    dstring_ptr m_msg;
};

// ************************************************************************** //
// **************          runtime::report_logic_error         ************** //
// ************************************************************************** //

inline void
report_logic_error( format_stream& msg )
{
    throw BOOST_RT_PARAM_NAMESPACE::logic_error( msg.str() );
}

//____________________________________________________________________________//

#define BOOST_RT_PARAM_REPORT_LOGIC_ERROR( msg ) \
    boost::BOOST_RT_PARAM_NAMESPACE::report_logic_error( format_stream().ref() << msg )

#define BOOST_RT_PARAM_VALIDATE_LOGIC( b, msg ) \
    if( b ) {} else BOOST_RT_PARAM_REPORT_LOGIC_ERROR( msg )

//____________________________________________________________________________//

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#endif // BOOST_RT_VALIDATION_HPP_062604GER

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
//  Description : positional parameter model
// ***************************************************************************

#ifndef BOOST_RT_CLA_POSITIONAL_PARAMETER_HPP_062604GER
#define BOOST_RT_CLA_POSITIONAL_PARAMETER_HPP_062604GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#include <boost/test/utils/runtime/cla/basic_parameter.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace cla {

// ************************************************************************** //
// **************              trivial_id_policy               ************** //
// ************************************************************************** //

class trivial_id_policy : public identification_policy {
public:
    trivial_id_policy()
    : identification_policy( rtti::type_id<trivial_id_policy>() )
    {}
    BOOST_RT_PARAM_UNNEEDED_VIRTUAL ~trivial_id_policy() {}

    virtual bool    responds_to( cstring name ) const                       { return m_name == name; }
    virtual bool    conflict_with( identification_policy const& ) const     { return false; }
    virtual cstring id_2_report() const                                     { return m_name; }
    virtual void    usage_info( format_stream& fs ) const
    { 
        if( !m_name.empty() )
            fs << BOOST_RT_PARAM_LITERAL( '<' ) << m_name << BOOST_RT_PARAM_LITERAL( '>' );
        else
            fs << BOOST_RT_PARAM_CSTRING_LITERAL( "<value>" );
    }

    virtual bool    matching( parameter const& p, argv_traverser&, bool primary ) const
    {
        return primary && ( !p.has_argument() || p.p_multiplicable );
    }

    template<typename Modifier>
    void            accept_modifier( Modifier const& m )
    {
        nfp::optionally_assign( m_name, m, name );
    }

private:
    // Data members
    dstring      m_name;
};

// ************************************************************************** //
// **************      runtime::cla::positional_parameter      ************** //
// ************************************************************************** //

template<typename T>
class positional_parameter_t : public basic_parameter<T,trivial_id_policy> {
    typedef basic_parameter<T,trivial_id_policy> base;
public:
    // Constructors
    explicit    positional_parameter_t( cstring name )
    : base( name )
    {}
};

//____________________________________________________________________________//

BOOST_RT_CLA_NAMED_PARAM_GENERATORS( positional_parameter )

} // namespace cla

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#endif // BOOST_RT_CLA_POSITIONAL_PARAMETER_HPP_062604GER

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
//  Description : some generic identification policies implementation
// ***************************************************************************

#ifndef BOOST_RT_CLA_ID_POLICY_IPP_062904GER
#define BOOST_RT_CLA_ID_POLICY_IPP_062904GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#include <boost/test/utils/runtime/cla/id_policy.hpp>
#include <boost/test/utils/runtime/cla/parameter.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace cla {

// ************************************************************************** //
// **************              basic_naming_policy             ************** //
// ************************************************************************** //

BOOST_RT_PARAM_INLINE void
basic_naming_policy::usage_info( format_stream& fs ) const
{
    fs << p_prefix << p_name << p_separator;

    if( p_separator->empty() )
        fs << BOOST_RT_PARAM_LITERAL( ' ' );
}

//____________________________________________________________________________//

BOOST_RT_PARAM_INLINE bool
basic_naming_policy::match_prefix( argv_traverser& tr ) const
{
    if( !tr.match_front( p_prefix.get() ) )
        return false;

    tr.trim( p_prefix->size() );
    return true;
}

//____________________________________________________________________________//
    
BOOST_RT_PARAM_INLINE bool
basic_naming_policy::match_name( argv_traverser& tr ) const
{
    if( !tr.match_front( p_name.get() ) )
        return false;

    tr.trim( p_name->size() );
    return true;
}

//____________________________________________________________________________//
    
BOOST_RT_PARAM_INLINE bool
basic_naming_policy::match_separator( argv_traverser& tr, bool optional_value ) const
{
    if( p_separator->empty() ) {
        if( !tr.token().is_empty() )
            return false;

        tr.trim( 1 );
    }
    else {
        if( !tr.match_front( p_separator.get() ) ) {
            // if parameter has optional value separator is optional as well
            if( optional_value && ( tr.eoi() || tr.match_front( ' ' ) ) ) {
                return true;
            }
            return false;
        }

        tr.trim( p_separator->size() );
    }

    return true;
}

//____________________________________________________________________________//

BOOST_RT_PARAM_INLINE bool
basic_naming_policy::matching( parameter const& p, argv_traverser& tr, bool ) const
{
    if( !match_prefix( tr ) )
        return false;
        
    if( !match_name( tr ) )
        return false;

    if( !match_separator( tr, p.p_optional_value ) )
        return false;

    return true;
}

//____________________________________________________________________________//

} // namespace cla

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#endif // BOOST_RT_CLA_ID_POLICY_IPP_062904GER

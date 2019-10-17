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
//  Description : implements model of named parameter
// ***************************************************************************

#ifndef BOOST_RT_CLA_NAMED_PARAMETER_IPP_062904GER
#define BOOST_RT_CLA_NAMED_PARAMETER_IPP_062904GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#include <boost/test/utils/runtime/cla/named_parameter.hpp>
#include <boost/test/utils/runtime/cla/char_parameter.hpp>

// Boost.Test
#include <boost/test/utils/algorithm.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace cla {

// ************************************************************************** //
// **************              string_name_policy              ************** //
// ************************************************************************** //

BOOST_RT_PARAM_INLINE 
string_name_policy::string_name_policy()
: basic_naming_policy( rtti::type_id<string_name_policy>() )
, m_guess_name( false )
{
    assign_op( p_prefix.value, BOOST_RT_PARAM_CSTRING_LITERAL( "-" ), 0 );
}

//____________________________________________________________________________//

BOOST_RT_PARAM_INLINE bool
string_name_policy::responds_to( cstring name ) const
{
    std::pair<cstring::iterator,dstring::const_iterator> mm_pos;

    mm_pos = unit_test::mismatch( name.begin(), name.end(), p_name->begin(), p_name->end() );

    return mm_pos.first == name.end() && (m_guess_name || (mm_pos.second == p_name->end()) );
}

//____________________________________________________________________________//

#ifdef BOOST_MSVC
#  pragma warning(push)
#  pragma warning(disable:4244)
#endif

BOOST_RT_PARAM_INLINE bool
string_name_policy::conflict_with( identification_policy const& id ) const
{
    if( id.p_type_id == p_type_id ) {
        string_name_policy const& snp = static_cast<string_name_policy const&>( id );

        if( p_name->empty() || snp.p_name->empty() )
            return false;

        if( p_prefix != snp.p_prefix )
            return false;

        std::pair<dstring::const_iterator,dstring::const_iterator> mm_pos =
            unit_test::mismatch( p_name->begin(), p_name->end(), snp.p_name->begin(), snp.p_name->end() );

        return mm_pos.first != p_name->begin()                              &&  // there is common substring
                ((m_guess_name    && (mm_pos.second == snp.p_name->end()) ) ||  // that match other guy and I am guessing
                (snp.m_guess_name && (mm_pos.first  == p_name->end()) ));       // or me and the other guy is
    }
    
    if( id.p_type_id == rtti::type_id<char_name_policy>() ) {
        char_name_policy const& cnp = static_cast<char_name_policy const&>( id );

        return m_guess_name                 && 
               (p_prefix == cnp.p_prefix)   && 
               unit_test::first_char( cstring( p_name ) ) == unit_test::first_char( cstring( cnp.p_name ) );
    }
    
    return false;    
}

#ifdef BOOST_MSVC
#  pragma warning(pop)
#endif

//____________________________________________________________________________//

BOOST_RT_PARAM_INLINE bool
string_name_policy::match_name( argv_traverser& tr ) const
{
    if( !m_guess_name )
        return basic_naming_policy::match_name( tr );

    cstring in = tr.input();

    std::pair<cstring::iterator,dstring::const_iterator> mm_pos;
    
    mm_pos = unit_test::mismatch( in.begin(), in.end(), p_name->begin(), p_name->end() );

    if( mm_pos.first == in.begin() )
        return false;

    tr.trim( mm_pos.first - in.begin() );

    return true;
}

//____________________________________________________________________________//

} // namespace cla

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#endif // BOOST_RT_CLA_NAMED_PARAMETER_IPP_062904GER

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
//  Description : implements models configuration file, it's parameter and parameter namespaces
// ***************************************************************************

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#include <boost/test/utils/runtime/file/config_file.hpp>
#include <boost/test/utils/runtime/validation.hpp>

// Boost.Test
#include <boost/test/utils/foreach.hpp>
#include <boost/test/utils/basic_cstring/basic_cstring.hpp>
#include <boost/test/utils/basic_cstring/io.hpp>
#include <boost/test/utils/iterator/token_iterator.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace file {

// ************************************************************************** //
// **************           runtime::file::parameter           ************** //
// ************************************************************************** //

parameter::parameter( cstring name, cstring value, param_namespace const& parent )
: m_parent( parent )
{
    assign_op( p_name.value, name, 0 );
    assign_op( p_value.value, value, 0 );
}

//____________________________________________________________________________//

std::ostream&
operator<<( std::ostream& os, parameter const& p )
{
    p.m_parent.print_full_name( os );

    return os << p.p_name << " = \"" << p.p_value << "\"";
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************        runtime::file::param_namespace        ************** //
// ************************************************************************** //

param_namespace::param_namespace( cstring name, param_namespace const* parent )
: p_parent( parent )
{
    assign_op( p_name.value, name );
}

//____________________________________________________________________________//

void
param_namespace::insert_param( cstring param_name, cstring param_value )
{
    BOOST_TEST_FOREACH( parameter const&, p, m_parameters )
        BOOST_RT_PARAM_VALIDATE_LOGIC( p.p_name != param_name,
                                       BOOST_RT_PARAM_LITERAL( "Duplicate parameter " ) << param_name );

    m_parameters.push_back( parameter( param_name, param_value, *this ) );
}

//____________________________________________________________________________//

param_namespace&
param_namespace::subnamespace( cstring namespace_name )
{
    BOOST_TEST_FOREACH( param_namespace&, subns, m_subnamespaces )
        if( subns.p_name == namespace_name )
            return subns;

    m_subnamespaces.push_back( param_namespace( namespace_name, this ) );

    return m_subnamespaces.back();
}

//____________________________________________________________________________//

void
param_namespace::clear()
{
    m_parameters.clear();
    m_subnamespaces.clear();
}

//____________________________________________________________________________//

void
param_namespace::print_full_name( std::ostream& os ) const
{
    if( !p_parent )
        return;

    p_parent.get()->print_full_name( os );

    os << p_name << "::";
}

//____________________________________________________________________________//

boost::optional<cstring>
get_param_value( param_namespace const& where_from,
                 cstring                name_part1,
                 cstring                name_part2,
                 cstring                name_part3,
                 cstring                name_part4,
                 cstring                name_part5 )
{
    if( name_part2.is_empty() ) {
        boost::optional<cstring> res;

        BOOST_TEST_FOREACH( parameter const&, p, where_from ) {
            if( p.p_name == name_part1 ) {
                res = cstring( p.p_value );
                break;
            }
        }

        return res;
    }
    
    param_namespace const* sns = get_param_subns( where_from, name_part1 );

    return sns ? get_param_value( *sns, name_part2, name_part3, name_part4, name_part5 )
               : boost::optional<cstring>();
}

//____________________________________________________________________________//

cstring
get_requ_param_value( param_namespace const& where_from,
                      cstring                name_part1,
                      cstring                name_part2,
                      cstring                name_part3,
                      cstring                name_part4,
                      cstring                name_part5 )
{
    boost::optional<cstring> v = get_param_value( where_from, name_part1, name_part2, name_part3, name_part4, name_part5 );

#define APPEND_PART( part ) (part.is_empty() ? "" : "::") << (part.is_empty() ? cstring() : part)
    BOOST_RT_PARAM_VALIDATE_LOGIC( !!v, BOOST_RT_PARAM_LITERAL( "Required parameter " ) 
                                        << name_part1 
                                        << APPEND_PART( name_part2 )
                                        << APPEND_PART( name_part3 )
                                        << APPEND_PART( name_part4 )
                                        << APPEND_PART( name_part5 )
                                        << BOOST_RT_PARAM_LITERAL( " value is missing" ) );
#undef APPEND_PART

    return *v;
}

//____________________________________________________________________________//

param_namespace const*
get_param_subns( param_namespace const& where_from, cstring namespace_name )
{
    param_namespace::sub_ns_const_iterator it   = where_from.sub_ns_begin();
    param_namespace::sub_ns_const_iterator end  = where_from.sub_ns_end();

    while( it != end ) {
        if( it->p_name == namespace_name )
            return &*it;

        ++it;
    }

    return 0;
}

//____________________________________________________________________________//

void
param_namespace::load_impl( config_file_iterator cf_it, 
                            cstring value_marker, cstring value_delimeter, cstring namespace_delimeter )
{
    using namespace unit_test;

    while( cf_it != config_file_iterator() ) {
        string_token_iterator ti( *cf_it, (max_tokens = 2,kept_delimeters = dt_none, dropped_delimeters = value_delimeter) );

        cstring param_name  = *ti;
        cstring param_value = *(++ti);

        param_value.trim( value_marker );

        param_namespace* targ_ns = this;

        while( !param_name.is_empty() ) {
            cstring::size_type pos = param_name.find( namespace_delimeter );
            cstring            subname( param_name.begin(), pos == cstring::npos ? param_name.size() : pos );

            if( subname.size() == param_name.size() ) {
                targ_ns->insert_param( param_name, param_value );
                break;
            }
            else {
                targ_ns = &targ_ns->subnamespace( subname );

                param_name.trim_left( subname.size() + namespace_delimeter.size() );
            }
        }
        ++cf_it;
    }
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************          runtime::file::config_file          ************** //
// ************************************************************************** //

config_file::config_file()
: param_namespace( cstring() )
{
}

//____________________________________________________________________________//

config_file::config_file( cstring file_name )
: param_namespace( cstring() )
{
    load( file_name );
}

//____________________________________________________________________________//

} // namespace file

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

// EOF

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
//  Description : defines models configuration file, it's parameter and parameter namespaces
// ***************************************************************************

#ifndef BOOST_RT_FILE_CONFIG_FILE_HPP_010105GER
#define BOOST_RT_FILE_CONFIG_FILE_HPP_010105GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#include <boost/test/utils/runtime/file/config_file_iterator.hpp>

// Boost.Test
#include <boost/test/utils/class_properties.hpp>
#include <boost/test/utils/named_params.hpp>

// Boost
#include <boost/optional.hpp>

// STL
#include <list>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace file {

// ************************************************************************** //
// **************           runtime::file::parameter           ************** //
// ************************************************************************** //

class param_namespace;

class parameter {
public:
    // Constructor
    parameter( cstring name, cstring value, param_namespace const& parent );

    BOOST_READONLY_PROPERTY( dstring, (parameter))  p_name;
    BOOST_READONLY_PROPERTY( dstring, (parameter))  p_value;

    friend std::ostream& operator<<( std::ostream& os, parameter const& );

private:
    // Data members
    param_namespace const&  m_parent;
};

// ************************************************************************** //
// **************           runtime::file::modifiers           ************** //
// ************************************************************************** //

namespace {
nfp::typed_keyword<cstring, struct value_marker_t>          value_marker;
nfp::typed_keyword<cstring, struct value_delimeter_t>       value_delimeter;
nfp::typed_keyword<cstring, struct namespace_delimeter_t>   namespace_delimeter;
} // local namespace 

// ************************************************************************** //
// **************        runtime::file::param_namespace        ************** //
// ************************************************************************** //

class param_namespace {
public:
    typedef std::list<parameter>::iterator              iterator;
    typedef std::list<parameter>::const_iterator        const_iterator;
    typedef std::list<param_namespace>::iterator        sub_ns_iterator;
    typedef std::list<param_namespace>::const_iterator  sub_ns_const_iterator;

    // Public properties
    BOOST_READONLY_PROPERTY( dstring, (param_namespace))    p_name;
    unit_test::readonly_property<param_namespace const*>    p_parent;

    void                    load( config_file_iterator cf_it ) { load( cf_it, nfp::no_params );  }
    template<typename Modifier>
    void                    load( config_file_iterator cf_it, Modifier const& m )
    {
        cstring vm = m.has( value_marker )        ? m[value_marker]        : BOOST_RT_PARAM_CSTRING_LITERAL( "\"" );
        cstring vd = m.has( value_delimeter )     ? m[value_delimeter]     : BOOST_RT_PARAM_CSTRING_LITERAL( "= \t\n\r" );
        cstring nd = m.has( namespace_delimeter ) ? m[namespace_delimeter] : BOOST_RT_PARAM_CSTRING_LITERAL( "::" );

        load_impl( cf_it, vm, vd, nd );
    }
    void                    load( cstring file_name )
    {
        load( file_name, nfp::no_params );
    }
    template<typename Modifier>
    void                    load( cstring file_name, Modifier const& m )
    {
        config_file_iterator cfi( file_name, m );

        load( cfi, m );
    }

    void                    insert_param( cstring param_name, cstring param_value );
    param_namespace&        subnamespace( cstring namespace_name );         // find and insert if not present
    void                    clear();

    iterator                begin()                 { return m_parameters.begin(); }
    const_iterator          begin() const           { return m_parameters.begin(); }

    iterator                end()                   { return m_parameters.end(); }
    const_iterator          end() const             { return m_parameters.end(); }

    sub_ns_iterator         sub_ns_begin()          { return m_subnamespaces.begin(); }
    sub_ns_const_iterator   sub_ns_begin() const    { return m_subnamespaces.begin(); }

    sub_ns_iterator         sub_ns_end()            { return m_subnamespaces.end(); }
    sub_ns_const_iterator   sub_ns_end()  const     { return m_subnamespaces.end(); }

    void                    print_full_name( std::ostream& os ) const;

protected:
    explicit                param_namespace( cstring name, param_namespace const* parent = 0 );

private:
    void                    load_impl( config_file_iterator cf_it, 
                                       cstring value_marker_, cstring value_delimeter_, cstring namespace_delimeter_ );

    // Data members
    std::list<parameter>        m_parameters;
    std::list<param_namespace>  m_subnamespaces;
};

//____________________________________________________________________________//

boost::optional<cstring>
get_param_value( param_namespace const& where_from,
                 cstring                name_part1,
                 cstring                name_part2 = cstring(),
                 cstring                name_part3 = cstring(),
                 cstring                name_part4 = cstring(),
                 cstring                name_part5 = cstring() );

//____________________________________________________________________________//

cstring
get_requ_param_value( param_namespace const& where_from,
                      cstring                name_part1,
                      cstring                name_part2 = cstring(),
                      cstring                name_part3 = cstring(),
                      cstring                name_part4 = cstring(),
                      cstring                name_part5 = cstring() );

//____________________________________________________________________________//

param_namespace const*
get_param_subns( param_namespace const& where_from,
                 cstring                namespace_name );

//____________________________________________________________________________//

// ************************************************************************** //
// **************          runtime::file::config_file          ************** //
// ************************************************************************** //

class config_file : public param_namespace {
public:
    // Constructor
    config_file();
    config_file( cstring file_name );
};

} // namespace file

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#endif // BOOST_RT_FILE_CONFIG_FILE_HPP_010105GER

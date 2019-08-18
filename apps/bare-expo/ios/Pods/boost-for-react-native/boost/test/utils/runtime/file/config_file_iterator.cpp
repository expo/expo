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
//  Description : flexible configuration file iterator implementation
// ***************************************************************************

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#include <boost/test/utils/runtime/file/config_file_iterator.hpp>
#include <boost/test/utils/runtime/validation.hpp>

#ifndef UNDER_CE
#include <boost/test/utils/runtime/env/environment.hpp>
#endif


// Boost
#include <boost/utility.hpp>
#include <boost/scoped_array.hpp>
#include <boost/bind.hpp>

// Boost.Test
#include <boost/test/utils/basic_cstring/compare.hpp>
#include <boost/test/utils/algorithm.hpp>
#include <boost/test/utils/iterator/token_iterator.hpp>
#include <boost/test/utils/assign_op.hpp>

// STL
#include <memory>
#include <map>
#include <list>
#include <vector>
#include <fstream>
#include <cctype>
#include <iostream>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace file {

// ************************************************************************** //
// **************              symbol_to_value_map             ************** //
// ************************************************************************** //

template<typename ValueType>
struct symbol_to_value_map : std::map<cstring, ValueType> {
    template<typename ParamType>
    void    add( cstring name, ParamType const& value )
    {
        using namespace unit_test;

        m_name_store.push_back( dstring() );

        assign_op( m_name_store.back(), name, 0 );
        assign_op( (*this)[m_name_store.back()], value, 0 );
    }
    void    remove( cstring name )
    {
        std::list<dstring>::iterator it = std::find( m_name_store.begin(), m_name_store.end(), name );

        m_name_store.erase( it );

        erase( name );
    }

private:
    std::list<dstring> m_name_store;
};

// ************************************************************************** //
// **************                 symbol_table_t               ************** //
// ************************************************************************** //

typedef symbol_to_value_map<dstring> symbol_table_t;

// ************************************************************************** //
// **************              command_handler_map             ************** //
// ************************************************************************** //

typedef symbol_to_value_map<config_file_iterator::command_handler>    command_handler_map;

// ************************************************************************** //
// **************               is_valid_identifier            ************** //
// ************************************************************************** //

static bool
is_valid_identifier( cstring const& source )
{
    if( source.is_empty() )
        return false;

    cstring::const_iterator it = source.begin();

    if( !std::isalpha( *it ) )
        return false;

    while( ++it < source.end() ) {
        if( !std::isalnum( *it ) && *it != BOOST_RT_PARAM_LITERAL( '_' ) && *it != BOOST_RT_PARAM_LITERAL( '-' ) )
            return false;
    }

    return true;
}

// ************************************************************************** //
// **************                 include_level                ************** //
// ************************************************************************** //

struct include_level;
typedef std::auto_ptr<include_level> include_level_ptr;

struct include_level : noncopyable
{
    // Constructor
    explicit            include_level( cstring file_name, cstring path_separators, include_level* parent = 0 );

    // Data members
    std::ifstream       m_stream;
    location            m_curr_location;
    include_level_ptr   m_parent;
};

//____________________________________________________________________________//

include_level::include_level( cstring file_name, cstring path_separators, include_level* parent_ )
: m_parent( parent_ )
{
    if( file_name.is_empty() )
        return;

    assign_op( m_curr_location.first, file_name, 0 );
    m_curr_location.second = 0;

    m_stream.open( m_curr_location.first.c_str() );

    if( !m_stream.is_open() && !!m_parent.get() ) {
        cstring            parent_path = m_parent->m_curr_location.first;
        cstring::iterator  it          = unit_test::find_last_of( parent_path.begin(), parent_path.end(),
                                                                  path_separators.begin(),
                                                                  path_separators.end() );

        if( it != parent_path.end() ) {
            assign_op( m_curr_location.first, cstring( parent_path.begin(), it+1 ), 0 );
            m_curr_location.first.append( file_name.begin(), file_name.end() );
            m_stream.clear();
            m_stream.open( m_curr_location.first.c_str() );
        }
    }

    BOOST_RT_PARAM_VALIDATE_LOGIC( m_stream.is_open(), BOOST_RT_PARAM_LITERAL( "can't open file " ) << file_name );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************          config_file_iterator::Impl          ************** //
// ************************************************************************** //

struct config_file_iterator::Impl : noncopyable {
    // Constructor
    Impl();

    bool                get_next_line( cstring& next_line );

    void                process_command_line( cstring line );
    void                process_include( cstring line );
    void                process_define( cstring line );
    void                process_undef( cstring line );
    void                process_ifdef( cstring line );
    void                process_ifndef( cstring line );
    void                process_else( cstring line );
    void                process_endif( cstring line );

    boost::optional<cstring>
                        get_macro_value( cstring macro_name, bool ignore_missing = true );
    void                substitute_macros( cstring& where );

    bool                is_active_line() { return m_inactive_ifdef_level == 0; }

    static bool         match_front( cstring str, cstring pattern )
    {
        return str.size() >= pattern.size() && str.substr( 0, pattern.size() ) == pattern;
    }
    static bool         match_back( cstring str, cstring pattern )
    {
        return str.size() >= pattern.size() && str.substr( str.size() - pattern.size() ) == pattern;
    }

    // Configurable parameters
    dstring          m_path_separators;
    char_type           m_line_delimeter;
    dstring          m_sl_comment_delimeter;
    dstring          m_command_delimeter;
    dstring          m_line_beak;
    dstring          m_macro_ref_begin;
    dstring          m_macro_ref_end;

    dstring          m_include_kw;
    dstring          m_define_kw;
    dstring          m_undef_kw;
    dstring          m_ifdef_kw;
    dstring          m_ifndef_kw;
    dstring          m_else_kw;
    dstring          m_endif_kw;

    std::size_t         m_buffer_size;

    bool                m_trim_trailing_spaces;
    bool                m_trim_leading_spaces;
    bool                m_skip_empty_lines;
    bool                m_detect_missing_macro;

    // Data members
    dstring          m_post_subst_line;
    scoped_array<char>  m_buffer;
    include_level_ptr   m_curr_level;
    symbol_table_t      m_symbols_table;
    std::vector<bool>   m_conditional_states;
    std::size_t         m_inactive_ifdef_level;
    command_handler_map m_command_handler_map;
};

//____________________________________________________________________________//

config_file_iterator::Impl::Impl()
: m_path_separators( BOOST_RT_PARAM_LITERAL( "/\\" ) )
, m_line_delimeter( BOOST_RT_PARAM_LITERAL( '\n' ) )
, m_sl_comment_delimeter( BOOST_RT_PARAM_LITERAL( "#" ) )
, m_command_delimeter( BOOST_RT_PARAM_LITERAL( "$" ) )
, m_line_beak( BOOST_RT_PARAM_LITERAL( "\\" ) )
, m_macro_ref_begin( BOOST_RT_PARAM_LITERAL( "$" ) )
, m_macro_ref_end( BOOST_RT_PARAM_LITERAL( "$" ) )

, m_include_kw( BOOST_RT_PARAM_LITERAL( "include" ) )
, m_define_kw( BOOST_RT_PARAM_LITERAL( "define" ) )
, m_undef_kw( BOOST_RT_PARAM_LITERAL( "undef" ) )
, m_ifdef_kw( BOOST_RT_PARAM_LITERAL( "ifdef" ) )
, m_ifndef_kw( BOOST_RT_PARAM_LITERAL( "ifndef" ) )
, m_else_kw( BOOST_RT_PARAM_LITERAL( "else" ) )
, m_endif_kw( BOOST_RT_PARAM_LITERAL( "endif" ) )

, m_buffer_size( 8192 )

, m_trim_trailing_spaces( true )
, m_trim_leading_spaces( false )
, m_skip_empty_lines( true )
, m_detect_missing_macro( true )

, m_inactive_ifdef_level( 0 )
{}

//____________________________________________________________________________//

bool
config_file_iterator::Impl::get_next_line( cstring& line )
{
    bool broken_line = false;

    line.clear();

    while( !m_curr_level->m_stream.eof() || !!m_curr_level->m_parent.get() ) {
        // 10. Switch to upper include level if current one is finished
        // 20.  Read/append next file line
        // 30.  Increment line number
        // 40.  Remove comments
        // 50.  Remove trailing and leading spaces
        // 60.  Skip empty string
        // 70.  Concatenate broken lines if needed. Put the result into line
        // 80.  If line is not completed, try to finish it by reading the next line
        // 90.  Process command line
        // 100. Substitute macros references with their definitions
        // 110. Next line found.

        if( m_curr_level->m_stream.eof() ) {                                                // 10 //
            m_curr_level = m_curr_level->m_parent;
            continue;
        }

        std::ifstream&  input   = m_curr_level->m_stream;
        char_type* buffer_insert_pos = broken_line ? m_buffer.get() + line.size() : m_buffer.get();

        input.getline( buffer_insert_pos, (std::streamsize)(m_buffer_size - line.size()),   // 20 //
                       m_line_delimeter );

        cstring next_line( buffer_insert_pos,
                           input.gcount() > 0
                             ? buffer_insert_pos + (input.eof() ? input.gcount() : (input.gcount()-1))
                             : buffer_insert_pos );


        m_curr_level->m_curr_location.second++;                                             // 30 //

        cstring::size_type comment_pos = next_line.find( m_sl_comment_delimeter );
        if( comment_pos != cstring::npos )
            next_line.trim_right( next_line.begin()+comment_pos );                          // 40 //

        if( m_trim_trailing_spaces )                                                        // 50 //
            next_line.trim_right();
        if( m_trim_leading_spaces && !broken_line )
            next_line.trim_left();

        if( next_line.is_empty() ) {                                                        // 60 //
            if( m_skip_empty_lines )
                continue;
            else
                next_line.assign( buffer_insert_pos, buffer_insert_pos );
        }

        line = broken_line ? cstring( line.begin(), next_line.end() ) : next_line;          // 70 //

        broken_line = match_back( line, m_line_beak );
        if( broken_line ) {                                                                 // 80 //
            line.trim_right( 1 );
            continue;
        }

        if( match_front( line, m_command_delimeter ) ) {                                    // 90 //
            process_command_line( line );
            continue;
        }

        if( !is_active_line() )
            continue;

        substitute_macros( line );                                                          // 100 //

        return true;                                                                        // 110 //
    }

    BOOST_RT_PARAM_VALIDATE_LOGIC( !broken_line, BOOST_RT_PARAM_LITERAL( "broken line is not completed" ) );
    BOOST_RT_PARAM_VALIDATE_LOGIC( m_conditional_states.size() == 0,
                                   BOOST_RT_PARAM_LITERAL( "matching endif command is missing" ) );

    return false;
}

//____________________________________________________________________________//

boost::optional<cstring>
config_file_iterator::Impl::get_macro_value( cstring macro_name, bool ignore_missing )
{
    symbol_table_t::const_iterator it = m_symbols_table.find( macro_name );

    if( it == m_symbols_table.end() ) {
        boost::optional<cstring> macro_value; // !! variable actually may have different type

        #ifndef UNDER_CE
        env::get( macro_name, macro_value );
        #endif

        BOOST_RT_PARAM_VALIDATE_LOGIC( macro_value || ignore_missing || !m_detect_missing_macro, 
            BOOST_RT_PARAM_LITERAL( "Unknown macro \"" ) << macro_name << BOOST_RT_PARAM_LITERAL( "\"" ) );
        
        if( !macro_value ) {
            if( !ignore_missing )
                macro_value = cstring();
        }
        else 
            m_symbols_table.add( macro_name, *macro_value );

        return macro_value;
    }

    return boost::optional<cstring>( cstring( it->second ) );
}

//____________________________________________________________________________//

void
config_file_iterator::Impl::process_command_line( cstring line )
{
    line.trim_left( m_command_delimeter.size() );

    unit_test::string_token_iterator tit( line, unit_test::max_tokens = 2 );

    command_handler_map::const_iterator it = m_command_handler_map.find( *tit );

    BOOST_RT_PARAM_VALIDATE_LOGIC( it != m_command_handler_map.end(), BOOST_RT_PARAM_LITERAL( "Invalid command " ) << *tit );

    ++tit;

    (it->second)( *tit );
}

//____________________________________________________________________________//

void
config_file_iterator::Impl::process_include( cstring line )
{
    using namespace unit_test;

    if( !is_active_line() )
        return;

    string_token_iterator tit( line, kept_delimeters = dt_none );

    BOOST_RT_PARAM_VALIDATE_LOGIC( tit != string_token_iterator(),
                                   BOOST_RT_PARAM_LITERAL( "include file name missing" ) );

    cstring include_file_name = *tit;

    BOOST_RT_PARAM_VALIDATE_LOGIC( ++tit == string_token_iterator(),
                                   BOOST_RT_PARAM_LITERAL( "unexpected tokens at the end of include command" ) );

    substitute_macros( include_file_name );

    m_curr_level.reset( new include_level( include_file_name, m_path_separators, m_curr_level.release() ) );
}

//____________________________________________________________________________//

void
config_file_iterator::Impl::process_define( cstring line )
{
    using namespace unit_test;

    if( !is_active_line() )
        return;

    string_token_iterator tit( line, (kept_delimeters = dt_none, max_tokens = 2 ));

    cstring macro_name = *tit;
    BOOST_RT_PARAM_VALIDATE_LOGIC( is_valid_identifier( macro_name ),
                                   BOOST_RT_PARAM_LITERAL( "invalid macro name" ) );

    cstring macro_value = *(++tit);
    substitute_macros( macro_value );

    m_symbols_table.add( macro_name, macro_value );
}

//____________________________________________________________________________//

void
config_file_iterator::Impl::process_undef( cstring line )
{
    if( !is_active_line() )
        return;

    cstring macro_name = line;
    BOOST_RT_PARAM_VALIDATE_LOGIC( is_valid_identifier( macro_name ),
                                   BOOST_RT_PARAM_LITERAL( "invalid macro name" ) );

    m_symbols_table.remove( macro_name );
}

//____________________________________________________________________________//

void
config_file_iterator::Impl::process_ifdef( cstring line )
{
    m_conditional_states.push_back( true );
    if( !is_active_line() )
        return;

    cstring macro_name = line;
    BOOST_RT_PARAM_VALIDATE_LOGIC( is_valid_identifier( macro_name ),
                                   BOOST_RT_PARAM_LITERAL( "invalid macro name" ) );

    if( !get_macro_value( macro_name ) )
        m_inactive_ifdef_level = m_conditional_states.size();
}

//____________________________________________________________________________//

void
config_file_iterator::Impl::process_ifndef( cstring line )
{
    m_conditional_states.push_back( true );
    if( !is_active_line() )
        return;

    cstring macro_name = line;
    BOOST_RT_PARAM_VALIDATE_LOGIC( is_valid_identifier( macro_name ),
                                   BOOST_RT_PARAM_LITERAL( "invalid macro name" ) );

    if( get_macro_value( macro_name ) )
        m_inactive_ifdef_level = m_conditional_states.size();
}

//____________________________________________________________________________//

void
config_file_iterator::Impl::process_else( cstring line )
{
    BOOST_RT_PARAM_VALIDATE_LOGIC( m_conditional_states.size() > 0 && m_conditional_states.back(),
                                   BOOST_RT_PARAM_LITERAL( "else without matching if" ) );

    m_inactive_ifdef_level = m_conditional_states.size() == m_inactive_ifdef_level ? 0 : m_conditional_states.size();

    BOOST_RT_PARAM_VALIDATE_LOGIC( line.is_empty(), BOOST_RT_PARAM_LITERAL( "unexpected tokens at the end of else command" ) );
}

//____________________________________________________________________________//

void
config_file_iterator::Impl::process_endif( cstring line )
{
    BOOST_RT_PARAM_VALIDATE_LOGIC( m_conditional_states.size() > 0, BOOST_RT_PARAM_LITERAL( "endif without matching if" ) );

    if( m_conditional_states.size() == m_inactive_ifdef_level )
        m_inactive_ifdef_level = 0;

    m_conditional_states.pop_back();
    BOOST_RT_PARAM_VALIDATE_LOGIC( line.is_empty(), BOOST_RT_PARAM_LITERAL( "unexpected tokens at the end of endif command" ) );
}

//____________________________________________________________________________//

void
config_file_iterator::Impl::substitute_macros( cstring& where )
{
    m_post_subst_line.clear();
    cstring::size_type pos;

    while( (pos = where.find( m_macro_ref_begin )) != cstring::npos ) {
        m_post_subst_line.append( where.begin(), pos );

        where.trim_left( where.begin() + pos + m_macro_ref_begin.size() );

        pos = where.find( m_macro_ref_end );

        BOOST_RT_PARAM_VALIDATE_LOGIC( pos != cstring::npos, BOOST_RT_PARAM_LITERAL( "incomplete macro reference" ) );

        cstring value = *get_macro_value( where.substr( 0, pos ), false );
        m_post_subst_line.append( value.begin(), value.size() );

        where.trim_left( where.begin() + pos + m_macro_ref_end.size() );
    }

    if( !m_post_subst_line.empty() ) {
        m_post_subst_line.append( where.begin(), where.size() );
        where = m_post_subst_line;
    }
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************      runtime::file::config_file_iterator      ************** //
// ************************************************************************** //

void
config_file_iterator::construct()
{
    m_pimpl.reset( new Impl );
}

//____________________________________________________________________________//

void
config_file_iterator::load( cstring file_name )
{
    m_pimpl->m_curr_level.reset( new include_level( file_name, m_pimpl->m_path_separators ) );
    m_pimpl->m_buffer.reset( new char[m_pimpl->m_buffer_size] );

    register_command_handler( m_pimpl->m_include_kw, bind( &Impl::process_include, m_pimpl.get(), _1 ) );
    register_command_handler( m_pimpl->m_define_kw, bind( &Impl::process_define, m_pimpl.get(), _1 ) );
    register_command_handler( m_pimpl->m_undef_kw, bind( &Impl::process_undef, m_pimpl.get(), _1 ) );
    register_command_handler( m_pimpl->m_ifdef_kw, bind( &Impl::process_ifdef, m_pimpl.get(), _1 ) );
    register_command_handler( m_pimpl->m_ifndef_kw, bind( &Impl::process_ifndef, m_pimpl.get(), _1 ) );
    register_command_handler( m_pimpl->m_else_kw, bind( &Impl::process_else, m_pimpl.get(), _1 ) );
    register_command_handler( m_pimpl->m_endif_kw, bind( &Impl::process_endif, m_pimpl.get(), _1 ) );

    init();
}

//____________________________________________________________________________//

location const&
config_file_iterator::curr_location()
{
    return m_pimpl->m_curr_level->m_curr_location;
}

//____________________________________________________________________________//

void
config_file_iterator::register_command_handler( cstring command_kw, command_handler const& ch )
{
    m_pimpl->m_command_handler_map.add( command_kw, ch );
}

//____________________________________________________________________________//

bool
config_file_iterator::get()
{
    return m_pimpl->get_next_line( m_value );
}

//____________________________________________________________________________//

void
config_file_iterator::set_parameter( rtti::id_t id, cstring value )
{
    BOOST_RTTI_SWITCH( id ) {
        BOOST_RTTI_CASE( cfg_detail::path_separators_t ) 
            assign_op( m_pimpl->m_path_separators        , value, 0 );
        BOOST_RTTI_CASE( cfg_detail::sl_comment_delimeter_t ) 
            assign_op( m_pimpl->m_sl_comment_delimeter   , value, 0 );
        BOOST_RTTI_CASE( cfg_detail::command_delimeter_t ) 
            assign_op( m_pimpl->m_command_delimeter      , value, 0 );
        BOOST_RTTI_CASE( cfg_detail::line_beak_t ) 
            assign_op( m_pimpl->m_line_beak              , value, 0 );
        BOOST_RTTI_CASE( cfg_detail::macro_ref_begin_t ) 
            assign_op( m_pimpl->m_macro_ref_begin        , value, 0 );
        BOOST_RTTI_CASE( cfg_detail::macro_ref_end_t ) 
            assign_op( m_pimpl->m_macro_ref_end          , value, 0 );
        BOOST_RTTI_CASE( cfg_detail::include_kw_t ) 
            assign_op( m_pimpl->m_include_kw             , value, 0 );
        BOOST_RTTI_CASE( cfg_detail::define_kw_t ) 
            assign_op( m_pimpl->m_define_kw              , value, 0 );
        BOOST_RTTI_CASE( cfg_detail::undef_kw_t ) 
            assign_op( m_pimpl->m_undef_kw               , value, 0 );
        BOOST_RTTI_CASE( cfg_detail::ifdef_kw_t ) 
            assign_op( m_pimpl->m_ifdef_kw               , value, 0 );
        BOOST_RTTI_CASE( cfg_detail::ifndef_kw_t ) 
            assign_op( m_pimpl->m_ifndef_kw              , value, 0 );
        BOOST_RTTI_CASE( cfg_detail::else_kw_t ) 
            assign_op( m_pimpl->m_else_kw                , value, 0 );
        BOOST_RTTI_CASE( cfg_detail::endif_kw_t ) 
            assign_op( m_pimpl->m_endif_kw               , value, 0 );
    }
}

//____________________________________________________________________________//

void
config_file_iterator::set_parameter( rtti::id_t id, bool value )
{
    BOOST_RTTI_SWITCH( id ) {
        BOOST_RTTI_CASE( cfg_detail::trim_leading_spaces_t ) 
            m_pimpl->m_trim_leading_spaces  = value;
        BOOST_RTTI_CASE( cfg_detail::trim_trailing_spaces_t )
            m_pimpl->m_trim_trailing_spaces = value;
        BOOST_RTTI_CASE( cfg_detail::skip_empty_lines_t )
            m_pimpl->m_skip_empty_lines     = value;
        BOOST_RTTI_CASE( cfg_detail::detect_missing_macro_t )
            m_pimpl->m_detect_missing_macro = value;
    }
}

//____________________________________________________________________________//

void
config_file_iterator::set_parameter( rtti::id_t id, char_type value )
{
    BOOST_RTTI_SWITCH( id ) {
        BOOST_RTTI_CASE( cfg_detail::line_delimeter_t ) 
            m_pimpl->m_line_delimeter       = value;
    }
}

//____________________________________________________________________________//

void
config_file_iterator::set_parameter( rtti::id_t id, std::size_t value )
{
    BOOST_RTTI_SWITCH( id ) {
        BOOST_RTTI_CASE( cfg_detail::buffer_size_t ) 
            m_pimpl->m_buffer_size          = value;
    }
}

//____________________________________________________________________________//

} // namespace file

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

// EOF

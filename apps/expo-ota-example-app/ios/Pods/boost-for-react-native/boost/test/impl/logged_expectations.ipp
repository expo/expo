//  (C) Copyright Gennadiy Rozental 2005-2008.
//  Use, modification, and distribution are subject to the
//  Boost Software License, ELOG_VER 1.0. (See accompanying file
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : Facilities to perform interaction based testng of logged expectations
// ***************************************************************************

#ifndef BOOST_TEST_LOGGED_EXPECTATIONS_IPP_120905GER
#define BOOST_TEST_LOGGED_EXPECTATIONS_IPP_120905GER

// Boost.Test
#include <boost/test/detail/config.hpp>

#if BOOST_TEST_SUPPORT_INTERACTION_TESTING

#include <boost/test/detail/global_typedef.hpp>

#include <boost/test/utils/callback.hpp>
#include <boost/test/utils/iterator/token_iterator.hpp>

#include <boost/test/interaction_based.hpp>
#include <boost/test/test_tools.hpp>

#include <boost/test/detail/suppress_warnings.hpp>

// Boost
#include <boost/lexical_cast.hpp>

// STL
#include <fstream>

//____________________________________________________________________________//

namespace boost {

using namespace ::boost::unit_test;

namespace itest {

// ************************************************************************** //
// **************    logged expectation test implementation    ************** //
// ************************************************************************** //

struct expectations_logger : itest::manager {
    // Constructor
    expectations_logger( const_string log_file_name, bool test_or_log );

    virtual bool        decision_point( const_string, std::size_t );
    virtual unsigned    enter_scope( const_string, std::size_t, const_string scope_name );
    virtual void        allocated( const_string, std::size_t, void*, std::size_t s );
    virtual void        data_flow( const_string d );
    virtual std::string return_value( const_string default_value );
    
private:
    // Data members
    bool            m_test_or_log;
    std::fstream    m_log_file;
};

literal_string ELOG_VER     = "1.0";
literal_string CLMN_SEP     = "|";
static const char LINE_SEP  = '\n';

literal_string FILE_SIG     = "ELOG";
literal_string SCOPE_SIG    = "SCOPE";
literal_string ALLOC_SIG    = "ALLOC";
literal_string DP_SIG       = "SWITCH";
literal_string DATA_SIG     = "DATA";
literal_string RETURN_SIG   = "RETURN";

//____________________________________________________________________________//

expectations_logger::expectations_logger( const_string log_file_name, bool test_or_log )
: m_test_or_log( test_or_log )
{
    BOOST_REQUIRE_MESSAGE( !log_file_name.is_empty(), "Empty expectations log file name" );

    m_log_file.open( log_file_name.begin(), test_or_log ? std::ios::in : std::ios::out );

    BOOST_REQUIRE_MESSAGE( m_log_file.is_open(),
                           "Can't open expectations log file " << log_file_name
                                << " for " << ( m_test_or_log ? "reading" : "writing") );

    if( m_test_or_log ) {
        std::string line;
        
        std::getline( m_log_file, line, LINE_SEP );
        
        const_string cline( line );
        string_token_iterator tit( cline, (dropped_delimeters = CLMN_SEP, kept_delimeters = dt_none));

        BOOST_CHECK_EQUAL( *tit, FILE_SIG ); 
        ++tit;
        BOOST_CHECK_EQUAL( *tit, ELOG_VER );
    }
    else {
        m_log_file << FILE_SIG << CLMN_SEP << ELOG_VER << LINE_SEP;
    }
}

//____________________________________________________________________________//

bool
expectations_logger::decision_point( const_string, std::size_t )
{
    if( m_test_or_log ) {
        std::string line;
        
        std::getline( m_log_file, line, LINE_SEP );
        
        const_string cline( line );
        string_token_iterator tit( cline, (dropped_delimeters = CLMN_SEP, kept_delimeters = dt_none));
        
        BOOST_CHECK_EQUAL( *tit, DP_SIG ); ++tit;
        return lexical_cast<bool>( *tit );
    }
    else {
        m_log_file << DP_SIG << CLMN_SEP << std::boolalpha << true << LINE_SEP;
        
        return true;
    }
}

//____________________________________________________________________________//
    
unsigned
expectations_logger::enter_scope( const_string, std::size_t, const_string scope_name )
{
    if( m_test_or_log ) {
        std::string line;
        
        std::getline( m_log_file, line, LINE_SEP );
        
        const_string cline( line );
        string_token_iterator tit( cline, (dropped_delimeters = CLMN_SEP, kept_delimeters = dt_none));
        
        BOOST_CHECK_EQUAL( *tit, SCOPE_SIG ); ++tit;
        BOOST_CHECK_EQUAL( *tit, scope_name );
    }
    else {
        m_log_file << SCOPE_SIG << CLMN_SEP << scope_name << LINE_SEP;
    }
    
    return 0;
}
    
//____________________________________________________________________________//

void
expectations_logger::allocated( const_string, std::size_t, void*, std::size_t s )
{
    if( m_test_or_log ) {
        std::string line;
        
        std::getline( m_log_file, line, LINE_SEP );
        
        const_string cline( line );
        string_token_iterator tit( cline, (dropped_delimeters = CLMN_SEP, kept_delimeters = dt_none));
        
        BOOST_CHECK_EQUAL( *tit, ALLOC_SIG ); ++tit;
        BOOST_CHECK_EQUAL( lexical_cast<std::size_t>( *tit ), s );
    }
    else {
        m_log_file << ALLOC_SIG << CLMN_SEP << s << LINE_SEP;
    }
}

//____________________________________________________________________________//

void
expectations_logger::data_flow( const_string d )
{
    if( m_test_or_log ) {
        std::string line;
        
        std::getline( m_log_file, line, LINE_SEP );
        
        const_string cline( line );
        string_token_iterator tit( cline, (dropped_delimeters = CLMN_SEP, kept_delimeters = dt_none));
        
        BOOST_CHECK_EQUAL( *tit, DATA_SIG ); ++tit;
        BOOST_CHECK_EQUAL( *tit, d );
    }
    else {
        m_log_file << DATA_SIG << CLMN_SEP << d << LINE_SEP;
    }
}

//____________________________________________________________________________//

std::string
expectations_logger::return_value( const_string default_value )
{
    if( m_test_or_log ) {
        std::string line;
        
        std::getline( m_log_file, line, LINE_SEP );
        
        const_string cline( line );
        string_token_iterator tit( cline, (dropped_delimeters = CLMN_SEP, kept_delimeters = dt_none));
        
        BOOST_CHECK_EQUAL( *tit, RETURN_SIG ); ++tit;
        
        return std::string( tit->begin(), tit->size() );
    }
    else {
        m_log_file << RETURN_SIG << CLMN_SEP << default_value << LINE_SEP;
                                 
        return std::string();
    }
}

//____________________________________________________________________________//
    
// ************************************************************************** //
// **************           logged expectations test           ************** //
// ************************************************************************** //

void BOOST_TEST_DECL
logged_expectations( callback0<> const& F, const_string log_file_name, bool test_or_log )
{
    expectations_logger el( log_file_name, test_or_log );

    F();
}

//____________________________________________________________________________//

}  // namespace itest

} // namespace boost

//____________________________________________________________________________//

#include <boost/test/detail/enable_warnings.hpp>

#endif // not ancient compiler

#endif // BOOST_TEST_LOGGED_EXPECTATIONS_IPP_120905GER

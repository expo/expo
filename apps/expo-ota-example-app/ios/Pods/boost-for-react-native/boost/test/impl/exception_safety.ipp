//  (C) Copyright Gennadiy Rozental 2005-2008.
//  Use, modification, and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : Facilities to perform exception safety tests
// ***************************************************************************

#ifndef BOOST_TEST_EXECUTION_SAFETY_IPP_112005GER
#define BOOST_TEST_EXECUTION_SAFETY_IPP_112005GER

// Boost.Test
#include <boost/test/detail/config.hpp>

#if BOOST_TEST_SUPPORT_INTERACTION_TESTING

#include <boost/test/detail/global_typedef.hpp>
#include <boost/test/detail/unit_test_parameters.hpp>

#include <boost/test/utils/callback.hpp>
#include <boost/test/utils/wrap_stringstream.hpp>
#include <boost/test/utils/iterator/token_iterator.hpp>

#include <boost/test/interaction_based.hpp>
#include <boost/test/test_tools.hpp>
#include <boost/test/unit_test_log.hpp>
#include <boost/test/framework.hpp>
#include <boost/test/test_observer.hpp>
#include <boost/test/debug.hpp>

#include <boost/test/detail/suppress_warnings.hpp>

// Boost
#include <boost/lexical_cast.hpp>

// STL
#include <vector>
#include <cstdlib>
#include <map>
#include <iomanip>
#include <cctype>
#include <boost/limits.hpp>

//____________________________________________________________________________//

namespace boost {

using namespace ::boost::unit_test;
 
namespace itest {

// ************************************************************************** //
// **************             execution_path_point             ************** //
// ************************************************************************** //

enum exec_path_point_type { EPP_SCOPE, EPP_EXCEPT, EPP_DECISION, EPP_ALLOC };

struct execution_path_point {
    execution_path_point( exec_path_point_type t, const_string file, std::size_t line_num )
    : m_type( t )
    , m_file_name( file )
    , m_line_num( line_num )
    {}

    exec_path_point_type    m_type;
    const_string             m_file_name;
    std::size_t             m_line_num;

    // Execution path point specific
    struct decision_data {
        bool            value;
        unsigned        forced_exception_point;
    };
    struct scope_data {
        unsigned        size;
        char const*     name;
    };
    struct except_data {
        char const*     description;
    };
    struct alloc_data {
        void*           ptr;
        std::size_t     size;
    };

    union {
        struct decision_data    m_decision;
        struct scope_data       m_scope;
        struct except_data      m_except;
        struct alloc_data       m_alloc;
    };
};

// ************************************************************************** //
// **************     exception safety test implementation     ************** //
// ************************************************************************** //

struct exception_safety_tester : itest::manager, test_observer {
    // helpers types
    struct unique_exception {};

    // Constructor
    explicit            exception_safety_tester( const_string test_name );
    ~exception_safety_tester();

    // check last run and prepare for next
    bool                next_execution_path();

    // memory tracking

    // manager interface implementation
    virtual void        exception_point( const_string file, std::size_t line_num, const_string description );
    virtual bool        decision_point( const_string file, std::size_t line_num );
    virtual unsigned    enter_scope( const_string file, std::size_t line_num, const_string scope_name );
    virtual void        leave_scope( unsigned enter_scope_point );
    virtual void        allocated( const_string file, std::size_t line_num, void* p, std::size_t s );
    virtual void        freed( void* p );

    // test observer interface
    virtual void        assertion_result( bool passed );
    virtual int         priority() { return (std::numeric_limits<int>::max)(); } // we want this observer to run the last

private:
    void                failure_point();
    void                report_error();

    typedef std::vector<execution_path_point>   exec_path;
    typedef std::map<void*,unsigned>            registry;

    // Data members
    bool        m_internal_activity;
    
    unsigned    m_exception_point_counter;
    unsigned    m_forced_exception_point;

    unsigned    m_exec_path_point;
    exec_path   m_execution_path;

    unsigned    m_exec_path_counter;
    unsigned    m_break_exec_path;
    
    bool        m_invairant_failed;
    registry    m_memory_in_use;
};

//____________________________________________________________________________//

struct activity_guard {
    bool& m_v;

    activity_guard( bool& v ) : m_v( v )    { m_v = true; }
    ~activity_guard()                       { m_v = false; }
};

//____________________________________________________________________________//

exception_safety_tester::exception_safety_tester( const_string test_name )
: m_internal_activity( true )
, m_exception_point_counter( 0 )
, m_forced_exception_point( 1 )
, m_exec_path_point( 0 )
, m_exec_path_counter( 1 )
, m_break_exec_path( static_cast<unsigned>(-1) )
, m_invairant_failed( false )
{
    framework::register_observer( *this );

    if( !runtime_config::break_exec_path().is_empty() ) {
        using namespace unit_test;
        
        string_token_iterator tit( runtime_config::break_exec_path(), 
                                   (dropped_delimeters = ":",kept_delimeters = " ") );
        
        const_string test_to_break = *tit;
        
        if( test_to_break == test_name ) {
            ++tit;
            
            m_break_exec_path = lexical_cast<unsigned>( *tit );
        }
    }
    
    m_internal_activity = false;
}

//____________________________________________________________________________//

exception_safety_tester::~exception_safety_tester()
{
    m_internal_activity = true;
    
    framework::deregister_observer( *this );
}

//____________________________________________________________________________//

bool
exception_safety_tester::next_execution_path()
{
    activity_guard ag( m_internal_activity );

    // check memory usage
    if( m_execution_path.size() > 0 ) {
        bool errors_detected = m_invairant_failed || (m_memory_in_use.size() != 0);
        framework::assertion_result( !errors_detected );

        if( errors_detected )
            report_error();

        m_memory_in_use.clear();
    }

    m_exec_path_point           = 0;
    m_exception_point_counter   = 0;
    m_invairant_failed          = false;
    ++m_exec_path_counter;

    while( m_execution_path.size() > 0 ) {
        switch( m_execution_path.back().m_type ) {
        case EPP_SCOPE:
        case EPP_ALLOC:
            m_execution_path.pop_back();
            break;

        case EPP_DECISION:
            if( !m_execution_path.back().m_decision.value ) {
                m_execution_path.pop_back();
                break;
            }

            m_execution_path.back().m_decision.value = false;
            m_forced_exception_point = m_execution_path.back().m_decision.forced_exception_point;
            return true;

        case EPP_EXCEPT:
            m_execution_path.pop_back();
            ++m_forced_exception_point;
            return true;
        }
    }

    BOOST_TEST_MESSAGE( "Total tested " << --m_exec_path_counter << " execution path" );

    return false;
}

//____________________________________________________________________________//

void
exception_safety_tester::exception_point( const_string file, std::size_t line_num, const_string description )
{
    activity_guard ag( m_internal_activity );

    if( ++m_exception_point_counter == m_forced_exception_point ) {
        m_execution_path.push_back(
            execution_path_point( EPP_EXCEPT, file, line_num ) );

        m_execution_path.back().m_except.description = description.begin();

        ++m_exec_path_point;

        failure_point();
    }
}

//____________________________________________________________________________//

bool
exception_safety_tester::decision_point( const_string file, std::size_t line_num )
{
    activity_guard ag( m_internal_activity );

    if( m_exec_path_point < m_execution_path.size() ) {
        BOOST_REQUIRE_MESSAGE( m_execution_path[m_exec_path_point].m_type == EPP_DECISION &&
                               m_execution_path[m_exec_path_point].m_file_name == file &&
                               m_execution_path[m_exec_path_point].m_line_num == line_num,
                               "Function under test exibit non-deterministic behavior" );
    }
    else {
        m_execution_path.push_back(
            execution_path_point( EPP_DECISION, file, line_num ) );

        m_execution_path.back().m_decision.value = true;
        m_execution_path.back().m_decision.forced_exception_point = m_forced_exception_point;
    }

    return m_execution_path[m_exec_path_point++].m_decision.value;
}

//____________________________________________________________________________//

unsigned
exception_safety_tester::enter_scope( const_string file, std::size_t line_num, const_string scope_name )
{
    activity_guard ag( m_internal_activity );

    if( m_exec_path_point < m_execution_path.size() ) {
        BOOST_REQUIRE_MESSAGE( m_execution_path[m_exec_path_point].m_type == EPP_SCOPE &&
                               m_execution_path[m_exec_path_point].m_file_name == file &&
                               m_execution_path[m_exec_path_point].m_line_num == line_num,
                               "Function under test exibit non-deterministic behavior" );
    }
    else {
        m_execution_path.push_back(
            execution_path_point( EPP_SCOPE, file, line_num ) );
    }

    m_execution_path[m_exec_path_point].m_scope.size = 0;
    m_execution_path[m_exec_path_point].m_scope.name = scope_name.begin();

    return m_exec_path_point++;
}

//____________________________________________________________________________//

void
exception_safety_tester::leave_scope( unsigned enter_scope_point )
{
    activity_guard ag( m_internal_activity );

    BOOST_REQUIRE_MESSAGE( m_execution_path[enter_scope_point].m_type == EPP_SCOPE,
                           "Function under test exibit non-deterministic behavior" );

    m_execution_path[enter_scope_point].m_scope.size = m_exec_path_point - enter_scope_point;
}

//____________________________________________________________________________//

void
exception_safety_tester::allocated( const_string file, std::size_t line_num, void* p, std::size_t s )
{
    if( m_internal_activity )
        return;

    activity_guard ag( m_internal_activity );

    if( m_exec_path_point < m_execution_path.size() )
        BOOST_REQUIRE_MESSAGE( m_execution_path[m_exec_path_point].m_type == EPP_ALLOC,
                               "Function under test exibit non-deterministic behavior" );
    else
        m_execution_path.push_back(
            execution_path_point( EPP_ALLOC, file, line_num ) );

    m_execution_path[m_exec_path_point].m_alloc.ptr  = p;
    m_execution_path[m_exec_path_point].m_alloc.size = s;

    m_memory_in_use.insert( std::make_pair( p, m_exec_path_point++ ) );
}

//____________________________________________________________________________//

void
exception_safety_tester::freed( void* p )
{
    if( m_internal_activity )
        return;

    activity_guard ag( m_internal_activity );

    registry::iterator it = m_memory_in_use.find( p );
    if( it != m_memory_in_use.end() ) {
        m_execution_path[it->second].m_alloc.ptr = 0;
        m_memory_in_use.erase( it );
    }
}

//____________________________________________________________________________//

void
exception_safety_tester::assertion_result( bool passed )
{
    if( !m_internal_activity && !passed ) {
        m_invairant_failed = true;

        failure_point();
    }
}

//____________________________________________________________________________//

void
exception_safety_tester::failure_point()
{
    if( m_exec_path_counter == m_break_exec_path )
        debug::debugger_break();
    
    throw unique_exception();
}

//____________________________________________________________________________//
    
namespace {

inline void
format_location( wrap_stringstream& formatter, execution_path_point const& /*p*/, unsigned indent )
{
    if( indent )
        formatter << std::left << std::setw( indent ) << "";

// !! ?? optional   if( p.m_file_name )
//        formatter << p.m_file_name << '(' << p.m_line_num << "): ";
}

//____________________________________________________________________________//

template<typename ExecPathIt>
inline void
format_execution_path( wrap_stringstream& formatter, ExecPathIt it, ExecPathIt end, unsigned indent = 0 )
{
    while( it != end ) {
        switch( it->m_type ) {
        case EPP_SCOPE:
            format_location( formatter, *it, indent );
            formatter << "> \"" << it->m_scope.name << "\"\n";
            format_execution_path( formatter, it+1, it + it->m_scope.size, indent + 2 );
            format_location( formatter, *it, indent );
            formatter << "< \"" << it->m_scope.name << "\"\n";
            it += it->m_scope.size;
            break;

        case EPP_DECISION:
            format_location( formatter, *it, indent );
            formatter << "Decision made as " << std::boolalpha << it->m_decision.value << '\n';
            ++it;
            break;

        case EPP_EXCEPT:
            format_location( formatter, *it, indent );
            formatter << "Forced failure";
            if( it->m_except.description )
                formatter << ": " << it->m_except.description;
            formatter << "\n";
            ++it;
            break;

        case EPP_ALLOC:
            if( it->m_alloc.ptr ) {
                format_location( formatter, *it, indent );
                formatter << "Allocated memory block 0x" << std::uppercase << it->m_alloc.ptr 
                          << ", " << it->m_alloc.size << " bytes long: <";

                unsigned i;
                for( i = 0; i < std::min<std::size_t>( it->m_alloc.size, 8 ); i++ ) {
                    unsigned char c = static_cast<unsigned char*>(it->m_alloc.ptr)[i];
                    if( (std::isprint)( c ) )
                        formatter << c;
                    else
                        formatter << '.';
                }

                formatter << "> ";

                for( i = 0; i < std::min<std::size_t>( it->m_alloc.size, 8 ); i++ ) {
                    unsigned c = static_cast<unsigned char*>(it->m_alloc.ptr)[i];
                    formatter << std::hex << std::uppercase << c << ' ';
                }

                formatter << "\n";
            }
            ++it;
            break;
        }
    }
}

//____________________________________________________________________________//

} // local namespace

void
exception_safety_tester::report_error()
{
    activity_guard ag( m_internal_activity );

    unit_test_log << unit_test::log::begin( m_execution_path.back().m_file_name,
                                            m_execution_path.back().m_line_num )
                  << log_all_errors;

    wrap_stringstream formatter;

    if( m_invairant_failed )
        formatter << "Failed invariant";

    if( m_memory_in_use.size() != 0 ) {
        if( m_invairant_failed )
            formatter << " and ";

        formatter << static_cast<unsigned int>(m_memory_in_use.size()) << " memory leak";
        if( m_memory_in_use.size() > 1 )
            formatter << 's';
    }
    formatter << " detected in the execution path " << m_exec_path_counter << ":\n";

    format_execution_path( formatter, m_execution_path.begin(), m_execution_path.end() );

    unit_test_log << const_string( formatter.str() ) << unit_test::log::end();
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************             exception safety test            ************** //
// ************************************************************************** //

void BOOST_TEST_DECL
exception_safety( callback0<> const& F, const_string test_name )
{
    exception_safety_tester est( test_name );

    do {
        try {
            F();
        }
        catch( exception_safety_tester::unique_exception const& ) {}

    } while( est.next_execution_path() );
}

//____________________________________________________________________________//

}  // namespace itest

} // namespace boost

//____________________________________________________________________________//

#include <boost/test/detail/enable_warnings.hpp>

#endif // non-ancient compiler

#endif // BOOST_TEST_EXECUTION_SAFETY_IPP_112005GER

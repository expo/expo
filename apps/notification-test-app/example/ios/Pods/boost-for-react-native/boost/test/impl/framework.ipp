//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : implements framework API - main driver for the test
// ***************************************************************************

#ifndef BOOST_TEST_FRAMEWORK_IPP_021005GER
#define BOOST_TEST_FRAMEWORK_IPP_021005GER

// Boost.Test
#include <boost/test/framework.hpp>
#include <boost/test/execution_monitor.hpp>
#include <boost/test/debug.hpp>
#include <boost/test/unit_test_parameters.hpp>

#include <boost/test/unit_test_log.hpp>
#include <boost/test/unit_test_log_formatter.hpp>
#include <boost/test/unit_test_monitor.hpp>
#include <boost/test/results_collector.hpp>
#include <boost/test/progress_monitor.hpp>
#include <boost/test/results_reporter.hpp>

#include <boost/test/tree/observer.hpp>
#include <boost/test/tree/test_unit.hpp>
#include <boost/test/tree/visitor.hpp>
#include <boost/test/tree/traverse.hpp>
#include <boost/test/tree/test_case_counter.hpp>

#if BOOST_TEST_SUPPORT_TOKEN_ITERATOR
#include <boost/test/utils/iterator/token_iterator.hpp>
#endif

#include <boost/test/utils/foreach.hpp>
#include <boost/test/utils/basic_cstring/io.hpp>
#include <boost/test/utils/basic_cstring/compare.hpp>

#include <boost/test/detail/global_typedef.hpp>
#include <boost/test/detail/throw_exception.hpp>

// Boost
#include <boost/timer.hpp>
#include <boost/bind.hpp>

// STL
#include <limits>
#include <map>
#include <set>
#include <cstdlib>
#include <ctime>
#include <numeric>

#ifdef BOOST_NO_STDC_NAMESPACE
namespace std { using ::time; using ::srand; }
#endif

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {
namespace unit_test {
namespace framework {
namespace impl {

// ************************************************************************** //
// **************            order detection helpers           ************** //
// ************************************************************************** //

struct order_info {
    order_info() : depth(-1) {}

    int                         depth;
    std::vector<test_unit_id>   dependant_siblings;
};

typedef std::set<test_unit_id> tu_id_set;
typedef std::map<test_unit_id,order_info> order_info_per_tu; // !! ?? unordered map

//____________________________________________________________________________//

static test_unit_id
get_tu_parent( test_unit_id tu_id )
{
    return framework::get( tu_id, TUT_ANY ).p_parent_id;
}

//____________________________________________________________________________//

static int
tu_depth( test_unit_id tu_id, test_unit_id master_tu_id, order_info_per_tu& tuoi )
{
    if( tu_id == master_tu_id )
        return 0;

    order_info& info = tuoi[tu_id];

    if( info.depth == -1 )
        info.depth = tu_depth( get_tu_parent( tu_id ), master_tu_id, tuoi ) + 1;

    return info.depth;
}

//____________________________________________________________________________//

static void
collect_dependant_siblings( test_unit_id from, test_unit_id to, test_unit_id master_tu_id, order_info_per_tu& tuoi )
{
    int from_depth  = tu_depth( from, master_tu_id, tuoi );
    int to_depth    = tu_depth( to, master_tu_id, tuoi );

    while(from_depth > to_depth) {
        from = get_tu_parent( from );
        --from_depth;
    }

    while(from_depth < to_depth) {
        to = get_tu_parent( to );
        --to_depth;
    }

    while(true) {
        test_unit_id from_parent = get_tu_parent( from );
        test_unit_id to_parent = get_tu_parent( to );
        if( from_parent == to_parent )
            break;
        from = from_parent;
        to   = to_parent;
    }

    tuoi[from].dependant_siblings.push_back( to );
}

//____________________________________________________________________________//

static counter_t
assign_sibling_rank( test_unit_id tu_id, order_info_per_tu& tuoi )
{
    test_unit& tu = framework::get( tu_id, TUT_ANY );

    BOOST_TEST_SETUP_ASSERT( tu.p_sibling_rank != (std::numeric_limits<counter_t>::max)(),
                             "Cyclic dependency detected involving test unit \"" + tu.full_name() + "\"" );

    if( tu.p_sibling_rank != 0 )
        return tu.p_sibling_rank;

    order_info const& info = tuoi[tu_id];

    // indicate in progress
    tu.p_sibling_rank.value = (std::numeric_limits<counter_t>::max)();

    counter_t new_rank = 1;
    BOOST_TEST_FOREACH( test_unit_id, sibling_id, info.dependant_siblings )
        new_rank = (std::max)(new_rank, assign_sibling_rank( sibling_id, tuoi ) + 1);

    return tu.p_sibling_rank.value = new_rank;
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************            test_init call wrapper            ************** //
// ************************************************************************** //

static void
invoke_init_func( init_unit_test_func init_func )
{
#ifdef BOOST_TEST_ALTERNATIVE_INIT_API
    BOOST_TEST_I_ASSRT( (*init_func)(), std::runtime_error( "test module initialization failed" ) );
#else
    test_suite*  manual_test_units = (*init_func)( framework::master_test_suite().argc, framework::master_test_suite().argv );

    if( manual_test_units )
        framework::master_test_suite().add( manual_test_units );
#endif
}

// ************************************************************************** //
// **************                  name_filter                 ************** //
// ************************************************************************** //

class name_filter : public test_tree_visitor {
    struct component {
        component( const_string name ) // has to be implicit
        {
            if( name == "*" )
                m_kind  = SFK_ALL;
            else if( first_char( name ) == '*' && last_char( name ) == '*' ) {
                m_kind  = SFK_SUBSTR;
                m_name  = name.substr( 1, name.size()-1 );
            }
            else if( first_char( name ) == '*' ) {
                m_kind  = SFK_TRAILING;
                m_name  = name.substr( 1 );
            }
            else if( last_char( name ) == '*' ) {
                m_kind  = SFK_LEADING;
                m_name  = name.substr( 0, name.size()-1 );
            }
            else {
                m_kind  = SFK_MATCH;
                m_name  = name;
            }
        }

        bool            pass( test_unit const& tu ) const
        {
            const_string name( tu.p_name );

            switch( m_kind ) {
            default:
            case SFK_ALL:
                return true;
            case SFK_LEADING:
                return name.substr( 0, m_name.size() ) == m_name;
            case SFK_TRAILING:
                return name.size() >= m_name.size() && name.substr( name.size() - m_name.size() ) == m_name;
            case SFK_SUBSTR:
                return name.find( m_name ) != const_string::npos;
            case SFK_MATCH:
                return m_name == tu.p_name.get();
            }
        }
        enum kind { SFK_ALL, SFK_LEADING, SFK_TRAILING, SFK_SUBSTR, SFK_MATCH };

        kind            m_kind;
        const_string    m_name;
    };

public:
    // Constructor
    name_filter( test_unit_id_list& targ_list, const_string filter_expr ) : m_targ_list( targ_list ), m_depth( 0 )
    {
#ifdef BOOST_TEST_SUPPORT_TOKEN_ITERATOR
        utils::string_token_iterator tit( filter_expr, (utils::dropped_delimeters = "/",
                                                        utils::kept_delimeters = utils::dt_none) );

        while( tit != utils::string_token_iterator() ) {
            m_components.push_back(
                std::vector<component>( utils::string_token_iterator( *tit, (utils::dropped_delimeters = ",",
                                                                             utils::kept_delimeters = utils::dt_none) ),
                                        utils::string_token_iterator() ) );

            ++tit;
        }
#endif
    }

private:
    bool            filter_unit( test_unit const& tu )
    {
        // skip master test suite
        if( m_depth == 0 )
            return true;

        // corresponding name filters are at level m_depth-1
        std::vector<component> const& filters = m_components[m_depth-1];

        // look for match
        using namespace boost::placeholders;
        return std::find_if( filters.begin(), filters.end(), bind( &component::pass, _1, boost::ref(tu) ) ) != filters.end();
    }

    // test_tree_visitor interface
    virtual void    visit( test_case const& tc )
    {
        // make sure we only accept test cases if we match last component of the filter
        if( m_depth == m_components.size() && filter_unit( tc ) )
            m_targ_list.push_back( tc.p_id ); // found a test case
    }
    virtual bool    test_suite_start( test_suite const& ts )
    {
        if( !filter_unit( ts ) )
            return false;

        if( m_depth < m_components.size() ) {
            ++m_depth;
            return true;
        }

        m_targ_list.push_back( ts.p_id ); // found a test suite

        return false;
    }
    virtual void    test_suite_finish( test_suite const& /*ts*/ )
    {
        --m_depth;
    }

    // Data members
    typedef std::vector<std::vector<component> > components_per_level;

    components_per_level    m_components;
    test_unit_id_list&      m_targ_list;
    unsigned                m_depth;
};

// ************************************************************************** //
// **************                 label_filter                 ************** //
// ************************************************************************** //

class label_filter : public test_tree_visitor {
public:
    label_filter( test_unit_id_list& targ_list, const_string label )
    : m_targ_list( targ_list )
    , m_label( label )
    {}

private:
    // test_tree_visitor interface
    virtual bool    visit( test_unit const& tu )
    {
        if( tu.has_label( m_label ) ) {
            // found a test unit; add it to list of tu to enable with children and stop recursion in case of suites
            m_targ_list.push_back( tu.p_id );
            return false;
        }

        return true;
    }

    // Data members
    test_unit_id_list&  m_targ_list;
    const_string        m_label;
};

// ************************************************************************** //
// **************                set_run_status                ************** //
// ************************************************************************** //

class set_run_status : public test_tree_visitor {
public:
    explicit set_run_status( test_unit::run_status rs, test_unit_id_list* dep_collector = 0 )
    : m_new_status( rs )
    , m_dep_collector( dep_collector )
    {}

private:
    // test_tree_visitor interface
    virtual bool    visit( test_unit const& tu )
    {
        const_cast<test_unit&>(tu).p_run_status.value = m_new_status == test_unit::RS_INVALID ? tu.p_default_status : m_new_status;

        if( m_dep_collector ) {
            BOOST_TEST_FOREACH( test_unit_id, dep_id, tu.p_dependencies.get() ) {
                test_unit const& dep = framework::get( dep_id, TUT_ANY );

                if( dep.p_run_status == tu.p_run_status )
                    continue;

                BOOST_TEST_FRAMEWORK_MESSAGE( "Including test " << dep.p_type_name << ' ' << dep.full_name() <<
                                              " as a dependency of test " << tu.p_type_name << ' ' << tu.full_name() );

                m_dep_collector->push_back( dep_id );
            }
        }
        return true;
    }

    // Data members
    test_unit::run_status   m_new_status;
    test_unit_id_list*      m_dep_collector;
};

// ************************************************************************** //
// **************                 parse_filters                ************** //
// ************************************************************************** //

static void
add_filtered_test_units( test_unit_id master_tu_id, const_string filter, test_unit_id_list& targ )
{
    // Choose between two kinds of filters
    if( filter[0] == '@' ) {
        filter.trim_left( 1 );
        label_filter lf( targ, filter );
        traverse_test_tree( master_tu_id, lf, true );
    }
    else {
        name_filter nf( targ, filter );
        traverse_test_tree( master_tu_id, nf, true );
    }
}

//____________________________________________________________________________//

static bool
parse_filters( test_unit_id master_tu_id, test_unit_id_list& tu_to_enable, test_unit_id_list& tu_to_disable )
{
    // 10. collect tu to enable and disable based on filters
    bool had_selector_filter = false;

    std::vector<std::string> const& filters = runtime_config::get<std::vector<std::string> >( runtime_config::RUN_FILTERS );

    BOOST_TEST_FOREACH( const_string, filter, filters ) {
        BOOST_TEST_SETUP_ASSERT( !filter.is_empty(), "Invalid filter specification" );

        // each --run_test command may also be separated by a ':' (environment variable)
        utils::string_token_iterator t_filter_it( filter, (utils::dropped_delimeters = ":",
                                                           utils::kept_delimeters = utils::dt_none) );

        while( t_filter_it != utils::string_token_iterator() ) {
            const_string filter_token = *t_filter_it;

            enum { SELECTOR, ENABLER, DISABLER } filter_type = SELECTOR;

            // 11. Deduce filter type
            if( filter_token[0] == '!' || filter_token[0] == '+' ) {
                filter_type = filter_token[0] == '+' ? ENABLER : DISABLER;
                filter_token.trim_left( 1 );
                BOOST_TEST_SETUP_ASSERT( !filter_token.is_empty(), "Invalid filter specification" );
            }

            had_selector_filter |= filter_type == SELECTOR;

            // 12. Add test units to corresponding list
            switch( filter_type ) {
            case SELECTOR:
            case ENABLER:  add_filtered_test_units( master_tu_id, filter_token, tu_to_enable ); break;
            case DISABLER: add_filtered_test_units( master_tu_id, filter_token, tu_to_disable ); break;
            }

            ++t_filter_it;
        }
    }

    return had_selector_filter;
}

//____________________________________________________________________________//

} // namespace impl

// ************************************************************************** //
// **************               framework::state               ************** //
// ************************************************************************** //

unsigned const TIMEOUT_EXCEEDED = static_cast<unsigned>( -1 );

class state {
public:
    state()
    : m_curr_test_case( INV_TEST_UNIT_ID )
    , m_next_test_case_id( MIN_TEST_CASE_ID )
    , m_next_test_suite_id( MIN_TEST_SUITE_ID )
    , m_test_in_progress( false )
    , m_context_idx( 0 )
    , m_log_sinks( )
    , m_report_sink( std::cerr )
    {
    }

    ~state() { clear(); }

    void            clear()
    {
        while( !m_test_units.empty() ) {
            test_unit_store::value_type const& tu     = *m_test_units.begin();
            test_unit const*                   tu_ptr = tu.second;

            // the delete will erase this element from map
            if( ut_detail::test_id_2_unit_type( tu.second->p_id ) == TUT_SUITE )
                delete static_cast<test_suite const*>(tu_ptr);
            else
                delete static_cast<test_case const*>(tu_ptr);
        }
    }

    void            set_tu_id( test_unit& tu, test_unit_id id ) { tu.p_id.value = id; }

    //////////////////////////////////////////////////////////////////

    // Validates the dependency graph and deduces the sibling dependency rank for each child
    void       deduce_siblings_order( test_unit_id tu_id, test_unit_id master_tu_id, impl::order_info_per_tu& tuoi )
    {
        test_unit& tu = framework::get( tu_id, TUT_ANY );

        // collect all sibling dependancy from tu own list
        BOOST_TEST_FOREACH( test_unit_id, dep_id, tu.p_dependencies.get() )
            collect_dependant_siblings( tu_id, dep_id, master_tu_id, tuoi );

        if( tu.p_type != TUT_SUITE )
            return;

        test_suite& ts = static_cast<test_suite&>(tu);

        // recursive call to children first
        BOOST_TEST_FOREACH( test_unit_id, chld_id, ts.m_children )
            deduce_siblings_order( chld_id, master_tu_id, tuoi );

        ts.m_ranked_children.clear();
        BOOST_TEST_FOREACH( test_unit_id, chld_id, ts.m_children ) {
            counter_t rank = assign_sibling_rank( chld_id, tuoi );
            ts.m_ranked_children.insert( std::make_pair( rank, chld_id ) );
        }
    }

    //////////////////////////////////////////////////////////////////

    // Finalize default run status:
    //  1) inherit run status from parent where applicable
    //  2) if any of test units in test suite enabled enable it as well
    bool            finalize_default_run_status( test_unit_id tu_id, test_unit::run_status parent_status )
    {
        test_unit& tu = framework::get( tu_id, TUT_ANY );

        if( tu.p_default_status == test_suite::RS_INHERIT )
            tu.p_default_status.value = parent_status;

        // go through list of children
        if( tu.p_type == TUT_SUITE ) {
            bool has_enabled_child = false;
            BOOST_TEST_FOREACH( test_unit_id, chld_id, static_cast<test_suite const&>(tu).m_children )
                has_enabled_child |= finalize_default_run_status( chld_id, tu.p_default_status );

            tu.p_default_status.value = has_enabled_child ? test_suite::RS_ENABLED : test_suite::RS_DISABLED;
        }

        return tu.p_default_status == test_suite::RS_ENABLED;
    }

    //////////////////////////////////////////////////////////////////

    bool            finalize_run_status( test_unit_id tu_id )
    {
        test_unit& tu = framework::get( tu_id, TUT_ANY );

        // go through list of children
        if( tu.p_type == TUT_SUITE ) {
            bool has_enabled_child = false;
            BOOST_TEST_FOREACH( test_unit_id, chld_id, static_cast<test_suite const&>(tu).m_children)
                has_enabled_child |= finalize_run_status( chld_id );

            tu.p_run_status.value = has_enabled_child ? test_suite::RS_ENABLED : test_suite::RS_DISABLED;
        }

        return tu.is_enabled();
    }

    //////////////////////////////////////////////////////////////////

    void            deduce_run_status( test_unit_id master_tu_id )
    {
        using namespace framework::impl;
        test_unit_id_list tu_to_enable;
        test_unit_id_list tu_to_disable;

        // 10. If there are any filters supplied, figure out lists of test units to enable/disable
        bool had_selector_filter = !runtime_config::get<std::vector<std::string> >( runtime_config::RUN_FILTERS ).empty() &&
                                   parse_filters( master_tu_id, tu_to_enable, tu_to_disable );

        // 20. Set the stage: either use default run status or disable all test units
        set_run_status initial_setter( had_selector_filter ? test_unit::RS_DISABLED : test_unit::RS_INVALID );
        traverse_test_tree( master_tu_id, initial_setter, true );

        // 30. Apply all selectors and enablers.
        while( !tu_to_enable.empty() ) {
            test_unit& tu = framework::get( tu_to_enable.back(), TUT_ANY );

            tu_to_enable.pop_back();

            // 35. Ignore test units which already enabled
            if( tu.is_enabled() )
                continue;

            // set new status and add all dependencies into tu_to_enable
            set_run_status enabler( test_unit::RS_ENABLED, &tu_to_enable );
            traverse_test_tree( tu.p_id, enabler, true );
        }

        // 40. Apply all disablers
        while( !tu_to_disable.empty() ) {
            test_unit const& tu = framework::get( tu_to_disable.back(), TUT_ANY );

            tu_to_disable.pop_back();

            // 35. Ignore test units which already disabled
            if( !tu.is_enabled() )
                continue;

            set_run_status disabler( test_unit::RS_DISABLED );
            traverse_test_tree( tu.p_id, disabler, true );
        }

        // 50. Make sure parents of enabled test units are also enabled
        finalize_run_status( master_tu_id );
    }

    //////////////////////////////////////////////////////////////////

    typedef unit_test_monitor_t::error_level execution_result;

    // Random generator using the std::rand function (seeded prior to the call)
    struct random_generator_helper {
      size_t operator()(size_t i) const {
        return std::rand() % i;
      }
    };

      // Executed the test tree with the root at specified test unit
    execution_result execute_test_tree( test_unit_id tu_id,
                                        unsigned timeout = 0,
                                        random_generator_helper const * const p_random_generator = 0)
    {
        test_unit const& tu = framework::get( tu_id, TUT_ANY );

        execution_result result = unit_test_monitor_t::test_ok;

        if( !tu.is_enabled() )
            return result;

        // 10. Check preconditions, including zero time left for execution and
        // successful execution of all dependencies
        if( timeout == TIMEOUT_EXCEEDED ) {
            // notify all observers about skipped test unit
            BOOST_TEST_FOREACH( test_observer*, to, m_observers )
                to->test_unit_skipped( tu, "timeout for the test unit is exceeded" );

            return unit_test_monitor_t::os_timeout;
        }
        else if( timeout == 0 || timeout > tu.p_timeout ) // deduce timeout for this test unit
            timeout = tu.p_timeout;

        test_tools::assertion_result const precondition_res = tu.check_preconditions();
        if( !precondition_res ) {
            // notify all observers about skipped test unit
            BOOST_TEST_FOREACH( test_observer*, to, m_observers )
                to->test_unit_skipped( tu, precondition_res.message() );

            return unit_test_monitor_t::precondition_failure;
        }

        // 20. Notify all observers about the start of the test unit
        BOOST_TEST_FOREACH( test_observer*, to, m_observers )
            to->test_unit_start( tu );

        // 30. Execute setup fixtures if any; any failure here leads to test unit abortion
        BOOST_TEST_FOREACH( test_unit_fixture_ptr, F, tu.p_fixtures.get() ) {
            result = unit_test_monitor.execute_and_translate( boost::bind( &test_unit_fixture::setup, F ) );
            if( result != unit_test_monitor_t::test_ok )
                break;
        }

        // This is the time we are going to spend executing the test unit
        unsigned long elapsed = 0;

        if( result == unit_test_monitor_t::test_ok ) {
            // 40. We are going to time the execution
            boost::timer tu_timer;

            if( tu.p_type == TUT_SUITE ) {
                test_suite const& ts = static_cast<test_suite const&>( tu );

                if( runtime_config::get<unsigned>( runtime_config::RANDOM_SEED ) == 0 ) {
                    typedef std::pair<counter_t,test_unit_id> value_type;

                    BOOST_TEST_FOREACH( value_type, chld, ts.m_ranked_children ) {
                        unsigned chld_timeout = child_timeout( timeout, tu_timer.elapsed() );

                        result = (std::min)( result, execute_test_tree( chld.second, chld_timeout ) );

                        if( unit_test_monitor.is_critical_error( result ) )
                            break;
                    }
                }
                else {
                    // Go through ranges of chldren with the same dependency rank and shuffle them
                    // independently. Execute each subtree in this order
                    test_unit_id_list children_with_the_same_rank;

                    typedef test_suite::children_per_rank::const_iterator it_type;
                    it_type it = ts.m_ranked_children.begin();
                    while( it != ts.m_ranked_children.end() ) {
                        children_with_the_same_rank.clear();

                        std::pair<it_type,it_type> range = ts.m_ranked_children.equal_range( it->first );
                        it = range.first;
                        while( it != range.second ) {
                            children_with_the_same_rank.push_back( it->second );
                            it++;
                        }

                        const random_generator_helper& rand_gen = p_random_generator ? *p_random_generator : random_generator_helper();

                        std::random_shuffle( children_with_the_same_rank.begin(), children_with_the_same_rank.end(), rand_gen );

                        BOOST_TEST_FOREACH( test_unit_id, chld, children_with_the_same_rank ) {
                            unsigned chld_timeout = child_timeout( timeout, tu_timer.elapsed() );

                            result = (std::min)( result, execute_test_tree( chld, chld_timeout, &rand_gen ) );

                            if( unit_test_monitor.is_critical_error( result ) )
                                break;
                        }
                    }
                }

                elapsed = static_cast<unsigned long>( tu_timer.elapsed() * 1e6 );
            }
            else { // TUT_CASE
                test_case const& tc = static_cast<test_case const&>( tu );

                // setup contexts
                m_context_idx = 0;

                // setup current test case
                test_unit_id bkup = m_curr_test_case;
                m_curr_test_case = tc.p_id;

                // execute the test case body
                result = unit_test_monitor.execute_and_translate( tc.p_test_func, timeout );
                elapsed = static_cast<unsigned long>( tu_timer.elapsed() * 1e6 );

                // cleanup leftover context
                m_context.clear();

                // restore state and abort if necessary
                m_curr_test_case = bkup;
            }
        }

        // if run error is critical skip teardown, who knows what the state of the program at this point
        if( !unit_test_monitor.is_critical_error( result ) ) {
            // execute teardown fixtures if any in reverse order
            BOOST_TEST_REVERSE_FOREACH( test_unit_fixture_ptr, F, tu.p_fixtures.get() ) {
                result = (std::min)( result, unit_test_monitor.execute_and_translate( boost::bind( &test_unit_fixture::teardown, F ), 0 ) );

                if( unit_test_monitor.is_critical_error( result ) )
                    break;
            }
        }

        // notify all observers about abortion
        if( unit_test_monitor.is_critical_error( result ) ) {
            BOOST_TEST_FOREACH( test_observer*, to, m_observers )
                to->test_aborted();
        }

        // notify all observers about completion
        BOOST_TEST_REVERSE_FOREACH( test_observer*, to, m_observers )
            to->test_unit_finish( tu, elapsed );

        return result;
    }

    //////////////////////////////////////////////////////////////////

    unsigned child_timeout( unsigned tu_timeout, double elapsed )
    {
      if( tu_timeout == 0U )
          return 0U;

      unsigned elpsed_sec = static_cast<unsigned>(elapsed); // rounding to number of whole seconds

      return tu_timeout > elpsed_sec ? tu_timeout - elpsed_sec : TIMEOUT_EXCEEDED;
    }

    struct priority_order {
        bool operator()( test_observer* lhs, test_observer* rhs ) const
        {
            return (lhs->priority() < rhs->priority()) || ((lhs->priority() == rhs->priority()) && (lhs < rhs));
        }
    };

    // Data members
    typedef std::map<test_unit_id,test_unit*>       test_unit_store;
    typedef std::set<test_observer*,priority_order> observer_store;
    struct context_frame {
        context_frame( std::string const& d, int id, bool sticky )
        : descr( d )
        , frame_id( id )
        , is_sticky( sticky )
        {}

        std::string descr;
        int         frame_id;
        bool        is_sticky;
    };
    typedef std::vector<context_frame> context_data;

    master_test_suite_t* m_master_test_suite;
    std::vector<test_suite*> m_auto_test_suites;

    test_unit_id    m_curr_test_case;
    test_unit_store m_test_units;

    test_unit_id    m_next_test_case_id;
    test_unit_id    m_next_test_suite_id;

    bool            m_test_in_progress;

    observer_store  m_observers;
    context_data    m_context;
    int             m_context_idx;

    boost::execution_monitor m_aux_em;

    std::map<output_format, runtime_config::stream_holder> m_log_sinks;
    runtime_config::stream_holder m_report_sink;
};

//____________________________________________________________________________//

namespace impl {
namespace {

#if defined(__CYGWIN__)
framework::state& s_frk_state() { static framework::state* the_inst = 0; if(!the_inst) the_inst = new framework::state; return *the_inst; }
#else
framework::state& s_frk_state() { static framework::state the_inst; return the_inst; }
#endif

} // local namespace

void
setup_for_execution( test_unit const& tu )
{
    s_frk_state().deduce_run_status( tu.p_id );
}

struct sum_to_first_only {
    sum_to_first_only() : is_first(true) {}
    template <class T, class U>
    T operator()(T const& l_, U const& r_) {
        if(is_first) {
            is_first = false;
            return l_ + r_.first;
        }
        return l_ + ", " + r_.first;
    }

    bool is_first;
};

void
setup_loggers()
{

    BOOST_TEST_I_TRY {

#ifdef BOOST_TEST_SUPPORT_TOKEN_ITERATOR
        bool has_combined_logger = runtime_config::has( runtime_config::COMBINED_LOGGER )
            && !runtime_config::get< std::vector<std::string> >( runtime_config::COMBINED_LOGGER ).empty();
#else
        bool has_combined_logger = false;
#endif

        if( !has_combined_logger ) {
            unit_test_log.set_threshold_level( runtime_config::get<log_level>( runtime_config::LOG_LEVEL ) );
            const output_format format = runtime_config::get<output_format>( runtime_config::LOG_FORMAT );
            unit_test_log.set_format( format );

            runtime_config::stream_holder& stream_logger = s_frk_state().m_log_sinks[format];
            if( runtime_config::has( runtime_config::LOG_SINK ) )
                stream_logger.setup( runtime_config::get<std::string>( runtime_config::LOG_SINK ) );
            unit_test_log.set_stream( stream_logger.ref() );
        }
        else
        {

            const std::vector<std::string>& v_output_format = runtime_config::get< std::vector<std::string> >( runtime_config::COMBINED_LOGGER ) ;

            static const std::pair<const char*, log_level> all_log_levels[] = {
                std::make_pair( "all"           , log_successful_tests ),
                std::make_pair( "success"       , log_successful_tests ),
                std::make_pair( "test_suite"    , log_test_units ),
                std::make_pair( "unit_scope"    , log_test_units ),
                std::make_pair( "message"       , log_messages ),
                std::make_pair( "warning"       , log_warnings ),
                std::make_pair( "error"         , log_all_errors ),
                std::make_pair( "cpp_exception" , log_cpp_exception_errors ),
                std::make_pair( "system_error"  , log_system_errors ),
                std::make_pair( "fatal_error"   , log_fatal_errors ),
                std::make_pair( "nothing"       , log_nothing )
            };

            static const std::pair<const char*, output_format> all_formats[] = {
                std::make_pair( "HRF"  , OF_CLF ),
                std::make_pair( "CLF"  , OF_CLF ),
                std::make_pair( "XML"  , OF_XML ),
                std::make_pair( "JUNIT", OF_JUNIT )
            };


            bool is_first = true;

            BOOST_TEST_FOREACH( const_string, current_multi_config, v_output_format ) {

    #ifdef BOOST_TEST_SUPPORT_TOKEN_ITERATOR

                // ':' may be used for file names: C:/tmp/mylogsink.xml
                // we merge the tokens that start with / or \ with the previous one.
                std::vector<std::string> v_processed_tokens;

                {
                    utils::string_token_iterator current_config( current_multi_config, (utils::dropped_delimeters = ":",
                                                                                        utils::kept_delimeters = utils::dt_none) );

                    for( ; current_config != utils::string_token_iterator() ; ++current_config) {
                        std::string str_copy(current_config->begin(), current_config->end());
                        if( ( str_copy[0] == '\\' || str_copy[0] == '/' )
                            && v_processed_tokens.size() > 0) {
                            v_processed_tokens.back() += ":" + str_copy; // ':' has been eaten up
                        }
                        else {
                            v_processed_tokens.push_back(str_copy);
                        }
                    }
                }

                BOOST_TEST_FOREACH( std::string const&, current_config, v_processed_tokens ) {

                    utils::string_token_iterator current_format_specs( current_config, (utils::keep_empty_tokens,
                                                                                        utils::dropped_delimeters = ",",
                                                                                        utils::kept_delimeters = utils::dt_none) );

                    output_format format = OF_INVALID ; // default
                    if( current_format_specs != utils::string_token_iterator() &&
                        current_format_specs->size() ) {

                        for(size_t elem=0; elem < sizeof(all_formats)/sizeof(all_formats[0]); elem++) {
                            if(const_string(all_formats[elem].first) == *current_format_specs) {
                                format = all_formats[elem].second;
                                break;
                            }
                        }
                    }

                    BOOST_TEST_I_ASSRT( format != OF_INVALID,
                                        boost::runtime::access_to_missing_argument()
                                            << "Unable to determine the logger type from '"
                                            << current_config
                                            << "'. Possible choices are: "
                                            << std::accumulate(all_formats,
                                                               all_formats + sizeof(all_formats)/sizeof(all_formats[0]),
                                                               std::string(""),
                                                               sum_to_first_only())
                                      );

                    // activates this format
                    if( is_first ) {
                        unit_test_log.set_format( format );
                    }
                    else {
                        unit_test_log.add_format( format );
                    }
                    is_first = false;

                    unit_test_log_formatter * const formatter = unit_test_log.get_formatter(format);
                    BOOST_TEST_SETUP_ASSERT( formatter, "Logger setup error" );

                    log_level formatter_log_level = invalid_log_level;
                    ++current_format_specs ;
                    if( !current_format_specs->size() ) {
                        formatter_log_level = formatter->get_log_level(); // default log level given by the formatter
                    }
                    else if( current_format_specs != utils::string_token_iterator() ) {

                        for(size_t elem=0; elem < sizeof(all_log_levels)/sizeof(all_log_levels[0]); elem++) {
                            if(const_string(all_log_levels[elem].first) == *current_format_specs) {
                                formatter_log_level = all_log_levels[elem].second;
                                break;
                            }
                        }
                    }


                    BOOST_TEST_I_ASSRT( formatter_log_level != invalid_log_level,
                                        boost::runtime::access_to_missing_argument()
                                            << "Unable to determine the log level from '"
                                            << current_config
                                            << "'. Possible choices are: "
                                            << std::accumulate(all_log_levels,
                                                               all_log_levels + sizeof(all_log_levels)/sizeof(all_log_levels[0]),
                                                               std::string(""),
                                                               sum_to_first_only())
                                       );

                    unit_test_log.set_threshold_level( format, formatter_log_level );

                    runtime_config::stream_holder& stream_logger = s_frk_state().m_log_sinks[format];
                    if( ++current_format_specs != utils::string_token_iterator() &&
                        current_format_specs->size() ) {
                        stream_logger.setup( *current_format_specs );
                    }
                    else {
                        stream_logger.setup( formatter->get_default_stream_description() );
                    }
                    unit_test_log.set_stream( format, stream_logger.ref() );
                }
    #endif
            } // for each logger

        } // if/else new logger API
    } // BOOST_TEST_I_TRY
    BOOST_TEST_I_CATCH( boost::runtime::init_error, ex ) {
        BOOST_TEST_SETUP_ASSERT( false, ex.msg );
    }
    BOOST_TEST_I_CATCH( boost::runtime::input_error, ex ) {
        std::cerr << ex.msg << "\n\n";

        BOOST_TEST_I_THROW( framework::nothing_to_test( boost::exit_exception_failure ) );
    }


}

//____________________________________________________________________________//

} // namespace impl

//____________________________________________________________________________//

// ************************************************************************** //
// **************                framework::init               ************** //
// ************************************************************************** //

void
init( init_unit_test_func init_func, int argc, char* argv[] )
{
    using namespace impl;

    // 10. Set up runtime parameters
    runtime_config::init( argc, argv );

    // 20. Set the desired log level, format and sink
    impl::setup_loggers();

    // 30. Set the desired report level, format and sink
    results_reporter::set_level( runtime_config::get<report_level>( runtime_config::REPORT_LEVEL ) );
    results_reporter::set_format( runtime_config::get<output_format>( runtime_config::REPORT_FORMAT ) );

    if( runtime_config::has( runtime_config::REPORT_SINK ) )
        s_frk_state().m_report_sink.setup( runtime_config::get<std::string>( runtime_config::REPORT_SINK ) );
    results_reporter::set_stream( s_frk_state().m_report_sink.ref() );

    // 40. Register default test observers
    register_observer( results_collector );
    register_observer( unit_test_log );

    if( runtime_config::get<bool>( runtime_config::SHOW_PROGRESS ) ) {
        progress_monitor.set_stream( std::cout ); // defaults to stdout
        register_observer( progress_monitor );
    }

    // 50. Set up memory leak detection
    unsigned long detect_mem_leak = runtime_config::get<unsigned long>( runtime_config::DETECT_MEM_LEAKS );
    if( detect_mem_leak > 0 ) {
        debug::detect_memory_leaks( true, runtime_config::get<std::string>( runtime_config::REPORT_MEM_LEAKS ) );
        debug::break_memory_alloc( (long)detect_mem_leak );
    }

    // 60. Initialize master unit test suite
    master_test_suite().argc = argc;
    master_test_suite().argv = argv;

    // 70. Invoke test module initialization routine
    BOOST_TEST_I_TRY {
        s_frk_state().m_aux_em.vexecute( boost::bind( &impl::invoke_init_func, init_func ) );
    }
    BOOST_TEST_I_CATCH( execution_exception, ex )  {
        BOOST_TEST_SETUP_ASSERT( false, ex.what() );
    }
}

//____________________________________________________________________________//

void
finalize_setup_phase( test_unit_id master_tu_id )
{
    if( master_tu_id == INV_TEST_UNIT_ID )
        master_tu_id = master_test_suite().p_id;

    // 10. Apply all decorators to the auto test units
    class apply_decorators : public test_tree_visitor {
    private:
        // test_tree_visitor interface
        virtual bool    visit( test_unit const& tu )
        {
            BOOST_TEST_FOREACH( decorator::base_ptr, d, tu.p_decorators.get() )
                d->apply( const_cast<test_unit&>(tu) );

            return true;
        }
    } ad;
    traverse_test_tree( master_tu_id, ad, true );

    // 20. Finalize setup phase
    impl::order_info_per_tu tuoi;
    impl::s_frk_state().deduce_siblings_order( master_tu_id, master_tu_id, tuoi );
    impl::s_frk_state().finalize_default_run_status( master_tu_id, test_unit::RS_INVALID );
}

// ************************************************************************** //
// **************               test_in_progress               ************** //
// ************************************************************************** //

bool
test_in_progress()
{
    return impl::s_frk_state().m_test_in_progress;
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************             framework::shutdown              ************** //
// ************************************************************************** //

void
shutdown()
{
    // eliminating some fake memory leak reports. See for more details:
    // http://connect.microsoft.com/VisualStudio/feedback/details/106937/memory-leaks-reported-by-debug-crt-inside-typeinfo-name

#  if BOOST_WORKAROUND(BOOST_MSVC,  <= 1600 ) && !defined(_DLL) && defined(_DEBUG)
#  if BOOST_WORKAROUND(BOOST_MSVC,  < 1600 )
#define _Next next
#define _MemPtr memPtr
#endif
   __type_info_node* pNode   = __type_info_root_node._Next;
   __type_info_node* tmpNode = &__type_info_root_node;

   for( ; pNode!=NULL; pNode = tmpNode ) {
      tmpNode = pNode->_Next;
      delete pNode->_MemPtr;
      delete pNode;
   }
#  if BOOST_WORKAROUND(BOOST_MSVC,  < 1600 )
#undef _Next
#undef _MemPtr
#endif
#  endif
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************              register_test_unit              ************** //
// ************************************************************************** //

void
register_test_unit( test_case* tc )
{
    BOOST_TEST_SETUP_ASSERT( tc->p_id == INV_TEST_UNIT_ID, BOOST_TEST_L( "test case already registered" ) );

    test_unit_id new_id = impl::s_frk_state().m_next_test_case_id;

    BOOST_TEST_SETUP_ASSERT( new_id != MAX_TEST_CASE_ID, BOOST_TEST_L( "too many test cases" ) );

    typedef state::test_unit_store::value_type map_value_type;

    impl::s_frk_state().m_test_units.insert( map_value_type( new_id, tc ) );
    impl::s_frk_state().m_next_test_case_id++;

    impl::s_frk_state().set_tu_id( *tc, new_id );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************              register_test_unit              ************** //
// ************************************************************************** //

void
register_test_unit( test_suite* ts )
{
    BOOST_TEST_SETUP_ASSERT( ts->p_id == INV_TEST_UNIT_ID, BOOST_TEST_L( "test suite already registered" ) );

    test_unit_id new_id = impl::s_frk_state().m_next_test_suite_id;

    BOOST_TEST_SETUP_ASSERT( new_id != MAX_TEST_SUITE_ID, BOOST_TEST_L( "too many test suites" ) );

    typedef state::test_unit_store::value_type map_value_type;

    impl::s_frk_state().m_test_units.insert( map_value_type( new_id, ts ) );
    impl::s_frk_state().m_next_test_suite_id++;

    impl::s_frk_state().set_tu_id( *ts, new_id );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************             deregister_test_unit             ************** //
// ************************************************************************** //

void
deregister_test_unit( test_unit* tu )
{
    impl::s_frk_state().m_test_units.erase( tu->p_id );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************                     clear                    ************** //
// ************************************************************************** //

void
clear()
{
    impl::s_frk_state().clear();
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************               register_observer              ************** //
// ************************************************************************** //

void
register_observer( test_observer& to )
{
    impl::s_frk_state().m_observers.insert( &to );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************              deregister_observer             ************** //
// ************************************************************************** //

void
deregister_observer( test_observer& to )
{
    impl::s_frk_state().m_observers.erase( &to );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************                  add_context                 ************** //
// ************************************************************************** //

int
add_context( ::boost::unit_test::lazy_ostream const& context_descr, bool sticky )
{
    std::stringstream buffer;
    context_descr( buffer );
    int res_idx  = impl::s_frk_state().m_context_idx++;

    impl::s_frk_state().m_context.push_back( state::context_frame( buffer.str(), res_idx, sticky ) );

    return res_idx;
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************                 clear_context                ************** //
// ************************************************************************** //

struct frame_with_id {
    explicit frame_with_id( int id ) : m_id( id ) {}

    bool    operator()( state::context_frame const& f )
    {
        return f.frame_id == m_id;
    }
    int     m_id;
};

//____________________________________________________________________________//

void
clear_context( int frame_id )
{
    if( frame_id == -1 ) {   // clear all non sticky frames
        for( int i=static_cast<int>(impl::s_frk_state().m_context.size())-1; i>=0; i-- )
            if( !impl::s_frk_state().m_context[i].is_sticky )
                impl::s_frk_state().m_context.erase( impl::s_frk_state().m_context.begin()+i );
    }

    else { // clear specific frame
        state::context_data::iterator it =
            std::find_if( impl::s_frk_state().m_context.begin(), impl::s_frk_state().m_context.end(), frame_with_id( frame_id ) );

        if( it != impl::s_frk_state().m_context.end() ) // really an internal error if this is not true
            impl::s_frk_state().m_context.erase( it );
    }
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************                  get_context                 ************** //
// ************************************************************************** //

context_generator
get_context()
{
    return context_generator();
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************               context_generator              ************** //
// ************************************************************************** //

bool
context_generator::is_empty() const
{
    return impl::s_frk_state().m_context.empty();
}

//____________________________________________________________________________//

const_string
context_generator::next() const
{
    return m_curr_frame < impl::s_frk_state().m_context.size() ? impl::s_frk_state().m_context[m_curr_frame++].descr : const_string();
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************               master_test_suite              ************** //
// ************************************************************************** //

master_test_suite_t&
master_test_suite()
{
    if( !impl::s_frk_state().m_master_test_suite )
        impl::s_frk_state().m_master_test_suite = new master_test_suite_t;

    return *impl::s_frk_state().m_master_test_suite;
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************            current_auto_test_suite           ************** //
// ************************************************************************** //

test_suite&
current_auto_test_suite( test_suite* ts, bool push_or_pop )
{
    if( impl::s_frk_state().m_auto_test_suites.empty() )
        impl::s_frk_state().m_auto_test_suites.push_back( &framework::master_test_suite() );

    if( !push_or_pop )
        impl::s_frk_state().m_auto_test_suites.pop_back();
    else if( ts )
        impl::s_frk_state().m_auto_test_suites.push_back( ts );

    return *impl::s_frk_state().m_auto_test_suites.back();
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************               current_test_case              ************** //
// ************************************************************************** //

test_case const&
current_test_case()
{
    return get<test_case>( impl::s_frk_state().m_curr_test_case );
}

//____________________________________________________________________________//

test_unit_id
current_test_case_id()
{
    return impl::s_frk_state().m_curr_test_case;
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************                framework::get                ************** //
// ************************************************************************** //

test_unit&
get( test_unit_id id, test_unit_type t )
{
    test_unit* res = impl::s_frk_state().m_test_units[id];

    BOOST_TEST_I_ASSRT( (res->p_type & t) != 0, internal_error( "Invalid test unit type" ) );

    return *res;
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************                framework::run                ************** //
// ************************************************************************** //

void
run( test_unit_id id, bool continue_test )
{
    if( id == INV_TEST_UNIT_ID )
        id = master_test_suite().p_id;

    // Figure out run status for execution phase
    impl::s_frk_state().deduce_run_status( id );

    test_case_counter tcc;
    traverse_test_tree( id, tcc );

    BOOST_TEST_SETUP_ASSERT( tcc.p_count != 0 , runtime_config::get<std::vector<std::string> >( runtime_config::RUN_FILTERS ).empty()
        ? BOOST_TEST_L( "test tree is empty" )
        : BOOST_TEST_L( "no test cases matching filter or all test cases were disabled" ) );

    bool    was_in_progress     = framework::test_in_progress();
    bool    call_start_finish   = !continue_test || !was_in_progress;

    impl::s_frk_state().m_test_in_progress = true;

    if( call_start_finish ) {
        BOOST_TEST_FOREACH( test_observer*, to, impl::s_frk_state().m_observers ) {
            BOOST_TEST_I_TRY {
                impl::s_frk_state().m_aux_em.vexecute( boost::bind( &test_observer::test_start, to, tcc.p_count ) );
            }
            BOOST_TEST_I_CATCH( execution_exception, ex ) {
                BOOST_TEST_SETUP_ASSERT( false, ex.what() );
            }
        }
    }

    unsigned seed = runtime_config::get<unsigned>( runtime_config::RANDOM_SEED );
    switch( seed ) {
    case 0:
        break;
    case 1:
        seed = static_cast<unsigned>( std::rand() ^ std::time( 0 ) ); // better init using std::rand() ^ ...
    default:
        BOOST_TEST_FRAMEWORK_MESSAGE( "Test cases order is shuffled using seed: " << seed );
        std::srand( seed );
    }

    impl::s_frk_state().execute_test_tree( id );

    if( call_start_finish ) {
        BOOST_TEST_REVERSE_FOREACH( test_observer*, to, impl::s_frk_state().m_observers )
            to->test_finish();
    }

    impl::s_frk_state().m_test_in_progress = was_in_progress;
}

//____________________________________________________________________________//

void
run( test_unit const* tu, bool continue_test )
{
    run( tu->p_id, continue_test );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************               assertion_result               ************** //
// ************************************************************************** //

void
assertion_result( unit_test::assertion_result ar )
{
    BOOST_TEST_FOREACH( test_observer*, to, impl::s_frk_state().m_observers )
        to->assertion_result( ar );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************               exception_caught               ************** //
// ************************************************************************** //

void
exception_caught( execution_exception const& ex )
{
    BOOST_TEST_FOREACH( test_observer*, to, impl::s_frk_state().m_observers )
        to->exception_caught( ex );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************               test_unit_aborted              ************** //
// ************************************************************************** //

void
test_unit_aborted( test_unit const& tu )
{
    BOOST_TEST_FOREACH( test_observer*, to, impl::s_frk_state().m_observers )
        to->test_unit_aborted( tu );
}

//____________________________________________________________________________//

} // namespace framework
} // namespace unit_test
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_FRAMEWORK_IPP_021005GER

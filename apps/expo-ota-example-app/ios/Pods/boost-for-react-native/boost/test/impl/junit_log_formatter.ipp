//  (C) Copyright 2016 Raffi Enficiaud.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
///@file
///@brief Contains the implementatoin of the Junit log formatter (OF_JUNIT)
// ***************************************************************************

#ifndef BOOST_TEST_JUNIT_LOG_FORMATTER_IPP__
#define BOOST_TEST_JUNIT_LOG_FORMATTER_IPP__

// Boost.Test
#include <boost/test/output/junit_log_formatter.hpp>
#include <boost/test/execution_monitor.hpp>
#include <boost/test/framework.hpp>
#include <boost/test/tree/test_unit.hpp>
#include <boost/test/utils/basic_cstring/io.hpp>
#include <boost/test/utils/xml_printer.hpp>
#include <boost/test/utils/string_cast.hpp>
#include <boost/test/framework.hpp>

#include <boost/test/tree/visitor.hpp>
#include <boost/test/tree/test_case_counter.hpp>
#include <boost/test/tree/traverse.hpp>
#include <boost/test/results_collector.hpp>

#include <boost/test/utils/algorithm.hpp>
#include <boost/test/utils/string_cast.hpp>

//#include <boost/test/results_reporter.hpp>


// Boost
#include <boost/version.hpp>

// STL
#include <iostream>
#include <fstream>
#include <set>

#include <boost/test/detail/suppress_warnings.hpp>


//____________________________________________________________________________//

namespace boost {
namespace unit_test {
namespace output {


struct s_replace_chars {
  template <class T>
  void operator()(T& to_replace)
  {
    if(to_replace == '/')
      to_replace = '.';
    else if(to_replace == ' ')
      to_replace = '_';
  }
};

inline std::string tu_name_normalize(std::string full_name)
{
  // maybe directly using normalize_test_case_name instead?
  std::for_each(full_name.begin(), full_name.end(), s_replace_chars());
  return full_name;
}

const_string file_basename(const_string filename) {

    const_string path_sep( "\\/" );
    const_string::iterator it = unit_test::utils::find_last_of( filename.begin(), filename.end(),
                                                                path_sep.begin(), path_sep.end() );
    if( it != filename.end() )
        filename.trim_left( it + 1 );

    return filename;

}

// ************************************************************************** //
// **************               junit_log_formatter              ************** //
// ************************************************************************** //

void
junit_log_formatter::log_start( std::ostream& ostr, counter_t test_cases_amount)
{
    map_tests.clear();
    list_path_to_root.clear();
    root_id = INV_TEST_UNIT_ID;
}

//____________________________________________________________________________//

class junit_result_helper : public test_tree_visitor {
public:
    explicit junit_result_helper(
        std::ostream& stream,
        test_unit const& ts,
        junit_log_formatter::map_trace_t const& mt,
        bool display_build_info )
    : m_stream(stream)
    , m_ts( ts )
    , m_map_test( mt )
    , m_id( 0 )
    , m_display_build_info(display_build_info)
    { }

    void add_log_entry(std::string const& entry_type,
                       test_case const& tc,
                       junit_impl::junit_log_helper::assertion_entry const& log) const
    {
        m_stream
            << "<" << entry_type
            << " message" << utils::attr_value() << log.logentry_message
            << " type" << utils::attr_value() << log.logentry_type
            << ">";

        if(!log.output.empty()) {
            m_stream << utils::cdata() << "\n" + log.output;
        }

        m_stream << "</" << entry_type << ">";
    }

    void    visit( test_case const& tc )
    {
        test_results const& tr = results_collector.results( tc.p_id );

        junit_impl::junit_log_helper detailed_log;
        bool need_skipping_reason = false;
        bool skipped = false;

        junit_log_formatter::map_trace_t::const_iterator it_element(m_map_test.find(tc.p_id));
        if( it_element != m_map_test.end() )
        {
            detailed_log = it_element->second;
        }
        else
        {
            need_skipping_reason = true;
        }

        std::string classname;
        test_unit_id id(tc.p_parent_id);
        while( id != m_ts.p_id ) {
            test_unit const& tu = boost::unit_test::framework::get( id, TUT_ANY );

            if(need_skipping_reason)
            {
                test_results const& tr_parent = results_collector.results( id );
                if( tr_parent.p_skipped )
                {
                    skipped = true;
                    detailed_log.system_out+= "- disabled: " + tu.full_name() + "\n";
                }
                junit_log_formatter::map_trace_t::const_iterator it_element_stack(m_map_test.find(id));
                if( it_element_stack != m_map_test.end() )
                {
                    detailed_log.system_out+= "- skipping decision: '" + it_element_stack->second.system_out + "'";
                    detailed_log.system_out = "SKIPPING decision stack:\n" + detailed_log.system_out;
                    need_skipping_reason = false;
                }
            }

            classname = tu_name_normalize(tu.p_name) + "." + classname;
            id = tu.p_parent_id;
        }

        // removes the trailing dot
        if(!classname.empty() && *classname.rbegin() == '.') {
            classname.erase(classname.size()-1);
        }

        //
        // test case header

        // total number of assertions
        m_stream << "<testcase assertions" << utils::attr_value() << tr.p_assertions_passed + tr.p_assertions_failed;

        // class name
        if(!classname.empty())
            m_stream << " classname" << utils::attr_value() << classname;

        // test case name and time taken
        m_stream
            << " name"      << utils::attr_value() << tu_name_normalize(tc.p_name)
            << " time"      << utils::attr_value() << double(tr.p_duration_microseconds) * 1E-6
            << ">" << std::endl;

        if( tr.p_skipped || skipped ) {
            m_stream << "<skipped/>" << std::endl;
        }
        else {

          for(std::vector< junit_impl::junit_log_helper::assertion_entry >::const_iterator it(detailed_log.assertion_entries.begin());
              it != detailed_log.assertion_entries.end();
              ++it)
          {
              if(it->log_entry == junit_impl::junit_log_helper::assertion_entry::log_entry_failure) {
                  add_log_entry("failure", tc, *it);
              }
              else if(it->log_entry == junit_impl::junit_log_helper::assertion_entry::log_entry_error) {
                  add_log_entry("error", tc, *it);
              }
          }
        }

        // system-out + all info/messages
        std::string system_out = detailed_log.system_out;
        for(std::vector< junit_impl::junit_log_helper::assertion_entry >::const_iterator it(detailed_log.assertion_entries.begin());
            it != detailed_log.assertion_entries.end();
            ++it)
        {
            if(it->log_entry != junit_impl::junit_log_helper::assertion_entry::log_entry_info)
                continue;
            system_out += it->output;
        }

        if(!system_out.empty()) {
            m_stream
                << "<system-out>"
                << utils::cdata() << system_out
                << "</system-out>"
                << std::endl;
        }

        // system-err output + test case informations
        std::string system_err = detailed_log.system_err;
        {
            // test case information (redundant but useful)
            std::ostringstream o;
            o   << "Test case:" << std::endl
                << "- name: " << tc.full_name() << std::endl
                << "- description: '" << tc.p_description << "'" << std::endl
                << "- file: " << file_basename(tc.p_file_name) << std::endl
                << "- line: " << tc.p_line_num << std::endl
                ;
            system_err = o.str() + system_err;
        }
        m_stream
            << "<system-err>"
            << utils::cdata() << system_err
            << "</system-err>"
            << std::endl;

        m_stream << "</testcase>" << std::endl;
    }

    bool    test_suite_start( test_suite const& ts )
    {
        // unique test suite, without s, nesting not supported in CI
        if( m_ts.p_id != ts.p_id )
            return true;

        test_results const& tr = results_collector.results( ts.p_id );

        m_stream << "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" << std::endl;
        m_stream << "<testsuite";

        m_stream
          // << "disabled=\"" << tr.p_test_cases_skipped << "\" "
          << " tests"     << utils::attr_value() << tr.p_test_cases_passed
          << " skipped"   << utils::attr_value() << tr.p_test_cases_skipped
          << " errors"    << utils::attr_value() << tr.p_test_cases_aborted
          << " failures"  << utils::attr_value() << tr.p_test_cases_failed
          << " id"        << utils::attr_value() << m_id++
          << " name"      << utils::attr_value() << tu_name_normalize(ts.p_name)
          << " time"      << utils::attr_value() << (tr.p_duration_microseconds * 1E-6)
          << ">" << std::endl;

        if(m_display_build_info)
        {
            m_stream  << "<properties>" << std::endl;
            m_stream  << "<property name=\"platform\" value" << utils::attr_value() << BOOST_PLATFORM << std::endl;
            m_stream  << "<property name=\"compiler\" value" << utils::attr_value() << BOOST_COMPILER << std::endl;
            m_stream  << "<property name=\"stl\" value" << utils::attr_value() << BOOST_STDLIB << std::endl;

            std::ostringstream o;
            o << BOOST_VERSION/100000 << "." << BOOST_VERSION/100 % 1000 << "." << BOOST_VERSION % 100;
            m_stream  << "<property name=\"boost\" value" << utils::attr_value() << o.str() << std::endl;
            m_stream  << "</properties>" << std::endl;
        }

        return true; // indicates that the children should also be parsed
    }

    virtual void    test_suite_finish( test_suite const& ts )
    {
        if( m_ts.p_id != ts.p_id )
            return;
        m_stream << "</testsuite>";
    }

private:
    // Data members
    std::ostream& m_stream;
    test_unit const& m_ts;
    junit_log_formatter::map_trace_t const& m_map_test;
    size_t m_id;
    bool m_display_build_info;
};



void
junit_log_formatter::log_finish( std::ostream& ostr )
{
    junit_result_helper ch( ostr, boost::unit_test::framework::get( root_id, TUT_SUITE ), map_tests, m_display_build_info );
    traverse_test_tree( root_id, ch, true ); // last is to ignore disabled suite special handling

    return;
}

//____________________________________________________________________________//

void
junit_log_formatter::log_build_info( std::ostream& ostr )
{
    m_display_build_info = true;
}

//____________________________________________________________________________//

void
junit_log_formatter::test_unit_start( std::ostream& ostr, test_unit const& tu )
{
    if(list_path_to_root.empty())
        root_id = tu.p_id;
    list_path_to_root.push_back( tu.p_id );
    map_tests.insert(std::make_pair(tu.p_id, junit_impl::junit_log_helper())); // current_test_case_id not working here
}



//____________________________________________________________________________//

void
junit_log_formatter::test_unit_finish( std::ostream& ostr, test_unit const& tu, unsigned long elapsed )
{
    // the time is already stored in the result_reporter
    assert( tu.p_id == list_path_to_root.back() );
    list_path_to_root.pop_back();
}

void
junit_log_formatter::test_unit_aborted( std::ostream& os, test_unit const& tu )
{
    assert( tu.p_id == list_path_to_root.back() );
    //list_path_to_root.pop_back();
}

//____________________________________________________________________________//

void
junit_log_formatter::test_unit_skipped( std::ostream& ostr, test_unit const& tu, const_string reason )
{
    if(tu.p_type == TUT_CASE)
    {
        junit_impl::junit_log_helper& v = map_tests[tu.p_id];
        v.system_out.assign(reason.begin(), reason.end());
    }
    else
    {
        junit_impl::junit_log_helper& v = map_tests[tu.p_id];
        v.system_out.assign(reason.begin(), reason.end());
    }
}

//____________________________________________________________________________//

void
junit_log_formatter::log_exception_start( std::ostream& ostr, log_checkpoint_data const& checkpoint_data, execution_exception const& ex )
{
    std::ostringstream o;
    execution_exception::location const& loc = ex.where();

    m_is_last_assertion_or_error = false;

    if(!list_path_to_root.empty())
    {
        junit_impl::junit_log_helper& last_entry = map_tests[list_path_to_root.back()];

        junit_impl::junit_log_helper::assertion_entry entry;

        entry.logentry_message = "unexpected exception";
        entry.log_entry = junit_impl::junit_log_helper::assertion_entry::log_entry_error;

        switch(ex.code())
        {
        case execution_exception::cpp_exception_error:
            entry.logentry_type = "uncaught exception";
            break;
        case execution_exception::timeout_error:
            entry.logentry_type = "execution timeout";
            break;
        case execution_exception::user_error:
            entry.logentry_type = "user, assert() or CRT error";
            break;
        case execution_exception::user_fatal_error:
            // Looks like never used
            entry.logentry_type = "user fatal error";
            break;
        case execution_exception::system_error:
            entry.logentry_type = "system error";
            break;
        case execution_exception::system_fatal_error:
            entry.logentry_type = "system fatal error";
            break;
        default:
            entry.logentry_type = "no error"; // not sure how to handle this one
            break;
        }

        o << "UNCAUGHT EXCEPTION:" << std::endl;
        if( !loc.m_function.is_empty() )
            o << "- function: \""   << loc.m_function << "\"" << std::endl;

        o << "- file: " << file_basename(loc.m_file_name) << std::endl
          << "- line: " << loc.m_line_num << std::endl
          << std::endl;

        o << "\nEXCEPTION STACK TRACE: --------------\n" << ex.what()
          << "\n-------------------------------------";

        if( !checkpoint_data.m_file_name.is_empty() ) {
            o << std::endl << std::endl
              << "Last checkpoint:" << std::endl
              << "- message: \"" << checkpoint_data.m_message << "\"" << std::endl
              << "- file: " << file_basename(checkpoint_data.m_file_name) << std::endl
              << "- line: " << checkpoint_data.m_line_num << std::endl
            ;
        }

        entry.output = o.str();

        last_entry.assertion_entries.push_back(entry);
    }

    // check what to do with this one
}

//____________________________________________________________________________//

void
junit_log_formatter::log_exception_finish( std::ostream& ostr )
{
    // sealing the last entry
    assert(!map_tests[list_path_to_root.back()].assertion_entries.back().sealed);
    map_tests[list_path_to_root.back()].assertion_entries.back().sealed = true;
}

//____________________________________________________________________________//

void
junit_log_formatter::log_entry_start( std::ostream& ostr, log_entry_data const& entry_data, log_entry_types let )
{
    junit_impl::junit_log_helper& last_entry = map_tests[list_path_to_root.back()];
    m_is_last_assertion_or_error = true;
    switch(let)
    {
      case unit_test_log_formatter::BOOST_UTL_ET_INFO:
      case unit_test_log_formatter::BOOST_UTL_ET_MESSAGE:
      case unit_test_log_formatter::BOOST_UTL_ET_WARNING:
      {
        std::ostringstream o;

        junit_impl::junit_log_helper::assertion_entry entry;
        entry.log_entry = junit_impl::junit_log_helper::assertion_entry::log_entry_info;
        entry.logentry_message = "info";
        entry.logentry_type = "message";

        o << (let == unit_test_log_formatter::BOOST_UTL_ET_WARNING ?
              "WARNING:" : (let == unit_test_log_formatter::BOOST_UTL_ET_MESSAGE ?
                            "MESSAGE:" : "INFO:"))
             << std::endl
          << "- file   : " << file_basename(entry_data.m_file_name) << std::endl
          << "- line   : " << entry_data.m_line_num << std::endl
          << "- message: "; // no CR

        entry.output += o.str();
        last_entry.assertion_entries.push_back(entry);
        break;
      }
      default:
      case unit_test_log_formatter::BOOST_UTL_ET_ERROR:
      case unit_test_log_formatter::BOOST_UTL_ET_FATAL_ERROR:
      {
        std::ostringstream o;
        junit_impl::junit_log_helper::assertion_entry entry;
        entry.log_entry = junit_impl::junit_log_helper::assertion_entry::log_entry_failure;
        entry.logentry_message = "failure";
        entry.logentry_type = (let == unit_test_log_formatter::BOOST_UTL_ET_ERROR ? "assertion error" : "fatal error");

        o << "ASSERTION FAILURE:" << std::endl
          << "- file   : " << file_basename(entry_data.m_file_name) << std::endl
          << "- line   : " << entry_data.m_line_num << std::endl
          << "- message: " ; // no CR

        entry.output += o.str();
        last_entry.assertion_entries.push_back(entry);
        break;
      }
    }

}

      //____________________________________________________________________________//



//____________________________________________________________________________//

void
junit_log_formatter::log_entry_value( std::ostream& ostr, const_string value )
{
    assert(map_tests[list_path_to_root.back()].assertion_entries.empty() || !map_tests[list_path_to_root.back()].assertion_entries.back().sealed);
    junit_impl::junit_log_helper& last_entry = map_tests[list_path_to_root.back()];
    std::ostringstream o;
    utils::print_escaped_cdata( o, value );

    if(!last_entry.assertion_entries.empty())
    {
        junit_impl::junit_log_helper::assertion_entry& log_entry = last_entry.assertion_entries.back();
        log_entry.output += value;
    }
    else
    {
        // this may be a message coming from another observer
        // the prefix is set in the log_entry_start
        last_entry.system_out += value;
    }
}

//____________________________________________________________________________//

void
junit_log_formatter::log_entry_finish( std::ostream& ostr )
{
    assert(map_tests[list_path_to_root.back()].assertion_entries.empty() || !map_tests[list_path_to_root.back()].assertion_entries.back().sealed);
    junit_impl::junit_log_helper& last_entry = map_tests[list_path_to_root.back()];
    if(!last_entry.assertion_entries.empty()) {
        junit_impl::junit_log_helper::assertion_entry& log_entry = last_entry.assertion_entries.back();
        log_entry.output += "\n\n"; // quote end, CR
        log_entry.sealed = true;
    }
    else {
        last_entry.system_out += "\n\n"; // quote end, CR
    }
}

//____________________________________________________________________________//

void
junit_log_formatter::entry_context_start( std::ostream& ostr, log_level )
{
    std::vector< junit_impl::junit_log_helper::assertion_entry > &v_failure_or_error = map_tests[list_path_to_root.back()].assertion_entries;
    assert(!v_failure_or_error.back().sealed);

    if(m_is_last_assertion_or_error)
    {
        v_failure_or_error.back().output += "\n- context:\n";
    }
    else
    {
        v_failure_or_error.back().output += "\n\nCONTEXT:\n";
    }
}

//____________________________________________________________________________//

void
junit_log_formatter::entry_context_finish( std::ostream& ostr )
{
    // no op, may be removed
    assert(!map_tests[list_path_to_root.back()].assertion_entries.back().sealed);
}

//____________________________________________________________________________//

void
junit_log_formatter::log_entry_context( std::ostream& ostr, const_string context_descr )
{
    assert(!map_tests[list_path_to_root.back()].assertion_entries.back().sealed);
    map_tests[list_path_to_root.back()].assertion_entries.back().output += (m_is_last_assertion_or_error ? "  - '": "- '") + std::string(context_descr.begin(), context_descr.end()) + "'\n"; // quote end
}

//____________________________________________________________________________//


std::string
junit_log_formatter::get_default_stream_description() const {
    std::string name = framework::master_test_suite().p_name.value;

    static const std::string to_replace[] =  { " ", "\"", "/", "\\", ":"};
    static const std::string replacement[] = { "_", "_" , "_", "_" , "_"};

    name = unit_test::utils::replace_all_occurrences_of(
        name,
        to_replace, to_replace + sizeof(to_replace)/sizeof(to_replace[0]),
        replacement, replacement + sizeof(replacement)/sizeof(replacement[0]));

    std::ifstream check_init((name + ".xml").c_str());
    if(!check_init)
        return name + ".xml";

    int index = 0;
    for(; index < 100; index++) {
      std::string candidate = name + "_" + utils::string_cast(index) + ".xml";
      std::ifstream file(candidate.c_str());
      if(!file)
          return candidate;
    }

    return name + ".xml";
}

} // namespace output
} // namespace unit_test
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_junit_log_formatter_IPP_020105GER

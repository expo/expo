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
//  Description : simple implementation for Unit Test Framework parameter
//  handling routines. May be rewritten in future to use some kind of
//  command-line arguments parsing facility and environment variable handling
//  facility
// ***************************************************************************

#ifndef BOOST_TEST_UNIT_TEST_PARAMETERS_IPP_012205GER
#define BOOST_TEST_UNIT_TEST_PARAMETERS_IPP_012205GER

// Boost.Test
#include <boost/test/unit_test_parameters.hpp>

#include <boost/test/utils/basic_cstring/basic_cstring.hpp>
#include <boost/test/utils/basic_cstring/compare.hpp>
#include <boost/test/utils/basic_cstring/io.hpp>
#include <boost/test/utils/iterator/token_iterator.hpp>

#include <boost/test/debug.hpp>
#include <boost/test/framework.hpp>

#include <boost/test/detail/log_level.hpp>
#include <boost/test/detail/throw_exception.hpp>

// Boost.Runtime.Param
#include <boost/test/utils/runtime/parameter.hpp>
#include <boost/test/utils/runtime/argument.hpp>
#include <boost/test/utils/runtime/finalize.hpp>
#include <boost/test/utils/runtime/cla/parser.hpp>
#include <boost/test/utils/runtime/env/fetch.hpp>

// Boost
#include <boost/config.hpp>
#include <boost/test/detail/suppress_warnings.hpp>
#include <boost/test/detail/enable_warnings.hpp>
#include <boost/optional.hpp>
#include <boost/cstdlib.hpp>

// STL
#include <cstdlib>
#include <iostream>
#include <fstream>

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

# ifdef BOOST_NO_STDC_NAMESPACE
namespace std { using ::getenv; using ::strncmp; using ::strcmp; }
# endif

namespace boost {
namespace unit_test {

namespace rt = boost::runtime;

// ************************************************************************** //
// **************                 runtime_config               ************** //
// ************************************************************************** //

namespace runtime_config {

// UTF parameters
std::string AUTO_START_DBG    = "auto_start_dbg";
std::string BREAK_EXEC_PATH   = "break_exec_path";
std::string BUILD_INFO        = "build_info";
std::string CATCH_SYS_ERRORS  = "catch_system_errors";
std::string COLOR_OUTPUT      = "color_output";
std::string DETECT_FP_EXCEPT  = "detect_fp_exceptions";
std::string DETECT_MEM_LEAKS  = "detect_memory_leaks";
std::string LIST_CONTENT      = "list_content";
std::string LIST_LABELS       = "list_labels";
std::string LOG_FORMAT        = "log_format";
std::string LOG_LEVEL         = "log_level";
std::string LOG_SINK          = "log_sink";
std::string COMBINED_LOGGER   = "logger";
std::string OUTPUT_FORMAT     = "output_format";
std::string RANDOM_SEED       = "random";
std::string REPORT_FORMAT     = "report_format";
std::string REPORT_LEVEL      = "report_level";
std::string REPORT_MEM_LEAKS  = "report_memory_leaks_to";
std::string REPORT_SINK       = "report_sink";
std::string RESULT_CODE       = "result_code";
std::string RUN_FILTERS       = "run_test";
std::string SAVE_TEST_PATTERN = "save_pattern";
std::string SHOW_PROGRESS     = "show_progress";
std::string USE_ALT_STACK     = "use_alt_stack";
std::string WAIT_FOR_DEBUGGER = "wait_for_debugger";

std::string HELP              = "help";
std::string USAGE             = "usage";
std::string VERSION           = "version";

//____________________________________________________________________________//

namespace {

void
register_parameters( rt::parameters_store& store )
{
    rt::option auto_start_dbg( AUTO_START_DBG, (
        rt::description = "Automatically attaches debugger in case of system level failure (signal).",
        rt::env_var = "BOOST_TEST_AUTO_START_DBG",

        rt::help = "Option " + AUTO_START_DBG + " specifies whether Boost.Test should attempt "
                   "to attach a debugger when fatal system error occurs. At the moment this feature "
                   "is only available on a few selected platforms: Win32 and *nix. There is a "
                   "default debugger configured for these platforms. You can manually configure "
                   "different debugger. For more details on how to configure the debugger see the "
                   "Boost.Test debug API, specifically the function boost::debug::set_debugger."
    ));

    auto_start_dbg.add_cla_id( "--", AUTO_START_DBG, "=" );
    auto_start_dbg.add_cla_id( "-", "d", " " );
    store.add( auto_start_dbg );

    ///////////////////////////////////////////////

    rt::parameter<std::string> break_exec_path( BREAK_EXEC_PATH, (
        rt::description = "For the exception safety testing allows to break at specific execution path.",
        rt::env_var = "BOOST_TEST_BREAK_EXEC_PATH"
#ifndef BOOST_NO_CXX11_LAMBDAS
        ,
        rt::callback = [](rt::cstring) {
            BOOST_TEST_SETUP_ASSERT( false, "parameter break_exec_path is disabled in this release" );
        }
#endif
    ));

    break_exec_path.add_cla_id( "--", BREAK_EXEC_PATH, "=" );
    store.add( break_exec_path );

    ///////////////////////////////////////////////

    rt::option build_info( BUILD_INFO, (
        rt::description = "Displays library build information.",
        rt::env_var = "BOOST_TEST_BUILD_INFO",
        rt::help = "Option " + BUILD_INFO + " displays library build information, including: platform, "
                   "compiler, STL version and Boost version."
    ));

    build_info.add_cla_id( "--", BUILD_INFO, "=" );
    build_info.add_cla_id( "-", "i", " " );
    store.add( build_info );

    ///////////////////////////////////////////////

    rt::option catch_sys_errors( CATCH_SYS_ERRORS, (
        rt::description = "Allows to switch between catching and ignoring system errors (signals).",
        rt::env_var = "BOOST_TEST_CATCH_SYSTEM_ERRORS",
        rt::default_value =
#ifdef BOOST_TEST_DEFAULTS_TO_CORE_DUMP
            false,
#else
            true,
#endif
        rt::help = "If option " + CATCH_SYS_ERRORS + " has value no the frameworks does not attempt to catch "
                   "asynchronous system failure events (signals on *NIX platforms or structured exceptions on Windows). "
                   " Default value is "
#ifdef BOOST_TEST_DEFAULTS_TO_CORE_DUMP
                    "no."
#else
                    "true."
#endif
    ));

    catch_sys_errors.add_cla_id( "--", CATCH_SYS_ERRORS, "=", true );
    catch_sys_errors.add_cla_id( "-", "s", " " );
    store.add( catch_sys_errors );

    ///////////////////////////////////////////////

    rt::option color_output( COLOR_OUTPUT, (
        rt::description = "Enables color output of the framework log and report messages.",
        rt::env_var = "BOOST_TEST_COLOR_OUTPUT",
        rt::help = "The framework is able to produce color output on systems which supports it. "
                   "To enable this behavior set this option to yes. By default the framework "
                   "does not produces color output."
    ));

    color_output.add_cla_id( "--", COLOR_OUTPUT, "=", true );
    color_output.add_cla_id( "-", "x", " " );
    store.add( color_output );

    ///////////////////////////////////////////////

    rt::option detect_fp_except( DETECT_FP_EXCEPT, (
        rt::description = "Enables/disables floating point exceptions traps.",
        rt::env_var = "BOOST_TEST_DETECT_FP_EXCEPTIONS",
        rt::help = "Option " + DETECT_FP_EXCEPT + " enables/disables hardware traps for the floating "
                   "point exceptions (if supported on your platfrom)."
    ));

    detect_fp_except.add_cla_id( "--", DETECT_FP_EXCEPT, "=", true );
    store.add( detect_fp_except );

    ///////////////////////////////////////////////

    rt::parameter<unsigned long> detect_mem_leaks( DETECT_MEM_LEAKS, (
        rt::description = "Turns on/off memory leaks detection (optionally breaking on specified alloc order number).",
        rt::env_var = "BOOST_TEST_DETECT_MEMORY_LEAK",
        rt::default_value = 1L,
        rt::optional_value = 1L,
        rt::value_hint = "<alloc order number>",
        rt::help = "Parameter " + DETECT_MEM_LEAKS + " enables/disables memory leaks detection. "
                   "This parameter has optional long integer value. The default value is 1, which "
                   "enables the memory leak detection. The value 0 disables memory leak detection. "
                   "Any value N greater than 1 is treated as leak allocation number and tells the "
                   "framework to setup runtime breakpoint at Nth heap allocation. If value is "
                   "omitted the default value is assumed."
    ));

    detect_mem_leaks.add_cla_id( "--", DETECT_MEM_LEAKS, "=" );
    store.add( detect_mem_leaks );

    ///////////////////////////////////////////////

    rt::enum_parameter<unit_test::output_format> list_content( LIST_CONTENT, (
        rt::description = "Lists the content of test tree - names of all test suites and test cases.",
        rt::env_var = "BOOST_TEST_LIST_CONTENT",
        rt::default_value = OF_INVALID,
        rt::optional_value = OF_CLF,
        rt::enum_values<unit_test::output_format>::value =
#if defined(BOOST_TEST_CLA_NEW_API)
        {
            { "HRF", OF_CLF },
            { "DOT", OF_DOT }
        },
#else
        rt::enum_values_list<unit_test::output_format>()
            ( "HRF", OF_CLF )
            ( "DOT", OF_DOT )
        ,
#endif
        rt::help = "Parameter " + LIST_CONTENT + " instructs the framework to list the content "
                   "of the test module instead of executing the test cases. Parameter accepts "
                   "optional string value indicating the format of the output. Currently the "
                   "framework supports two formats: human readable format (HRF) and dot graph "
                   "format (DOT). If value is omitted HRF value is assumed."
    ));
    list_content.add_cla_id( "--", LIST_CONTENT, "=" );
    store.add( list_content );

    ///////////////////////////////////////////////

    rt::option list_labels( LIST_LABELS, (
        rt::description = "Lists all available labels.",
        rt::env_var = "BOOST_TEST_LIST_LABELS",
        rt::help = "Option " + LIST_LABELS + " instructs the framework to list all the the labels "
                   "defined in the test module instead of executing the test cases."
    ));

    list_labels.add_cla_id( "--", LIST_LABELS, "=" );
    store.add( list_labels );

    ///////////////////////////////////////////////

    rt::enum_parameter<unit_test::output_format> log_format( LOG_FORMAT, (
        rt::description = "Specifies log format.",
        rt::env_var = "BOOST_TEST_LOG_FORMAT",
        rt::default_value = OF_CLF,
        rt::enum_values<unit_test::output_format>::value =
#if defined(BOOST_TEST_CLA_NEW_API)
        {
            { "HRF", OF_CLF },
            { "CLF", OF_CLF },
            { "XML", OF_XML },
            { "JUNIT", OF_JUNIT },
        },
#else
        rt::enum_values_list<unit_test::output_format>()
            ( "HRF", OF_CLF )
            ( "CLF", OF_CLF )
            ( "XML", OF_XML )
            ( "JUNIT", OF_JUNIT )
        ,
#endif
        rt::help = "Parameter " + LOG_FORMAT + " allows to set the frameowrk's log format to one "
                   "of the formats supplied by the framework. The only acceptable values for this "
                   "parameter are the names of the output formats supplied by the framework. By "
                   "default the framework uses human readable format (HRF) for testing log. This "
                   "format is similar to compiler error format. Alternatively you can specify XML "
                   "or JUNIT as log format, which are easier to process by testing automation tools."
    ));

    log_format.add_cla_id( "--", LOG_FORMAT, "=" );
    log_format.add_cla_id( "-", "f", " " );
    store.add( log_format );

    ///////////////////////////////////////////////

    rt::enum_parameter<unit_test::log_level> log_level( LOG_LEVEL, (
        rt::description = "Specifies log level.",
        rt::env_var = "BOOST_TEST_LOG_LEVEL",
        rt::default_value = log_all_errors,
        rt::enum_values<unit_test::log_level>::value =
#if defined(BOOST_TEST_CLA_NEW_API)
        {
            { "all"           , log_successful_tests },
            { "success"       , log_successful_tests },
            { "test_suite"    , log_test_units },
            { "unit_scope"    , log_test_units },
            { "message"       , log_messages },
            { "warning"       , log_warnings },
            { "error"         , log_all_errors },
            { "cpp_exception" , log_cpp_exception_errors },
            { "system_error"  , log_system_errors },
            { "fatal_error"   , log_fatal_errors },
            { "nothing"       , log_nothing }
        },
#else
        rt::enum_values_list<unit_test::log_level>()
            ( "all"           , log_successful_tests )
            ( "success"       , log_successful_tests )
            ( "test_suite"    , log_test_units )
            ( "unit_scope"    , log_test_units )
            ( "message"       , log_messages )
            ( "warning"       , log_warnings )
            ( "error"         , log_all_errors )
            ( "cpp_exception" , log_cpp_exception_errors )
            ( "system_error"  , log_system_errors )
            ( "fatal_error"   , log_fatal_errors )
            ( "nothing"       , log_nothing )
        ,
#endif
        rt::help = "Parameter " + LOG_LEVEL + " allows to set the framework's log level. "
                   "Log level defines the verbosity of testing log produced by a testing "
                   "module. The verbosity ranges from a complete log, when all assertions "
                   "(both successful and failing) are reported, all notifications about "
                   "test units start and finish are included, to an empty log when nothing "
                   "is reported to a testing log stream."
    ));

    log_level.add_cla_id( "--", LOG_LEVEL, "=" );
    log_level.add_cla_id( "-", "l", " " );
    store.add( log_level );

    ///////////////////////////////////////////////

    rt::parameter<std::string> log_sink( LOG_SINK, (
        rt::description = "Specifies log sink: stdout(default), stderr or file name.",
        rt::env_var = "BOOST_TEST_LOG_SINK",
        rt::value_hint = "<stderr|stdout|file name>",
        rt::help = "Parameter " + LOG_SINK + " allows to set the log sink - location "
                   "where we report the log to, thus it allows to easily redirect the "
                   "test logs to file or standard streams. By default testing log is "
                   "directed to standard output."
    ));

    log_sink.add_cla_id( "--", LOG_SINK, "=" );
    log_sink.add_cla_id( "-", "k", " " );
    store.add( log_sink );

    ///////////////////////////////////////////////

    rt::enum_parameter<unit_test::output_format> output_format( OUTPUT_FORMAT, (
        rt::description = "Specifies output format (both log and report).",
        rt::env_var = "BOOST_TEST_OUTPUT_FORMAT",
        rt::enum_values<unit_test::output_format>::value =
#if defined(BOOST_TEST_CLA_NEW_API)
        {
            { "HRF", OF_CLF },
            { "CLF", OF_CLF },
            { "XML", OF_XML }
        },
#else
        rt::enum_values_list<unit_test::output_format>()
            ( "HRF", OF_CLF )
            ( "CLF", OF_CLF )
            ( "XML", OF_XML )
        ,
#endif
        rt::help = "Parameter " + OUTPUT_FORMAT + " combines an effect of " + REPORT_FORMAT +
                   " and " + LOG_FORMAT + " parameters. This parameter has higher priority "
                   "than either one of them. In other words if this parameter is specified "
                   "it overrides the value of other two parameters. This parameter does not "
                   "have a default value. The only acceptable values are string names of "
                   "output formats: HRF - human readable format and XML - XML formats for "
                   "automation tools processing."
    ));

    output_format.add_cla_id( "--", OUTPUT_FORMAT, "=" );
    output_format.add_cla_id( "-", "o", " " );
    store.add( output_format );

    /////////////////////////////////////////////// combined logger option

    rt::parameter<std::string,rt::REPEATABLE_PARAM> combined_logger( COMBINED_LOGGER, (
        rt::description = "Specifies log level and sink for one or several log format",
        rt::env_var = "BOOST_TEST_LOGGER",
        rt::value_hint = "log_format:log_level:log_sink",
        rt::help = "Parameter " + COMBINED_LOGGER + " allows to specify the logger type, level and sink\n"
                   "in one command."
    ));

    combined_logger.add_cla_id( "--", COMBINED_LOGGER, "=" );
    store.add( combined_logger );

    ///////////////////////////////////////////////

    rt::parameter<unsigned> random_seed( RANDOM_SEED, (
        rt::description = "Allows to switch between sequential and random order of test units execution."
                          " Optionally allows to specify concrete seed for random number generator.",
        rt::env_var = "BOOST_TEST_RANDOM",
        rt::default_value = 0U,
        rt::optional_value = 1U,
        rt::value_hint = "<seed>",
        rt::help = "Parameter " + RANDOM_SEED + " instructs the framework to execute the "
                   "test cases in random order. This parameter accepts optional unsigned "
                   "integer argument. By default test cases are executed in some specific "
                   "order defined by order of test units in test files and dependency between "
                   "test units. If parameter is specified without the argument value testing "
                   "order is randomized based on current time. Alternatively you can specify "
                   "any positive value greater than 1 and it will be used as random seed for "
                   "the run."
    ));

    random_seed.add_cla_id( "--", RANDOM_SEED, "=" );
    store.add( random_seed );

    ///////////////////////////////////////////////

    rt::enum_parameter<unit_test::output_format> report_format( REPORT_FORMAT, (
        rt::description = "Specifies report format.",
        rt::env_var = "BOOST_TEST_REPORT_FORMAT",
        rt::default_value = OF_CLF,
        rt::enum_values<unit_test::output_format>::value =
#if defined(BOOST_TEST_CLA_NEW_API)
        {
            { "HRF", OF_CLF },
            { "CLF", OF_CLF },
            { "XML", OF_XML }
        },
#else
        rt::enum_values_list<unit_test::output_format>()
            ( "HRF", OF_CLF )
            ( "CLF", OF_CLF )
            ( "XML", OF_XML )
        ,
#endif
        rt::help = "Parameter " + REPORT_FORMAT + " allows to set the framework's report format "
                   "to one of the formats supplied by the framework. The only acceptable values "
                   "for this parameter are the names of the output formats. By default the framework "
                   "uses human readable format (HRF) for results reporting. Alternatively you can "
                   "specify XML as report format. This format is easier to process by testing "
                   "automation tools."
    ));

    report_format.add_cla_id( "--", REPORT_FORMAT, "=" );
    report_format.add_cla_id( "-", "m", " " );
    store.add( report_format );

    ///////////////////////////////////////////////

    rt::enum_parameter<unit_test::report_level> report_level( REPORT_LEVEL, (
        rt::description = "Specifies report level.",
        rt::env_var = "BOOST_TEST_REPORT_LEVEL",
        rt::default_value = CONFIRMATION_REPORT,
        rt::enum_values<unit_test::report_level>::value =
#if defined(BOOST_TEST_CLA_NEW_API)
        {
            { "confirm",  CONFIRMATION_REPORT },
            { "short",    SHORT_REPORT },
            { "detailed", DETAILED_REPORT },
            { "no",       NO_REPORT }
        },
#else
        rt::enum_values_list<unit_test::report_level>()
            ( "confirm",  CONFIRMATION_REPORT )
            ( "short",    SHORT_REPORT )
            ( "detailed", DETAILED_REPORT )
            ( "no",       NO_REPORT )
        ,
#endif
        rt::help = "Parameter " + REPORT_LEVEL + " allows to set the verbosity level of the "
                   "testing result report generated by the framework. Use value 'no' to "
                   "eliminate the results report completely."
    ));

    report_level.add_cla_id( "--", REPORT_LEVEL, "=" );
    report_level.add_cla_id( "-", "r", " " );
    store.add( report_level );

    ///////////////////////////////////////////////

    rt::parameter<std::string> report_mem_leaks( REPORT_MEM_LEAKS, (
        rt::description = "File where to report memory leaks to.",
        rt::env_var = "BOOST_TEST_REPORT_MEMORY_LEAKS_TO",
        rt::default_value = std::string(),
        rt::value_hint = "<file name>",
        rt::help = "Parameter " + REPORT_MEM_LEAKS + " allows to specify a file where to report "
                   "memory leaks to. The parameter does not have default value. If it is not specified, "
                   "memory leaks (if any) are reported to the standard error stream."
    ));

    report_mem_leaks.add_cla_id( "--", REPORT_MEM_LEAKS, "=" );
    store.add( report_mem_leaks );

    ///////////////////////////////////////////////

    rt::parameter<std::string> report_sink( REPORT_SINK, (
        rt::description = "Specifies report sink: stderr(default), stdout or file name.",
        rt::env_var = "BOOST_TEST_REPORT_SINK",
        rt::value_hint = "<stderr|stdout|file name>",
        rt::help = "Parameter " + REPORT_SINK + " allows to set the result report sink - "
                   "the location where the framework writes the result report to, thus it "
                   "allows to easily redirect the result report to a file or a standard "
                   "stream. By default the testing result report is directed to the "
                   "standard error stream."
    ));

    report_sink.add_cla_id( "--", REPORT_SINK, "=" );
    report_sink.add_cla_id( "-", "e", " " );
    store.add( report_sink );

    ///////////////////////////////////////////////

    rt::option result_code( RESULT_CODE, (
        rt::description = "Disables test modules's result code generation.",
        rt::env_var = "BOOST_TEST_RESULT_CODE",
        rt::default_value = true,
        rt::help = "The 'no' argument value for the parameter " + RESULT_CODE + " instructs the "
                   "framework to always return zero result code. This can be used for test programs "
                   "executed within IDE. By default this parameter has value 'yes'."
    ));

    result_code.add_cla_id( "--", RESULT_CODE, "=", true );
    result_code.add_cla_id( "-", "c", " " );
    store.add( result_code );

    ///////////////////////////////////////////////

    rt::parameter<std::string,rt::REPEATABLE_PARAM> tests_to_run( RUN_FILTERS, (
        rt::description = "Filters, which test units to include or exclude from test module execution.",
        rt::env_var = "BOOST_TEST_RUN_FILTERS",
        rt::value_hint = "<test unit filter>",
        rt::help = "Parameter " + RUN_FILTERS + " allows to filter which test units to execute during "
                   "testing. The framework supports both 'selection filters', which allow to select "
                   "which test units to enable from the set of available test units, and 'disabler "
                   "filters', which allow to disable some test units. The __UTF__ also supports "
                   "enabling/disabling test units at compile time. These settings identify the default "
                   "set of test units to run. Parameter " + RUN_FILTERS + " is used to change this default. "
                   "This parameter is repeatable, so you can specify more than one filter if necessary."
    ));

    tests_to_run.add_cla_id( "--", RUN_FILTERS, "=" );
    tests_to_run.add_cla_id( "-", "t", " " );
    store.add( tests_to_run );

    ///////////////////////////////////////////////

    rt::option save_test_pattern( SAVE_TEST_PATTERN, (
        rt::description = "Allows to switch between saving or matching test pattern file.",
        rt::env_var = "BOOST_TEST_SAVE_PATTERN",
        rt::help = "Parameter " + SAVE_TEST_PATTERN + " facilitates switching mode of operation for "
                   "testing output streams.\n\nThis parameter serves no particular purpose within the "
                   "framework itself. It can be used by test modules relying on output_test_stream to "
                   "implement testing logic. Default mode is 'match' (false)."
    ));

    save_test_pattern.add_cla_id( "--", SAVE_TEST_PATTERN, "=" );
    store.add( save_test_pattern );

    ///////////////////////////////////////////////

    rt::option show_progress( SHOW_PROGRESS, (
        rt::description = "Turns on progress display.",
        rt::env_var = "BOOST_TEST_SHOW_PROGRESS",
        rt::help = "Parameter " + SHOW_PROGRESS + " instructs the framework to display test progress "
                   "information. By default the test progress is not shown."
    ));

    show_progress.add_cla_id( "--", SHOW_PROGRESS, "=" );
    show_progress.add_cla_id( "-", "p", " " );
    store.add( show_progress );

    ///////////////////////////////////////////////

    rt::option use_alt_stack( USE_ALT_STACK, (
        rt::description = "Turns on/off usage of an alternative stack for signal handling.",
        rt::env_var = "BOOST_TEST_USE_ALT_STACK",
        rt::default_value = true,
        rt::help = "Parameter " + USE_ALT_STACK + " instructs the framework to use alternative "
                   "stack for signals processing, on platforms where they are supported. The feature "
                   "is enabled by default, but can be disabled using this parameter."
    ));

    use_alt_stack.add_cla_id( "--", USE_ALT_STACK, "=", true );
    store.add( use_alt_stack );

    ///////////////////////////////////////////////

    rt::option wait_for_debugger( WAIT_FOR_DEBUGGER, (
        rt::description = "Forces test module to wait for button to be pressed before starting test run.",
        rt::env_var = "BOOST_TEST_WAIT_FOR_DEBUGGER",
        rt::help = "Parameter " + WAIT_FOR_DEBUGGER + " instructs the framework to pause before starting "
                   "test units execution, so that you can attach a debugger to running test module. By "
                   "default this parameters turned off."
    ));

    wait_for_debugger.add_cla_id( "--", WAIT_FOR_DEBUGGER, "=" );
    wait_for_debugger.add_cla_id( "-", "w", " " );
    store.add( wait_for_debugger );

    ///////////////////////////////////////////////

    rt::parameter<std::string> help( HELP, (
        rt::description = "Help for framework parameters.",
        rt::optional_value = std::string(),
        rt::value_hint = "<parameter name>",
        rt::help = "Parameter " + HELP + " displays help on the framework's parameters. "
                   "The parameter accepts an optional argument value. If present, an argument value is "
                   "interpreted as a parameter name (name guessing works as well, so for example "
                   "--help=rand displays help on the parameter random). If the parameter name is unknown "
                   "or ambiguous error is reported. If argument value is absent, a summary of all "
                   "framework's parameter is displayed."
    ));
    help.add_cla_id( "--", HELP, "=" );
    store.add( help );

    ///////////////////////////////////////////////

    rt::option usage( USAGE, (
        rt::description = "Short message explaining usage of Boost.Test parameters."
    ));
    usage.add_cla_id( "-", "?", " " );
    store.add( usage );

    ///////////////////////////////////////////////

    rt::option version( VERSION, (
        rt::description = "Prints Boost.Test version and exits."
    ));
    version.add_cla_id( "--", VERSION, " " );
    store.add( version );
}

static rt::arguments_store  s_arguments_store;
static rt::parameters_store s_parameters_store;

//____________________________________________________________________________//

} // local namespace

void
init( int& argc, char** argv )
{
    shared_ptr<rt::cla::parser> parser;

    BOOST_TEST_I_TRY {
        // Initialize parameters list
        if( s_parameters_store.is_empty() )
            register_parameters( s_parameters_store );

        // Clear up arguments store just in case (of multiple init invocations)
        s_arguments_store.clear();

        // Parse CLA they take precedence over  environment
        parser.reset( new rt::cla::parser( s_parameters_store, (rt::end_of_params = "--", rt::negation_prefix = "no_") ) );
        argc = parser->parse( argc, argv, s_arguments_store );

        // Try to fetch missing arguments from environment
        rt::env::fetch_absent( s_parameters_store, s_arguments_store );

        // Set arguments to default values if defined and perform all the validations
        rt::finalize_arguments( s_parameters_store, s_arguments_store );

        // Report help if requested
        if( runtime_config::get<bool>( VERSION ) ) {
            parser->version( std::cerr );
            BOOST_TEST_I_THROW( framework::nothing_to_test( boost::exit_success ) );
        }
        else if( runtime_config::get<bool>( USAGE ) ) {
            parser->usage( std::cerr );
            BOOST_TEST_I_THROW( framework::nothing_to_test( boost::exit_success ) );
        }
        else if( s_arguments_store.has( HELP ) ) {
            parser->help( std::cerr, s_parameters_store, runtime_config::get<std::string>( HELP ) );
            BOOST_TEST_I_THROW( framework::nothing_to_test( boost::exit_success ) );
        }

        // A bit of business logic: output_format takes precedence over log/report formats
        if( s_arguments_store.has( OUTPUT_FORMAT ) ) {
            unit_test::output_format of = s_arguments_store.get<unit_test::output_format>( OUTPUT_FORMAT );
            s_arguments_store.set( REPORT_FORMAT, of );
            s_arguments_store.set( LOG_FORMAT, of );
        }

    }
    BOOST_TEST_I_CATCH( rt::init_error, ex ) {
        BOOST_TEST_SETUP_ASSERT( false, ex.msg );
    }
    BOOST_TEST_I_CATCH( rt::ambiguous_param, ex ) {
        std::cerr << ex.msg << "\n Did you mean one of these?\n";

        BOOST_TEST_FOREACH( rt::cstring, name, ex.m_amb_candidates )
            std::cerr << "   " << name << "\n";

        BOOST_TEST_I_THROW( framework::nothing_to_test( boost::exit_exception_failure ) );
    }
    BOOST_TEST_I_CATCH( rt::unrecognized_param, ex ) {
        std::cerr << ex.msg << "\n";

        if( !ex.m_typo_candidates.empty() ) {
            std::cerr << " Did you mean one of these?\n";

            BOOST_TEST_FOREACH( rt::cstring, name, ex.m_typo_candidates )
                std::cerr << "   " << name << "\n";
        }
        else if( parser ) {
            std::cerr << "\n";
            parser->usage( std::cerr );
        }

        BOOST_TEST_I_THROW( framework::nothing_to_test( boost::exit_exception_failure ) );
    }
    BOOST_TEST_I_CATCH( rt::input_error, ex ) {
        std::cerr << ex.msg << "\n\n";

        if( parser )
            parser->usage( std::cerr, ex.param_name );

        BOOST_TEST_I_THROW( framework::nothing_to_test( boost::exit_exception_failure ) );
    }
}

//____________________________________________________________________________//

rt::arguments_store const&
argument_store()
{
    return s_arguments_store;
}

//____________________________________________________________________________//

bool
save_pattern()
{
    return runtime_config::get<bool>( SAVE_TEST_PATTERN );
}

//____________________________________________________________________________//

} // namespace runtime_config
} // namespace unit_test
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_UNIT_TEST_PARAMETERS_IPP_012205GER

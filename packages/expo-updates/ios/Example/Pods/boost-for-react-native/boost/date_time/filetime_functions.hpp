#ifndef DATE_TIME_FILETIME_FUNCTIONS_HPP__
#define DATE_TIME_FILETIME_FUNCTIONS_HPP__

/* Copyright (c) 2004 CrystalClear Software, Inc.
 * Use, modification and distribution is subject to the
 * Boost Software License, Version 1.0. (See accompanying
 * file LICENSE_1_0.txt or http://www.boost.org/LICENSE_1_0.txt)
 * Author: Jeff Garland, Bart Garst
 * $Date$
 */

/*! @file filetime_functions.hpp
 * Function(s) for converting between a FILETIME structure and a
 * time object. This file is only available on systems that have
 * BOOST_HAS_FTIME defined.
 */

#include <boost/date_time/compiler_config.hpp>

#if defined(BOOST_HAS_FTIME) // skip this file if no FILETIME

#if defined(BOOST_USE_WINDOWS_H)
#  include <windows.h>
#endif

#include <boost/cstdint.hpp>
#include <boost/date_time/time.hpp>
#include <boost/date_time/date_defs.hpp>

namespace boost {

namespace date_time {

namespace winapi {

#if !defined(BOOST_USE_WINDOWS_H)

    extern "C" {

        struct FILETIME
        {
            boost::uint32_t dwLowDateTime;
            boost::uint32_t dwHighDateTime;
        };
        struct SYSTEMTIME
        {
            boost::uint16_t wYear;
            boost::uint16_t wMonth;
            boost::uint16_t wDayOfWeek;
            boost::uint16_t wDay;
            boost::uint16_t wHour;
            boost::uint16_t wMinute;
            boost::uint16_t wSecond;
            boost::uint16_t wMilliseconds;
        };

        __declspec(dllimport) void __stdcall GetSystemTimeAsFileTime(FILETIME* lpFileTime);
        __declspec(dllimport) int __stdcall FileTimeToLocalFileTime(const FILETIME* lpFileTime, FILETIME* lpLocalFileTime);
        __declspec(dllimport) void __stdcall GetSystemTime(SYSTEMTIME* lpSystemTime);
        __declspec(dllimport) int __stdcall SystemTimeToFileTime(const SYSTEMTIME* lpSystemTime, FILETIME* lpFileTime);

    } // extern "C"

#endif // defined(BOOST_USE_WINDOWS_H)

    typedef FILETIME file_time;
    typedef SYSTEMTIME system_time;

    inline void get_system_time_as_file_time(file_time& ft)
    {
#if BOOST_WORKAROUND(__MWERKS__, BOOST_TESTED_AT(0x3205))
        // Some runtime library implementations expect local times as the norm for ctime.
        file_time ft_utc;
        GetSystemTimeAsFileTime(&ft_utc);
        FileTimeToLocalFileTime(&ft_utc, &ft);
#elif defined(BOOST_HAS_GETSYSTEMTIMEASFILETIME)
        GetSystemTimeAsFileTime(&ft);
#else
        system_time st;
        GetSystemTime(&st);
        SystemTimeToFileTime(&st, &ft);
#endif
    }

    /*!
     * The function converts file_time into number of microseconds elapsed since 1970-Jan-01
     *
     * \note Only dates after 1970-Jan-01 are supported. Dates before will be wrapped.
     *
     * \note The function is templated on the FILETIME type, so that
     *       it can be used with both native FILETIME and the ad-hoc
     *       boost::date_time::winapi::file_time type.
     */
    template< typename FileTimeT >
    inline boost::uint64_t file_time_to_microseconds(FileTimeT const& ft)
    {
        /* shift is difference between 1970-Jan-01 & 1601-Jan-01
        * in 100-nanosecond intervals */
        const uint64_t shift = 116444736000000000ULL; // (27111902 << 32) + 3577643008

        union {
            FileTimeT as_file_time;
            uint64_t as_integer; // 100-nanos since 1601-Jan-01
        } caster;
        caster.as_file_time = ft;

        caster.as_integer -= shift; // filetime is now 100-nanos since 1970-Jan-01
        return (caster.as_integer / 10); // truncate to microseconds
    }

} // namespace winapi

//! Create a time object from an initialized FILETIME struct.
/*!
 * Create a time object from an initialized FILETIME struct.
 * A FILETIME struct holds 100-nanosecond units (0.0000001). When
 * built with microsecond resolution the file_time's sub second value
 * will be truncated. Nanosecond resolution has no truncation.
 *
 * \note The function is templated on the FILETIME type, so that
 *       it can be used with both native FILETIME and the ad-hoc
 *       boost::date_time::winapi::file_time type.
 */
template< typename TimeT, typename FileTimeT >
inline
TimeT time_from_ftime(const FileTimeT& ft)
{
    typedef typename TimeT::date_type date_type;
    typedef typename TimeT::date_duration_type date_duration_type;
    typedef typename TimeT::time_duration_type time_duration_type;

    // https://svn.boost.org/trac/boost/ticket/2523
    // Since this function can be called with arbitrary times, including ones that
    // are before 1970-Jan-01, we'll have to cast the time a bit differently,
    // than it is done in the file_time_to_microseconds function. This allows to
    // avoid integer wrapping for dates before 1970-Jan-01.
    union {
        FileTimeT as_file_time;
        uint64_t as_integer; // 100-nanos since 1601-Jan-01
    } caster;
    caster.as_file_time = ft;

    uint64_t sec = caster.as_integer / 10000000UL;
    uint32_t sub_sec = (caster.as_integer % 10000000UL) // 100-nanoseconds since the last second
#if !defined(BOOST_DATE_TIME_POSIX_TIME_STD_CONFIG)
        / 10; // microseconds since the last second
#else
        * 100; // nanoseconds since the last second
#endif

    // split sec into usable chunks: days, hours, minutes, & seconds
    const uint32_t sec_per_day = 86400; // seconds per day
    uint32_t days = static_cast< uint32_t >(sec / sec_per_day);
    uint32_t tmp = static_cast< uint32_t >(sec % sec_per_day);
    uint32_t hours = tmp / 3600; // sec_per_hour
    tmp %= 3600;
    uint32_t minutes = tmp / 60; // sec_per_min
    tmp %= 60;
    uint32_t seconds = tmp; // seconds

    date_duration_type dd(days);
    date_type d = date_type(1601, Jan, 01) + dd;
    return TimeT(d, time_duration_type(hours, minutes, seconds, sub_sec));
}

}} // boost::date_time

#endif // BOOST_HAS_FTIME

#endif // DATE_TIME_FILETIME_FUNCTIONS_HPP__

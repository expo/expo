/*=============================================================================
    Copyright (c) 2001-2011 Hartmut Kaiser

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !defined(BOOST_SPIRIT_ITERATOR_ISTREAM_MAY_05_2007_0110PM)
#define BOOST_SPIRIT_ITERATOR_ISTREAM_MAY_05_2007_0110PM

#if defined(_MSC_VER)
#pragma once
#endif

#include <boost/iostreams/stream.hpp>
#include <boost/detail/iterator.hpp>

///////////////////////////////////////////////////////////////////////////////
namespace boost { namespace spirit { namespace qi { namespace detail
{
    ///////////////////////////////////////////////////////////////////////////
    template <typename Iterator>
    struct iterator_source
    {
        typedef typename
            boost::detail::iterator_traits<Iterator>::value_type
        char_type;
        typedef boost::iostreams::seekable_device_tag category;

        iterator_source (Iterator const& first_, Iterator const& last_)
          : first(first_), last(last_), pos(0)
        {}

        // Read up to n characters from the input sequence into the buffer s,
        // returning the number of characters read, or -1 to indicate
        // end-of-sequence.
        std::streamsize read (char_type* s, std::streamsize n)
        {
            if (first == last)
                return -1;

            std::streamsize bytes_read = 0;
            while (n--) {
                *s = *first;
                ++s; ++bytes_read;
                if (++first == last)
                    break;
            }

            pos += bytes_read;
            return bytes_read;
        }

        // Write is implemented only to satisfy the requirements of a
        // boost::iostreams::seekable_device. We need to have see support to
        // be able to figure out how many characters have been actually
        // consumed by the stream.
        std::streamsize write(const char_type*, std::streamsize)
        {
            BOOST_ASSERT(false);    // not supported
            return -1;
        }

        std::streampos seek(boost::iostreams::stream_offset, std::ios_base::seekdir way)
        {
            BOOST_ASSERT(way == std::ios_base::cur);    // only support queries
            return pos;                              // return current position
        }

        Iterator first;
        Iterator const& last;
        std::streamsize pos;

    private:
        // silence MSVC warning C4512: assignment operator could not be generated
        iterator_source& operator= (iterator_source const&);
    };

}}}}

#endif

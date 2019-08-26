//  Copyright (c) 2001-2011 Hartmut Kaiser
// 
//  Distributed under the Boost Software License, Version 1.0. (See accompanying 
//  file LICENSE_1_0.txt or copy at http://www.boist.org/LICENSE_1_0.txt)

#if !defined(BOOST_SPIRIT_ITERATOR_SINK_MAY_27_2007_0133PM)
#define BOOST_SPIRIT_ITERATOR_SINK_MAY_27_2007_0133PM

#if defined(_MSC_VER)
#pragma once
#endif

#include <boost/iostreams/stream.hpp>
#include <boost/spirit/home/karma/detail/generate_to.hpp>

///////////////////////////////////////////////////////////////////////////////
namespace boost { namespace spirit { namespace karma { namespace detail
{
    ///////////////////////////////////////////////////////////////////////////
    template <
        typename OutputIterator, typename Char, typename CharEncoding
      , typename Tag
    >
    struct iterator_sink
    {
        typedef boost::iostreams::sink_tag category;
        typedef Char char_type;

        iterator_sink (OutputIterator& sink_)
          : sink(sink_)
        {}

        // Write up to n characters from the buffer s to the output sequence, 
        // returning the number of characters written
        std::streamsize write (Char const* s, std::streamsize n) 
        {
            std::streamsize bytes_written = 0;
            while (n--) {
                if (!generate_to(sink, *s, CharEncoding(), Tag()))
                    break;
                ++s; ++bytes_written;
            }
            return bytes_written;
        }

        OutputIterator& sink;

    private:
        // silence MSVC warning C4512: assignment operator could not be generated
        iterator_sink& operator= (iterator_sink const&);
    };

}}}}

#endif

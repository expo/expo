#ifndef _DATE_TIME_DATE_PARSING_HPP___
#define _DATE_TIME_DATE_PARSING_HPP___

/* Copyright (c) 2002,2003,2005 CrystalClear Software, Inc.
 * Use, modification and distribution is subject to the
 * Boost Software License, Version 1.0. (See accompanying
 * file LICENSE_1_0.txt or http://www.boost.org/LICENSE_1_0.txt)
 * Author: Jeff Garland, Bart Garst
 * $Date$
 */

#include <string>
#include <iterator>
#include <algorithm>
#include <boost/tokenizer.hpp>
#include <boost/lexical_cast.hpp>
#include <boost/date_time/compiler_config.hpp>
#include <boost/date_time/parse_format_base.hpp>

#if defined(BOOST_DATE_TIME_NO_LOCALE)
#include <cctype> // ::tolower(int)
#else
#include <locale> // std::tolower(char, locale)
#endif

namespace boost {
namespace date_time {

  //! A function to replace the std::transform( , , ,tolower) construct
  /*! This function simply takes a string, and changes all the characters
   * in that string to lowercase (according to the default system locale).
   * In the event that a compiler does not support locales, the old
   * C style tolower() is used.
   */
  inline
  std::string
  convert_to_lower(std::string inp)
  {
#if !defined(BOOST_DATE_TIME_NO_LOCALE)
    const std::locale loc(std::locale::classic());
#endif
    std::string::size_type i = 0, n = inp.length();
    for (; i < n; ++i) {
      inp[i] =
#if defined(BOOST_DATE_TIME_NO_LOCALE)
        static_cast<char>(std::tolower(inp[i]));
#else
        // tolower and others were brought in to std for borland >= v564
        // in compiler_config.hpp
        std::tolower(inp[i], loc);
#endif
    }
    return inp;
  }

    //! Helper function for parse_date.
    /* Used by-value parameter because we change the string and may
     * want to preserve the original argument */
    template<class month_type>
    inline unsigned short
    month_str_to_ushort(std::string const& s) {
      if((s.at(0) >= '0') && (s.at(0) <= '9')) {
        return boost::lexical_cast<unsigned short>(s);
      }
      else {
        std::string str = convert_to_lower(s);
        typename month_type::month_map_ptr_type ptr = month_type::get_month_map_ptr();
        typename month_type::month_map_type::iterator iter = ptr->find(str);
        if(iter != ptr->end()) { // required for STLport
          return iter->second;
        }
      }
      return 13; // intentionally out of range - name not found
    }
 
    //! Find index of a string in either of 2 arrays
    /*! find_match searches both arrays for a match to 's'. Both arrays
     * must contain 'size' elements. The index of the match is returned.
     * If no match is found, 'size' is returned.
     * Ex. "Jan" returns 0, "Dec" returns 11, "Tue" returns 2.
     * 'size' can be sent in with: (greg_month::max)() (which 12),
     * (greg_weekday::max)() + 1 (which is 7) or date_time::NumSpecialValues */
    template<class charT>
    short find_match(const charT* const* short_names,
                     const charT* const* long_names,
                     short size,
                     const std::basic_string<charT>& s) {
      for(short i = 0; i < size; ++i){
        if(short_names[i] == s || long_names[i] == s){
          return i;
        }
      }
      return size; // not-found, return a value out of range
    }

    //! Generic function to parse a delimited date (eg: 2002-02-10)
    /*! Accepted formats are: "2003-02-10" or " 2003-Feb-10" or
     * "2003-Feburary-10"
     * The order in which the Month, Day, & Year appear in the argument
     * string can be accomodated by passing in the appropriate ymd_order_spec
     */
    template<class date_type>
    date_type
    parse_date(const std::string& s, int order_spec = ymd_order_iso) {
      std::string spec_str;
      if(order_spec == ymd_order_iso) {
        spec_str = "ymd";
      }
      else if(order_spec == ymd_order_dmy) {
        spec_str = "dmy";
      }
      else { // (order_spec == ymd_order_us)
        spec_str = "mdy";
      }

      typedef typename date_type::month_type month_type;
      unsigned pos = 0;
      unsigned short year(0), month(0), day(0);
      typedef typename std::basic_string<char>::traits_type traits_type;
      typedef boost::char_separator<char, traits_type> char_separator_type;
      typedef boost::tokenizer<char_separator_type,
                               std::basic_string<char>::const_iterator,
                               std::basic_string<char> > tokenizer;
      typedef boost::tokenizer<char_separator_type,
                               std::basic_string<char>::const_iterator,
                               std::basic_string<char> >::iterator tokenizer_iterator;
      // may need more delimiters, these work for the regression tests
      const char sep_char[] = {',','-','.',' ','/','\0'};
      char_separator_type sep(sep_char);
      tokenizer tok(s,sep);
      for(tokenizer_iterator beg=tok.begin();
          beg!=tok.end() && pos < spec_str.size();
          ++beg, ++pos) {
        switch(spec_str.at(pos)) {
          case 'y':
          {
            year = boost::lexical_cast<unsigned short>(*beg);
            break;
          }
          case 'm':
          {
            month = month_str_to_ushort<month_type>(*beg);
            break;
          }
          case 'd':
          {
            day = boost::lexical_cast<unsigned short>(*beg);
            break;
          }
          default: break;
        } //switch
      }
      return date_type(year, month, day);
    }

    //! Generic function to parse undelimited date (eg: 20020201)
    template<class date_type>
    date_type
    parse_undelimited_date(const std::string& s) {
      int offsets[] = {4,2,2};
      int pos = 0;
      //typename date_type::ymd_type ymd((year_type::min)(),1,1);
      unsigned short y = 0, m = 0, d = 0;

      /* The two bool arguments state that parsing will not wrap
       * (only the first 8 characters will be parsed) and partial
       * strings will not be parsed.
       * Ex:
       * "2005121" will parse 2005 & 12, but not the "1" */
      boost::offset_separator osf(offsets, offsets+3, false, false);

      typedef typename boost::tokenizer<boost::offset_separator,
                                        std::basic_string<char>::const_iterator,
                                        std::basic_string<char> > tokenizer_type;
      tokenizer_type tok(s, osf);
      for(typename tokenizer_type::iterator ti=tok.begin(); ti!=tok.end();++ti) {
        unsigned short i = boost::lexical_cast<unsigned short>(*ti);
        switch(pos) {
        case 0: y = i; break;
        case 1: m = i; break;
        case 2: d = i; break;
        default:       break;
        }
        pos++;
      }
      return date_type(y,m,d);
    }

    //! Helper function for 'date gregorian::from_stream()'
    /*! Creates a string from the iterators that reference the
     * begining & end of a char[] or string. All elements are
     * used in output string */
    template<class date_type, class iterator_type>
    inline
    date_type
    from_stream_type(iterator_type& beg,
                     iterator_type const& end,
                     char)
    {
      std::ostringstream ss;
      while(beg != end) {
        ss << *beg++;
      }
      return parse_date<date_type>(ss.str());
    }

    //! Helper function for 'date gregorian::from_stream()'
    /*! Returns the first string found in the stream referenced by the
     * begining & end iterators */
    template<class date_type, class iterator_type>
    inline
    date_type
    from_stream_type(iterator_type& beg,
                     iterator_type const& /* end */,
                     std::string const&)
    {
      return parse_date<date_type>(*beg);
    }

    /* I believe the wchar stuff would be best elsewhere, perhaps in
     * parse_date<>()? In the mean time this gets us started... */
    //! Helper function for 'date gregorian::from_stream()'
    /*! Creates a string from the iterators that reference the
     * begining & end of a wstring. All elements are
     * used in output string */
    template<class date_type, class iterator_type>
    inline
    date_type from_stream_type(iterator_type& beg,
                               iterator_type const& end,
                               wchar_t)
    {
      std::ostringstream ss;
#if !defined(BOOST_DATE_TIME_NO_LOCALE)
      std::locale loc;
      std::ctype<wchar_t> const& fac = std::use_facet<std::ctype<wchar_t> >(loc);
      while(beg != end) {
        ss << fac.narrow(*beg++, 'X'); // 'X' will cause exception to be thrown
      }
#else
      while(beg != end) {
        char c = 'X'; // 'X' will cause exception to be thrown
        const wchar_t wc = *beg++;
        if (wc >= 0 && wc <= 127)
          c = static_cast< char >(wc);
        ss << c;
      }
#endif
      return parse_date<date_type>(ss.str());
    }
#ifndef BOOST_NO_STD_WSTRING
    //! Helper function for 'date gregorian::from_stream()'
    /*! Creates a string from the first wstring found in the stream
     * referenced by the begining & end iterators */
    template<class date_type, class iterator_type>
    inline
    date_type
    from_stream_type(iterator_type& beg,
                     iterator_type const& /* end */,
                     std::wstring const&) {
      std::wstring ws = *beg;
      std::ostringstream ss;
      std::wstring::iterator wsb = ws.begin(), wse = ws.end();
#if !defined(BOOST_DATE_TIME_NO_LOCALE)
      std::locale loc;
      std::ctype<wchar_t> const& fac = std::use_facet<std::ctype<wchar_t> >(loc);
      while(wsb != wse) {
        ss << fac.narrow(*wsb++, 'X'); // 'X' will cause exception to be thrown
      }
#else
      while(wsb != wse) {
        char c = 'X'; // 'X' will cause exception to be thrown
        const wchar_t wc = *wsb++;
        if (wc >= 0 && wc <= 127)
          c = static_cast< char >(wc);
        ss << c;
      }
#endif
      return parse_date<date_type>(ss.str());
    }
#endif // BOOST_NO_STD_WSTRING
#if (defined(BOOST_MSVC) && (_MSC_VER < 1300))
    // This function cannot be compiled with MSVC 6.0 due to internal compiler shorcomings
#else
    //! function called by wrapper functions: date_period_from_(w)string()
    template<class date_type, class charT>
    period<date_type, typename date_type::duration_type>
    from_simple_string_type(const std::basic_string<charT>& s){
      typedef typename std::basic_string<charT>::traits_type traits_type;
      typedef typename boost::char_separator<charT, traits_type> char_separator;
      typedef typename boost::tokenizer<char_separator,
                                        typename std::basic_string<charT>::const_iterator,
                                        std::basic_string<charT> > tokenizer;
      const charT sep_list[4] = {'[','/',']','\0'};
      char_separator sep(sep_list);
      tokenizer tokens(s, sep);
      typename tokenizer::iterator tok_it = tokens.begin();
      std::basic_string<charT> date_string = *tok_it;
      // get 2 string iterators and generate a date from them
      typename std::basic_string<charT>::iterator date_string_start = date_string.begin(),
                                                  date_string_end = date_string.end();
      typedef typename std::iterator_traits<typename std::basic_string<charT>::iterator>::value_type value_type;
      date_type d1 = from_stream_type<date_type>(date_string_start, date_string_end, value_type());
      date_string = *(++tok_it); // next token
      date_string_start = date_string.begin(), date_string_end = date_string.end();
      date_type d2 = from_stream_type<date_type>(date_string_start, date_string_end, value_type());
      return period<date_type, typename date_type::duration_type>(d1, d2);
    }
#endif

} } //namespace date_time




#endif


//  boost/io/quoted_manip.hpp  ---------------------------------------------------------//

//  Copyright Beman Dawes 2010

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt

//  Library home page http://www.boost.org/libs/io

//--------------------------------------------------------------------------------------// 

#ifndef BOOST_IO_QUOTED_MANIP
#define BOOST_IO_QUOTED_MANIP

#include <iosfwd>
#include <ios>
#include <string>
#include <iterator>
#include <boost/io/ios_state.hpp>

namespace boost
{
  namespace io
  {
    namespace detail { template <class String, class Char> struct quoted_proxy; }

    //  ------------  public interface  ------------------------------------------------//

    //  manipulator for const std::basic_string&
    template <class Char, class Traits, class Alloc>
      detail::quoted_proxy<std::basic_string<Char, Traits, Alloc> const &, Char>
        quoted(const std::basic_string<Char, Traits, Alloc>& s,
               Char escape='\\', Char delim='\"');

    //  manipulator for non-const std::basic_string&
    template <class Char, class Traits, class Alloc>
      detail::quoted_proxy<std::basic_string<Char, Traits, Alloc> &, Char>
        quoted(std::basic_string<Char, Traits, Alloc>& s,
               Char escape='\\', Char delim='\"');

    //  manipulator for const C-string*
    template <class Char>
      detail::quoted_proxy<const Char*, Char>
        quoted(const Char* s, Char escape='\\', Char delim='\"');

    //  -----------  implementation details  -------------------------------------------//

    namespace detail
    {
      //  proxy used as an argument pack 
      template <class String, class Char>
      struct quoted_proxy
      {
        String  string;
        Char    escape;
        Char    delim;

        quoted_proxy(String s_, Char escape_, Char delim_)
          : string(s_), escape(escape_), delim(delim_) {}
      private:
        // String may be a const type, so disable the assignment operator
        quoted_proxy& operator=(const quoted_proxy&);  // = deleted
      };

      //  abstract away difference between proxies with const or non-const basic_strings
      template <class Char, class Traits, class Alloc>
      std::basic_ostream<Char, Traits>&
      basic_string_inserter_imp(std::basic_ostream<Char, Traits>& os,
        std::basic_string<Char, Traits, Alloc> const & string, Char escape, Char delim)
      {
        os << delim;
        typename std::basic_string<Char, Traits, Alloc>::const_iterator
          end_it = string.end();
        for (typename std::basic_string<Char, Traits, Alloc>::const_iterator
          it = string.begin();
          it != end_it;
          ++it )
        {
          if (*it == delim || *it == escape)
            os << escape;
          os << *it;
        }
        os << delim;
        return os;
      }

      //  inserter for const std::basic_string& proxies
      template <class Char, class Traits, class Alloc>
      inline
      std::basic_ostream<Char, Traits>& operator<<(std::basic_ostream<Char, Traits>& os, 
        const quoted_proxy<std::basic_string<Char, Traits, Alloc> const &, Char>& proxy)
      {
        return basic_string_inserter_imp(os, proxy.string, proxy.escape, proxy.delim);
      }

      //  inserter for non-const std::basic_string& proxies
      template <class Char, class Traits, class Alloc>
      inline
      std::basic_ostream<Char, Traits>& operator<<(std::basic_ostream<Char, Traits>& os, 
        const quoted_proxy<std::basic_string<Char, Traits, Alloc>&, Char>& proxy)
      {
        return basic_string_inserter_imp(os, proxy.string, proxy.escape, proxy.delim);
      }
 
      //  inserter for const C-string* proxies
      template <class Char, class Traits>
      std::basic_ostream<Char, Traits>& operator<<(std::basic_ostream<Char, Traits>& os, 
        const quoted_proxy<const Char*, Char>& proxy)
      {
        os << proxy.delim;
        for (const Char* it = proxy.string;
          *it;
          ++it )
        {
          if (*it == proxy.delim || *it == proxy.escape)
            os << proxy.escape;
          os << *it;
        }
        os << proxy.delim;
        return os;
      }

      //  extractor for non-const std::basic_string& proxies
      template <class Char, class Traits, class Alloc>
      std::basic_istream<Char, Traits>& operator>>(std::basic_istream<Char, Traits>& is, 
        const quoted_proxy<std::basic_string<Char, Traits, Alloc>&, Char>& proxy)
      {
        proxy.string.clear();
        Char c;
        is >> c;
        if (c != proxy.delim)
        {
          is.unget();
          is >> proxy.string;
          return is;
        }
        {
          boost::io::ios_flags_saver ifs(is);
          is >> std::noskipws;
          for (;;)  
          {
            is >> c;
            if (!is.good())  // cope with I/O errors or end-of-file
              break;
            if (c == proxy.escape)
            {
              is >> c;
              if (!is.good())  // cope with I/O errors or end-of-file
                break;
            }
            else if (c == proxy.delim)
              break;
            proxy.string += c;
          }
        }
        return is;
      }

    }  // namespace detail

    //  manipulator implementation for const std::basic_string&
    template <class Char, class Traits, class Alloc>
    inline detail::quoted_proxy<std::basic_string<Char, Traits, Alloc> const &, Char>
    quoted(const std::basic_string<Char, Traits, Alloc>& s, Char escape, Char delim)
    {
      return detail::quoted_proxy<std::basic_string<Char, Traits, Alloc> const &, Char>
        (s, escape, delim);
    }

    //  manipulator implementation for non-const std::basic_string&
    template <class Char, class Traits, class Alloc>
    inline detail::quoted_proxy<std::basic_string<Char, Traits, Alloc> &, Char>
    quoted(std::basic_string<Char, Traits, Alloc>& s, Char escape, Char delim)
    {
      return detail::quoted_proxy<std::basic_string<Char, Traits, Alloc>&, Char>
        (s, escape, delim);
    }

    //  manipulator implementation for const C-string*
    template <class Char>
    inline detail::quoted_proxy<const Char*, Char>
    quoted(const Char* s, Char escape, Char delim)
    {
      return detail::quoted_proxy<const Char*, Char> (s, escape, delim);
    }

  }  // namespace io
}  // namespace boost

#endif // BOOST_IO_QUOTED_MANIP

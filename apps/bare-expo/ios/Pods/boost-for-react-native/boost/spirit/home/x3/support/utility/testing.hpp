/*=============================================================================
    Copyright (c) 2001-2015 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
=============================================================================*/
#if !defined(BOOST_SPIRIT_X3_TEST_UTILITIES)
#define BOOST_SPIRIT_X3_TEST_UTILITIES

#include <boost/regex.hpp>
#include <boost/filesystem.hpp>
#include <boost/filesystem/fstream.hpp>

namespace boost { namespace spirit { namespace x3 { namespace testing
{
    namespace fs = boost::filesystem;

    ////////////////////////////////////////////////////////////////////////////
    // compare
    //
    //      Compares the contents of in with the template tem. The template
    //      may include embedded regular expressions marked up within re_prefix
    //      and re_suffix tags. For example, given the default RE markup, this
    //      template <%[0-9]+%> will match any integer in in. The function
    //      will return the first non-matching position. The flag full_match
    //      indicates a full match. It is possible for returned pos to be
    //      at the end of in (in.end()) while still returning full_match ==
    //      false. In that case, we have a partial match.
    ////////////////////////////////////////////////////////////////////////////

    template <typename Iterator>
    struct compare_result
    {
        compare_result(
            Iterator pos
          , bool full_match
        ) : pos(pos), full_match(full_match) {}

        Iterator pos;
        bool full_match;
    };

    template <typename Range>
    compare_result<typename Range::const_iterator>
    compare(
        Range const& in
      , Range const& tem
      , char const* re_prefix = "<%"
      , char const* re_suffix = "%>"
    );

    ////////////////////////////////////////////////////////////////////////////
    // compare
    //
    //      1) Call f, given the contents of input_path loaded in a string.
    //         The result of calling f is the output string.
    //      2) Compare the result of calling f with expected template
    //         file (expect_path) using the low-level compare utility
    //         abive
    ////////////////////////////////////////////////////////////////////////////
    template <typename F>
    bool compare(
        fs::path input_path, fs::path expect_path
      , F f
      , char const* re_prefix = "<%"
      , char const* re_suffix = "%>"
    );

    ////////////////////////////////////////////////////////////////////////////
    // for_each_file
    //
    //      For each *.input and *.expect file in a given directory,
    //      call the function f, passing in the *.input and *.expect paths.
    ////////////////////////////////////////////////////////////////////////////
    template <typename F>
    int for_each_file(fs::path p, F f);

    ////////////////////////////////////////////////////////////////////////////
    // load_file
    //
    //      Load file into a string.
    ////////////////////////////////////////////////////////////////////////////
    std::string load(fs::path p);

    ////////////////////////////////////////////////////////////////////////////
    // Implementation
    ////////////////////////////////////////////////////////////////////////////

    template <typename Iterator>
    inline bool is_regex(
        Iterator& first
      , Iterator last
      , std::string& re
      , char const* re_prefix
      , char const* re_suffix
   )
   {
       boost::regex e(re_prefix + std::string("(.*?)") + re_suffix);
       boost::match_results<Iterator> what;
       if (boost::regex_search(
            first, last, what, e
          , boost::match_default | boost::match_continuous))
        {
            re = what[1].str();
            first = what[0].second;
            return true;
        }
        return false;
    }

    template <typename Range>
    inline compare_result<typename Range::const_iterator>
    compare(
        Range const& in
      , Range const& tem
      , char const* re_prefix
      , char const* re_suffix
    )
    {
       typedef typename Range::const_iterator iter_t;
       typedef compare_result<iter_t> compare_result_t;

       iter_t in_first = in.begin();
       iter_t in_last = in.end();
       iter_t tem_first = tem.begin();
       iter_t tem_last = tem.end();
       std::string re;

       while (in_first != in_last && tem_first != tem_last)
       {
            if (is_regex(tem_first, tem_last, re, re_prefix, re_suffix))
            {
                boost::match_results<iter_t> what;
                boost::regex e(re);
                if (!boost::regex_search(
                    in_first, in_last, what, e
                  , boost::match_default | boost::match_continuous))
                {
                    // RE mismatch: exit now.
                    return compare_result_t(in_first, false);
                }
                else
                {
                    // RE match: gobble the matching string.
                    in_first = what[0].second;
                }
            }
            else
            {
                // Char by char comparison. Exit if we have a mismatch.
                if (*in_first++ != *tem_first++)
                    return compare_result_t(in_first, false);
            }
        }

        // Ignore trailing spaces in template
        bool has_trailing_nonspaces = false;
        while (tem_first != tem_last)
        {
            if (!std::isspace(*tem_first++))
            {
                has_trailing_nonspaces = true;
                break;
            }
        }
        while (in_first != in_last)
        {
            if (!std::isspace(*in_first++))
            {
                has_trailing_nonspaces = true;
                break;
            }
        }
        // return a full match only if the template is fully matched and if there
        // are no more characters to match in the source
        return compare_result_t(in_first, !has_trailing_nonspaces);
   }

    template <typename F>
    inline int for_each_file(fs::path p, F f)
    {
        try
        {
            if (fs::exists(p) && fs::is_directory(p))
            {
                for (auto i = fs::directory_iterator(p); i != fs::directory_iterator(); ++i)
                {
                   auto ext = fs::extension(i->path());
                   if (ext == ".input")
                   {
                      auto input_path = i->path();
                      auto expect_path = input_path;
                      expect_path.replace_extension(".expect");
                      f(input_path, expect_path);
                   }
                }
            }
            else
            {
                std::cerr << "Directory: " << fs::absolute(p) << " does not exist." << std::endl;
                return 1;
            }
        }

        catch (const fs::filesystem_error& ex)
        {
            std::cerr << ex.what() << '\n';
            return 1;
        }
        return 0;
    }

    inline std::string load(fs::path p)
    {
        boost::filesystem::ifstream file(p);
        if (!file)
            return "";
        std::string contents((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        return contents;
    }

    template <typename F>
    inline bool compare(
        fs::path input_path, fs::path expect_path
      , F f
      , char const* re_prefix
      , char const* re_suffix
    )
    {
        std::string output = f(load(input_path), input_path);
        std::string expected = load(expect_path);

        auto result = compare(output, expected);
        if (!result.full_match)
        {
            std::cout << "=============================================" << std::endl;
            std::cout << "==== Mismatch Found:" << std::endl;
            int line = 1;
            int col = 1;
            for (auto i = output.begin(); i != result.pos; ++i)
            {
                if (*i == '\n')
                {
                    line++;
                    col = 0;
                }
                ++col;
            }

            std::cerr
                << "==== File: " << expect_path
                << ", Line: " << line
                << ", Column: " << col
                << std::endl;
            std::cerr << "=============================================" << std::endl;

            // Print output
            std::cerr << output;
            std::cerr << "=============================================" << std::endl;
            std::cerr << "==== End" << std::endl;
            std::cerr << "=============================================" << std::endl;
            return false;
        }
        return true;
    }

}}}}

#endif

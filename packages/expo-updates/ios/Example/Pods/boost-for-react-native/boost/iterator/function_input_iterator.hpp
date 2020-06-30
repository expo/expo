// Copyright 2009 (C) Dean Michael Berris <me@deanberris.com>
// Copyright 2012 (C) Google, Inc.
// Copyright 2012 (C) Jeffrey Lee Hellrung, Jr.
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_FUNCTION_INPUT_ITERATOR
#define BOOST_FUNCTION_INPUT_ITERATOR

#include <boost/assert.hpp>
#include <boost/mpl/if.hpp>
#include <boost/function_types/is_function_pointer.hpp>
#include <boost/function_types/is_function_reference.hpp>
#include <boost/function_types/result_type.hpp>
#include <boost/iterator/iterator_facade.hpp>
#include <boost/none.hpp>
#include <boost/optional/optional.hpp>

namespace boost {

namespace iterators {

    namespace impl {

        template <class Function, class Input>
        class function_input_iterator
            : public iterator_facade<
            function_input_iterator<Function, Input>,
            typename Function::result_type,
            single_pass_traversal_tag,
            typename Function::result_type const &
            >
        {
        public:
            function_input_iterator() {}
            function_input_iterator(Function & f_, Input state_ = Input())
                : f(&f_), state(state_) {}

            void increment() {
                if(value)
                    value = none;
                else
                    (*f)();
                ++state;
            }

            typename Function::result_type const &
                dereference() const {
                    return (value ? value : value = (*f)()).get();
            }

            bool equal(function_input_iterator const & other) const {
                return f == other.f && state == other.state;
            }

        private:
            Function * f;
            Input state;
            mutable optional<typename Function::result_type> value;
        };

        template <class Function, class Input>
        class function_pointer_input_iterator
            : public iterator_facade<
            function_pointer_input_iterator<Function, Input>,
            typename function_types::result_type<Function>::type,
            single_pass_traversal_tag,
            typename function_types::result_type<Function>::type const &
            >
        {
        public:
            function_pointer_input_iterator() {}
            function_pointer_input_iterator(Function &f_, Input state_ = Input())
                : f(f_), state(state_) {}

            void increment() {
                if(value)
                    value = none;
                else
                    (*f)();
                ++state;
            }

            typename function_types::result_type<Function>::type const &
                dereference() const {
                    return (value ? value : value = (*f)()).get();
            }

            bool equal(function_pointer_input_iterator const & other) const {
                return f == other.f && state == other.state;
            }

        private:
            Function f;
            Input state;
            mutable optional<typename function_types::result_type<Function>::type> value;
        };

        template <class Function, class Input>
        class function_reference_input_iterator
            : public function_pointer_input_iterator<Function*,Input>
        {
        public:
            function_reference_input_iterator(Function & f_, Input state_ = Input())
                : function_pointer_input_iterator<Function*,Input>(&f_, state_)
            {}
        };

    } // namespace impl

    template <class Function, class Input>
    class function_input_iterator
        : public mpl::if_<
            function_types::is_function_pointer<Function>,
            impl::function_pointer_input_iterator<Function,Input>,
            typename mpl::if_<
                function_types::is_function_reference<Function>,
                impl::function_reference_input_iterator<Function,Input>,
                impl::function_input_iterator<Function,Input>
            >::type
        >::type
    {
        typedef typename mpl::if_<
            function_types::is_function_pointer<Function>,
            impl::function_pointer_input_iterator<Function,Input>,
            typename mpl::if_<
                function_types::is_function_reference<Function>,
                impl::function_reference_input_iterator<Function,Input>,
                impl::function_input_iterator<Function,Input>
            >::type
        >::type base_type;
    public:
        function_input_iterator(Function & f, Input i)
            : base_type(f, i) {}
    };

    template <class Function, class Input>
    inline function_input_iterator<Function, Input>
        make_function_input_iterator(Function & f, Input state) {
            typedef function_input_iterator<Function, Input> result_t;
            return result_t(f, state);
    }

    template <class Function, class Input>
    inline function_input_iterator<Function*, Input>
        make_function_input_iterator(Function * f, Input state) {
            typedef function_input_iterator<Function*, Input> result_t;
            return result_t(f, state);
    }

    struct infinite {
        infinite & operator++() { return *this; }
        infinite & operator++(int) { return *this; }
        bool operator==(infinite &) const { return false; };
        bool operator==(infinite const &) const { return false; };
    };

} // namespace iterators

using iterators::function_input_iterator;
using iterators::make_function_input_iterator;
using iterators::infinite;

} // namespace boost

#endif


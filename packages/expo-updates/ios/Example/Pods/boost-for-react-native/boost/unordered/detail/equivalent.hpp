
// Copyright (C) 2003-2004 Jeremy B. Maitin-Shepard.
// Copyright (C) 2005-2011 Daniel James
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_UNORDERED_DETAIL_EQUIVALENT_HPP_INCLUDED
#define BOOST_UNORDERED_DETAIL_EQUIVALENT_HPP_INCLUDED

#include <boost/config.hpp>
#if defined(BOOST_HAS_PRAGMA_ONCE)
#pragma once
#endif

#include <boost/unordered/detail/extract_key.hpp>

namespace boost { namespace unordered { namespace detail {

    template <typename A, typename T> struct grouped_node;
    template <typename T> struct grouped_ptr_node;
    template <typename Types> struct grouped_table_impl;

    template <typename A, typename T>
    struct grouped_node :
        boost::unordered::detail::value_base<T>
    {
        typedef typename ::boost::unordered::detail::rebind_wrap<
            A, grouped_node<A, T> >::type allocator;
        typedef typename ::boost::unordered::detail::
            allocator_traits<allocator>::pointer node_pointer;
        typedef node_pointer link_pointer;

        link_pointer next_;
        node_pointer group_prev_;
        std::size_t hash_;

        grouped_node() :
            next_(),
            group_prev_(),
            hash_(0)
        {}

        void init(node_pointer self)
        {
            group_prev_ = self;
        }

    private:
        grouped_node& operator=(grouped_node const&);
    };

    template <typename T>
    struct grouped_ptr_node :
        boost::unordered::detail::ptr_bucket
    {
        typedef T value_type;
        typedef boost::unordered::detail::ptr_bucket bucket_base;
        typedef grouped_ptr_node<T>* node_pointer;
        typedef ptr_bucket* link_pointer;

        node_pointer group_prev_;
        std::size_t hash_;
        boost::unordered::detail::value_base<T> value_base_;

        grouped_ptr_node() :
            bucket_base(),
            group_prev_(0),
            hash_(0)
        {}

        void init(node_pointer self)
        {
            group_prev_ = self;
        }

        void* address() { return value_base_.address(); }
        value_type& value() { return value_base_.value(); }
        value_type* value_ptr() { return value_base_.value_ptr(); }

    private:
        grouped_ptr_node& operator=(grouped_ptr_node const&);
    };

    // If the allocator uses raw pointers use grouped_ptr_node
    // Otherwise use grouped_node.

    template <typename A, typename T, typename NodePtr, typename BucketPtr>
    struct pick_grouped_node2
    {
        typedef boost::unordered::detail::grouped_node<A, T> node;

        typedef typename boost::unordered::detail::allocator_traits<
            typename boost::unordered::detail::rebind_wrap<A, node>::type
        >::pointer node_pointer;

        typedef boost::unordered::detail::bucket<node_pointer> bucket;
        typedef node_pointer link_pointer;
    };

    template <typename A, typename T>
    struct pick_grouped_node2<A, T,
        boost::unordered::detail::grouped_ptr_node<T>*,
        boost::unordered::detail::ptr_bucket*>
    {
        typedef boost::unordered::detail::grouped_ptr_node<T> node;
        typedef boost::unordered::detail::ptr_bucket bucket;
        typedef bucket* link_pointer;
    };

    template <typename A, typename T>
    struct pick_grouped_node
    {
        typedef typename boost::remove_const<T>::type nonconst;

        typedef boost::unordered::detail::allocator_traits<
            typename boost::unordered::detail::rebind_wrap<A,
                boost::unordered::detail::grouped_ptr_node<nonconst> >::type
        > tentative_node_traits;

        typedef boost::unordered::detail::allocator_traits<
            typename boost::unordered::detail::rebind_wrap<A,
                boost::unordered::detail::ptr_bucket >::type
        > tentative_bucket_traits;

        typedef pick_grouped_node2<A, nonconst,
            typename tentative_node_traits::pointer,
            typename tentative_bucket_traits::pointer> pick;

        typedef typename pick::node node;
        typedef typename pick::bucket bucket;
        typedef typename pick::link_pointer link_pointer;
    };

    template <typename Types>
    struct grouped_table_impl : boost::unordered::detail::table<Types>
    {
        typedef boost::unordered::detail::table<Types> table;
        typedef typename table::value_type value_type;
        typedef typename table::bucket bucket;
        typedef typename table::policy policy;
        typedef typename table::node_pointer node_pointer;
        typedef typename table::node_allocator node_allocator;
        typedef typename table::node_allocator_traits node_allocator_traits;
        typedef typename table::bucket_pointer bucket_pointer;
        typedef typename table::link_pointer link_pointer;
        typedef typename table::hasher hasher;
        typedef typename table::key_equal key_equal;
        typedef typename table::key_type key_type;
        typedef typename table::node_constructor node_constructor;
        typedef typename table::node_tmp node_tmp;
        typedef typename table::extractor extractor;
        typedef typename table::iterator iterator;
        typedef typename table::c_iterator c_iterator;

        // Constructors

        grouped_table_impl(std::size_t n,
                hasher const& hf,
                key_equal const& eq,
                node_allocator const& a)
          : table(n, hf, eq, a)
        {}

        grouped_table_impl(grouped_table_impl const& x)
          : table(x, node_allocator_traits::
                select_on_container_copy_construction(x.node_alloc()))
        {
            this->init(x);
        }

        grouped_table_impl(grouped_table_impl const& x,
                node_allocator const& a)
          : table(x, a)
        {
            this->init(x);
        }

        grouped_table_impl(grouped_table_impl& x,
                boost::unordered::detail::move_tag m)
          : table(x, m)
        {}

        grouped_table_impl(grouped_table_impl& x,
                node_allocator const& a,
                boost::unordered::detail::move_tag m)
          : table(x, a, m)
        {
            this->move_init(x);
        }

        // Node functions.

        static inline node_pointer next_node(link_pointer n) {
            return static_cast<node_pointer>(n->next_);
        }

        static inline node_pointer next_group(node_pointer n) {
            return static_cast<node_pointer>(n->group_prev_->next_);
        }

        // Accessors

        template <class Key, class Pred>
        node_pointer find_node_impl(
                std::size_t key_hash,
                Key const& k,
                Pred const& eq) const
        {
            std::size_t bucket_index = this->hash_to_bucket(key_hash);
            node_pointer n = this->begin(bucket_index);

            for (;;)
            {
                if (!n) return n;

                std::size_t node_hash = n->hash_;
                if (key_hash == node_hash)
                {
                    if (eq(k, this->get_key(n->value())))
                        return n;
                }
                else
                {
                    if (this->hash_to_bucket(node_hash) != bucket_index)
                        return node_pointer();
                }

                n = next_group(n);
            }
        }

        std::size_t count(key_type const& k) const
        {
            node_pointer n = this->find_node(k);
            if (!n) return 0;

            std::size_t x = 0;
            node_pointer it = n;
            do {
                it = it->group_prev_;
                ++x;
            } while(it != n);

            return x;
        }

        std::pair<iterator, iterator>
            equal_range(key_type const& k) const
        {
            node_pointer n = this->find_node(k);
            return std::make_pair(iterator(n), iterator(n ? next_group(n) : n));
        }

        // Equality

        bool equals(grouped_table_impl const& other) const
        {
            if(this->size_ != other.size_) return false;
    
            for(node_pointer n1 = this->begin(); n1;)
            {
                node_pointer n2 = other.find_node(other.get_key(n1->value()));
                if (!n2) return false;
                node_pointer end1 = next_group(n1);
                node_pointer end2 = next_group(n2);
                if (!group_equals(n1, end1, n2, end2)) return false;
                n1 = end1;    
            }
    
            return true;
        }

        static bool group_equals(node_pointer n1, node_pointer end1,
                node_pointer n2, node_pointer end2)
        {
            for(;;)
            {
                if (n1->value() != n2->value()) break;

                n1 = next_node(n1);
                n2 = next_node(n2);
            
                if (n1 == end1) return n2 == end2;
                if (n2 == end2) return false;
            }
            
            for(node_pointer n1a = n1, n2a = n2;;)
            {
                n1a = next_node(n1a);
                n2a = next_node(n2a);

                if (n1a == end1)
                {
                    if (n2a == end2) break;
                    else return false;
                }

                if (n2a == end2) return false;
            }

            node_pointer start = n1;
            for(;n1 != end1; n1 = next_node(n1))
            {
                value_type const& v = n1->value();
                if (!find(start, n1, v)) {
                    std::size_t matches = count_equal(n2, end2, v);
                    if (!matches) return false;
                    if (matches != 1 + count_equal(next_node(n1), end1, v)) return false;
                }
            }
            
            return true;
        }

        static bool find(node_pointer n, node_pointer end, value_type const& v)
        {
            for(;n != end; n = next_node(n))
                if (n->value() == v)
                    return true;
            return false;
        }

        static std::size_t count_equal(node_pointer n, node_pointer end,
            value_type const& v)
        {
            std::size_t count = 0;
            for(;n != end; n = next_node(n))
                if (n->value() == v) ++count;
            return count;
        }

        // Emplace/Insert

        // Add node 'n' to the group containing 'pos'.
        // If 'pos' is the first node in group, add to the end of the group,
        // otherwise add before 'pos'.
        static inline void add_to_node_group(
                node_pointer n,
                node_pointer pos)
        {
            n->next_ = pos->group_prev_->next_;
            n->group_prev_ = pos->group_prev_;
            pos->group_prev_->next_ = n;
            pos->group_prev_ = n;
        }

        inline node_pointer add_node(
                node_pointer n,
                std::size_t key_hash,
                node_pointer pos)
        {
            n->hash_ = key_hash;
            if (pos) {
                this->add_to_node_group(n, pos);
                if (n->next_) {
                    std::size_t next_bucket = this->hash_to_bucket(
                        next_node(n)->hash_);
                    if (next_bucket != this->hash_to_bucket(key_hash)) {
                        this->get_bucket(next_bucket)->next_ = n;
                    }
                }
            }
            else {
                bucket_pointer b = this->get_bucket(
                    this->hash_to_bucket(key_hash));

                if (!b->next_)
                {
                    link_pointer start_node = this->get_previous_start();
                    
                    if (start_node->next_) {
                        this->get_bucket(this->hash_to_bucket(
                            next_node(start_node)->hash_
                        ))->next_ = n;
                    }
    
                    b->next_ = start_node;
                    n->next_ = start_node->next_;
                    start_node->next_ = n;
                }
                else
                {
                    n->next_ = b->next_->next_;
                    b->next_->next_ = n;
                }
            }
            ++this->size_;
            return n;
        }

        inline node_pointer add_using_hint(
                node_pointer n,
                node_pointer hint)
        {
            n->hash_ = hint->hash_;
            this->add_to_node_group(n, hint);
            if (n->next_ != hint && n->next_) {
                std::size_t next_bucket = this->hash_to_bucket(
                    next_node(n)->hash_);
                if (next_bucket != this->hash_to_bucket(n->hash_)) {
                    this->get_bucket(next_bucket)->next_ = n;
                }
            }
            ++this->size_;
            return n;
        }


#if defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
#   if defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)
        iterator emplace(boost::unordered::detail::emplace_args1<
                boost::unordered::detail::please_ignore_this_overload> const&)
        {
            BOOST_ASSERT(false);
            return iterator();
        }

        iterator emplace_hint(c_iterator, boost::unordered::detail::emplace_args1<
                boost::unordered::detail::please_ignore_this_overload> const&)
        {
            BOOST_ASSERT(false);
            return iterator();
        }
#   else
        iterator emplace(
                boost::unordered::detail::please_ignore_this_overload const&)
        {
            BOOST_ASSERT(false);
            return iterator();
        }

        iterator emplace_hint(c_iterator,
                boost::unordered::detail::please_ignore_this_overload const&)
        {
            BOOST_ASSERT(false);
            return iterator();
        }
#   endif
#endif

        template <BOOST_UNORDERED_EMPLACE_TEMPLATE>
        iterator emplace(BOOST_UNORDERED_EMPLACE_ARGS)
        {
            return iterator(emplace_impl(
                boost::unordered::detail::func::construct_node_from_args(
                    this->node_alloc(), BOOST_UNORDERED_EMPLACE_FORWARD)));
        }

        template <BOOST_UNORDERED_EMPLACE_TEMPLATE>
        iterator emplace_hint(c_iterator hint, BOOST_UNORDERED_EMPLACE_ARGS)
        {
            return iterator(emplace_hint_impl(hint,
                boost::unordered::detail::func::construct_node_from_args(
                    this->node_alloc(), BOOST_UNORDERED_EMPLACE_FORWARD)));
        }

        iterator emplace_impl(node_pointer n)
        {
            node_tmp a(n, this->node_alloc());
            key_type const& k = this->get_key(a.node_->value());
            std::size_t key_hash = this->hash(k);
            node_pointer position = this->find_node(key_hash, k);
            this->reserve_for_insert(this->size_ + 1);
            return iterator(this->add_node(a.release(), key_hash, position));
        }

        iterator emplace_hint_impl(c_iterator hint, node_pointer n)
        {
            node_tmp a(n, this->node_alloc());
            key_type const& k = this->get_key(a.node_->value());
            if (hint.node_ && this->key_eq()(k, this->get_key(*hint))) {
                this->reserve_for_insert(this->size_ + 1);
                return iterator(this->add_using_hint(a.release(), hint.node_));
            }
            else {
                std::size_t key_hash = this->hash(k);
                node_pointer position = this->find_node(key_hash, k);
                this->reserve_for_insert(this->size_ + 1);
                return iterator(this->add_node(a.release(), key_hash, position));
            }
        }

        void emplace_impl_no_rehash(node_pointer n)
        {
            node_tmp a(n, this->node_alloc());
            key_type const& k = this->get_key(a.node_->value());
            std::size_t key_hash = this->hash(k);
            node_pointer position = this->find_node(key_hash, k);
            this->add_node(a.release(), key_hash, position);
        }

        ////////////////////////////////////////////////////////////////////////
        // Insert range methods

        // if hash function throws, or inserting > 1 element, basic exception
        // safety. Strong otherwise
        template <class I>
        void insert_range(I i, I j, typename
            boost::unordered::detail::enable_if_forward<I, void*>::type = 0)
        {
            if(i == j) return;

            std::size_t distance = static_cast<std::size_t>(std::distance(i, j));
            if(distance == 1) {
                emplace_impl(
                    boost::unordered::detail::func::construct_node(
                        this->node_alloc(), *i));
            }
            else {
                // Only require basic exception safety here
                this->reserve_for_insert(this->size_ + distance);

                for (; i != j; ++i) {
                    emplace_impl_no_rehash(
                        boost::unordered::detail::func::construct_node(
                            this->node_alloc(), *i));
                }
            }
        }

        template <class I>
        void insert_range(I i, I j, typename
            boost::unordered::detail::disable_if_forward<I, void*>::type = 0)
        {
            for (; i != j; ++i) {
                emplace_impl(
                    boost::unordered::detail::func::construct_node(
                        this->node_alloc(), *i));
            }
        }

        ////////////////////////////////////////////////////////////////////////
        // Erase
        //
        // no throw

        std::size_t erase_key(key_type const& k)
        {
            if(!this->size_) return 0;

            std::size_t key_hash = this->hash(k);
            std::size_t bucket_index = this->hash_to_bucket(key_hash);
            link_pointer prev = this->get_previous_start(bucket_index);
            if (!prev) return 0;

            node_pointer first_node;

            for (;;)
            {
                if (!prev->next_) return 0;
                first_node = next_node(prev);
                std::size_t node_hash = first_node->hash_;
                if (this->hash_to_bucket(node_hash) != bucket_index)
                    return 0;
                if (node_hash == key_hash &&
                    this->key_eq()(k, this->get_key(first_node->value())))
                    break;
                prev = first_node->group_prev_;
            }

            link_pointer end = first_node->group_prev_->next_;

            std::size_t deleted_count = this->delete_nodes(prev, end);
            this->fix_bucket(bucket_index, prev);
            return deleted_count;
        }

        iterator erase(c_iterator r)
        {
            BOOST_ASSERT(r.node_);
            node_pointer next = next_node(r.node_);
            erase_nodes(r.node_, next);
            return iterator(next);
        }

        iterator erase_range(c_iterator r1, c_iterator r2)
        {
            if (r1 == r2) return iterator(r2.node_);
            erase_nodes(r1.node_, r2.node_);
            return iterator(r2.node_);
        }

        link_pointer erase_nodes(node_pointer i, node_pointer j)
        {
            std::size_t bucket_index = this->hash_to_bucket(i->hash_);

            // Split the groups containing 'i' and 'j'.
            // And get the pointer to the node before i while
            // we're at it.
            link_pointer prev = split_groups(i, j);

            // If we don't have a 'prev' it means that i is at the
            // beginning of a block, so search through the blocks in the
            // same bucket.
            if (!prev) {
                prev = this->get_previous_start(bucket_index);
                while (prev->next_ != i)
                    prev = next_node(prev)->group_prev_;
            }

            // Delete the nodes.
            do {
                link_pointer group_end = next_group(next_node(prev));
                this->delete_nodes(prev, group_end);
                bucket_index = this->fix_bucket(bucket_index, prev);
            } while(prev->next_ != j);

            return prev;
        }

        static link_pointer split_groups(node_pointer i, node_pointer j)
        {
            node_pointer prev = i->group_prev_;
            if (prev->next_ != i) prev = node_pointer();

            if (j) {
                node_pointer first = j;
                while (first != i && first->group_prev_->next_ == first) {
                    first = first->group_prev_;
                }

                boost::swap(first->group_prev_, j->group_prev_);
                if (first == i) return prev;
            }

            if (prev) {
                node_pointer first = prev;
                while (first->group_prev_->next_ == first) {
                    first = first->group_prev_;
                }
                boost::swap(first->group_prev_, i->group_prev_);
            }

            return prev;
        }

        ////////////////////////////////////////////////////////////////////////
        // fill_buckets

        void copy_buckets(table const& src) {
            this->create_buckets(this->bucket_count_);

            for (node_pointer n = src.begin(); n;) {
                std::size_t key_hash = n->hash_;
                node_pointer group_end(next_group(n));
                node_pointer pos = this->add_node(
                    boost::unordered::detail::func::construct_node(
                        this->node_alloc(), n->value()), key_hash, node_pointer());
                for (n = next_node(n); n != group_end; n = next_node(n))
                {
                    this->add_node(
                        boost::unordered::detail::func::construct_node(
                            this->node_alloc(), n->value()), key_hash, pos);
                }
            }
        }

        void move_buckets(table const& src) {
            this->create_buckets(this->bucket_count_);

            for (node_pointer n = src.begin(); n;) {
                std::size_t key_hash = n->hash_;
                node_pointer group_end(next_group(n));
                node_pointer pos = this->add_node(
                    boost::unordered::detail::func::construct_node(
                        this->node_alloc(), boost::move(n->value())), key_hash, node_pointer());
                for (n = next_node(n); n != group_end; n = next_node(n))
                {
                    this->add_node(
                        boost::unordered::detail::func::construct_node(
                            this->node_alloc(), boost::move(n->value())), key_hash, pos);
                }
            }
        }

        void assign_buckets(table const& src) {
            node_holder<node_allocator> holder(*this);
            for (node_pointer n = src.begin(); n;) {
                std::size_t key_hash = n->hash_;
                node_pointer group_end(next_group(n));
                node_pointer pos = this->add_node(holder.copy_of(n->value()), key_hash, node_pointer());
                for (n = next_node(n); n != group_end; n = next_node(n))
                {
                    this->add_node(holder.copy_of(n->value()), key_hash, pos);
                }
            }
        }

        void move_assign_buckets(table& src) {
            node_holder<node_allocator> holder(*this);
            for (node_pointer n = src.begin(); n;) {
                std::size_t key_hash = n->hash_;
                node_pointer group_end(next_group(n));
                node_pointer pos = this->add_node(holder.move_copy_of(n->value()), key_hash, node_pointer());
                for (n = next_node(n); n != group_end; n = next_node(n))
                {
                    this->add_node(holder.move_copy_of(n->value()), key_hash, pos);
                }
            }
        }

        // strong otherwise exception safety
        void rehash_impl(std::size_t num_buckets)
        {
            BOOST_ASSERT(this->buckets_);

            this->create_buckets(num_buckets);
            link_pointer prev = this->get_previous_start();
            while (prev->next_)
                prev = place_in_bucket(*this, prev, next_node(prev)->group_prev_);
        }

        // Iterate through the nodes placing them in the correct buckets.
        // pre: prev->next_ is not null.
        static link_pointer place_in_bucket(table& dst,
                link_pointer prev, node_pointer end)
        {
            bucket_pointer b = dst.get_bucket(dst.hash_to_bucket(end->hash_));

            if (!b->next_) {
                b->next_ = prev;
                return end;
            }
            else {
                link_pointer next = end->next_;
                end->next_ = b->next_->next_;
                b->next_->next_ = prev->next_;
                prev->next_ = next;
                return prev;
            }
        }
    };
}}}

#endif

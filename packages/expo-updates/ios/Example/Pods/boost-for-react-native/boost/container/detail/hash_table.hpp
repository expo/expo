/*
template <class Value, unsigned int Options = 0, class Hash = hash<Value>, class Pred = equal_to<Value>,
          class Allocator = allocator<Value> >
class hash_set
{
public:
    // types
    typedef Value                                                      key_type;
    typedef key_type                                                   value_type;
    typedef Hash                                                       hasher;
    typedef Pred                                                       key_equal;
    typedef Allocator                                                      allocator_type;
    typedef value_type&                                                reference;
    typedef const value_type&                                          const_reference;
    typedef typename allocator_traits<allocator_type>::pointer         pointer;
    typedef typename allocator_traits<allocator_type>::const_pointer   const_pointer;
    typedef typename allocator_traits<allocator_type>::size_type       size_type;
    typedef typename allocator_traits<allocator_type>::difference_type difference_type;

    typedef /unspecified/ iterator;
    typedef /unspecified/ const_iterator;
    typedef /unspecified/ local_iterator;
    typedef /unspecified/ const_local_iterator;

    hash_set()
        noexcept(
            is_nothrow_default_constructible<hasher>::value &&
            is_nothrow_default_constructible<key_equal>::value &&
            is_nothrow_default_constructible<allocator_type>::value);
    explicit hash_set(size_type n, const hasher& hf = hasher(),
                           const key_equal& eql = key_equal(),
                           const allocator_type& a = allocator_type());
    template <class InputIterator>
        hash_set(InputIterator f, InputIterator l,
                      size_type n = 0, const hasher& hf = hasher(),
                      const key_equal& eql = key_equal(),
                      const allocator_type& a = allocator_type());
    explicit hash_set(const allocator_type&);
    hash_set(const hash_set&);
    hash_set(const hash_set&, const Allocator&);
    hash_set(hash_set&&)
        noexcept(
            is_nothrow_move_constructible<hasher>::value &&
            is_nothrow_move_constructible<key_equal>::value &&
            is_nothrow_move_constructible<allocator_type>::value);
    hash_set(hash_set&&, const Allocator&);
    hash_set(initializer_list<value_type>, size_type n = 0,
                  const hasher& hf = hasher(), const key_equal& eql = key_equal(),
                  const allocator_type& a = allocator_type());
    ~hash_set();
    hash_set& operator=(const hash_set&);
    hash_set& operator=(hash_set&&)
        noexcept(
            allocator_type::propagate_on_container_move_assignment::value &&
            is_nothrow_move_assignable<allocator_type>::value &&
            is_nothrow_move_assignable<hasher>::value &&
            is_nothrow_move_assignable<key_equal>::value);
    hash_set& operator=(initializer_list<value_type>);

    allocator_type get_allocator() const noexcept;

    bool      empty() const noexcept;
    size_type size() const noexcept;
    size_type max_size() const noexcept;

    iterator       begin() noexcept;
    iterator       end() noexcept;
    const_iterator begin()  const noexcept;
    const_iterator end()    const noexcept;
    const_iterator cbegin() const noexcept;
    const_iterator cend()   const noexcept;

    template <class... Args>
        pair<iterator, bool> emplace(BOOST_FWD_REF(Args)... args);
    template <class... Args>
        iterator emplace_hint(const_iterator position, BOOST_FWD_REF(Args)... args);
    pair<iterator, bool> insert(const value_type& obj);
    pair<iterator, bool> insert(value_type&& obj);
    iterator insert(const_iterator hint, const value_type& obj);
    iterator insert(const_iterator hint, value_type&& obj);
    template <class InputIterator>
        void insert(InputIterator first, InputIterator last);
    void insert(initializer_list<value_type>);

    iterator erase(const_iterator position);
    size_type erase(const key_type& k);
    iterator erase(const_iterator first, const_iterator last);
    void clear() noexcept;

    void swap(hash_set&)
        noexcept(
            (!allocator_type::propagate_on_container_swap::value ||
             __is_nothrow_swappable<allocator_type>::value) &&
            __is_nothrow_swappable<hasher>::value &&
            __is_nothrow_swappable<key_equal>::value);

    hasher hash_function() const;
    key_equal key_eq() const;

    iterator       find(const key_type& k);
    const_iterator find(const key_type& k) const;
    size_type count(const key_type& k) const;
    pair<iterator, iterator>             equal_range(const key_type& k);
    pair<const_iterator, const_iterator> equal_range(const key_type& k) const;

    size_type bucket_count() const noexcept;
    size_type max_bucket_count() const noexcept;

    size_type bucket_size(size_type n) const;
    size_type bucket(const key_type& k) const;

    local_iterator       begin(size_type n);
    local_iterator       end(size_type n);
    const_local_iterator begin(size_type n) const;
    const_local_iterator end(size_type n) const;
    const_local_iterator cbegin(size_type n) const;
    const_local_iterator cend(size_type n) const;

    float load_factor() const noexcept;
    float max_load_factor() const noexcept;
    void max_load_factor(float z);
    void rehash(size_type n);
    void reserve(size_type n);
};

template <class Key, class T, unsigned int Options = 0, class Hash = hash<Key>, class Pred = equal_to<Key>,
          class Allocator = allocator<pair<const Key, T> > >
class hash_map
{
public:
    // types
    typedef Key                                                        key_type;
    typedef T                                                          mapped_type;
    typedef Hash                                                       hasher;
    typedef Pred                                                       key_equal;
    typedef Allocator                                                      allocator_type;
    typedef pair<const key_type, mapped_type>                          value_type;
    typedef value_type&                                                reference;
    typedef const value_type&                                          const_reference;
    typedef typename allocator_traits<allocator_type>::pointer         pointer;
    typedef typename allocator_traits<allocator_type>::const_pointer   const_pointer;
    typedef typename allocator_traits<allocator_type>::size_type       size_type;
    typedef typename allocator_traits<allocator_type>::difference_type difference_type;

    typedef /unspecified/ iterator;
    typedef /unspecified/ const_iterator;
    typedef /unspecified/ local_iterator;
    typedef /unspecified/ const_local_iterator;

    hash_map()
        noexcept(
            is_nothrow_default_constructible<hasher>::value &&
            is_nothrow_default_constructible<key_equal>::value &&
            is_nothrow_default_constructible<allocator_type>::value);
    explicit hash_map(size_type n, const hasher& hf = hasher(),
                           const key_equal& eql = key_equal(),
                           const allocator_type& a = allocator_type());
    template <class InputIterator>
        hash_map(InputIterator f, InputIterator l,
                      size_type n = 0, const hasher& hf = hasher(),
                      const key_equal& eql = key_equal(),
                      const allocator_type& a = allocator_type());
    explicit hash_map(const allocator_type&);
    hash_map(const hash_map&);
    hash_map(const hash_map&, const Allocator&);
    hash_map(hash_map&&)
        noexcept(
            is_nothrow_move_constructible<hasher>::value &&
            is_nothrow_move_constructible<key_equal>::value &&
            is_nothrow_move_constructible<allocator_type>::value);
    hash_map(hash_map&&, const Allocator&);
    hash_map(initializer_list<value_type>, size_type n = 0,
                  const hasher& hf = hasher(), const key_equal& eql = key_equal(),
                  const allocator_type& a = allocator_type());
    ~hash_map();
    hash_map& operator=(const hash_map&);
    hash_map& operator=(hash_map&&)
        noexcept(
            allocator_type::propagate_on_container_move_assignment::value &&
            is_nothrow_move_assignable<allocator_type>::value &&
            is_nothrow_move_assignable<hasher>::value &&
            is_nothrow_move_assignable<key_equal>::value);
    hash_map& operator=(initializer_list<value_type>);

    allocator_type get_allocator() const noexcept;

    bool      empty() const noexcept;
    size_type size() const noexcept;
    size_type max_size() const noexcept;

    iterator       begin() noexcept;
    iterator       end() noexcept;
    const_iterator begin()  const noexcept;
    const_iterator end()    const noexcept;
    const_iterator cbegin() const noexcept;
    const_iterator cend()   const noexcept;

    template <class... Args>
        pair<iterator, bool> emplace(BOOST_FWD_REF(Args)... args);
    template <class... Args>
        iterator emplace_hint(const_iterator position, BOOST_FWD_REF(Args)... args);
    pair<iterator, bool> insert(const value_type& obj);
    template <class P>
        pair<iterator, bool> insert(P&& obj);
    iterator insert(const_iterator hint, const value_type& obj);
    template <class P>
        iterator insert(const_iterator hint, P&& obj);
    template <class InputIterator>
        void insert(InputIterator first, InputIterator last);
    void insert(initializer_list<value_type>);

    iterator erase(const_iterator position);
    size_type erase(const key_type& k);
    iterator erase(const_iterator first, const_iterator last);
    void clear() noexcept;

    void swap(hash_map&)
        noexcept(
            (!allocator_type::propagate_on_container_swap::value ||
             __is_nothrow_swappable<allocator_type>::value) &&
            __is_nothrow_swappable<hasher>::value &&
            __is_nothrow_swappable<key_equal>::value);

    hasher hash_function() const;
    key_equal key_eq() const;

    iterator       find(const key_type& k);
    const_iterator find(const key_type& k) const;
    size_type count(const key_type& k) const;
    pair<iterator, iterator>             equal_range(const key_type& k);
    pair<const_iterator, const_iterator> equal_range(const key_type& k) const;

    mapped_type& operator[](const key_type& k);
    mapped_type& operator[](key_type&& k);

    mapped_type&       at(const key_type& k);
    const mapped_type& at(const key_type& k) const;

    size_type bucket_count() const noexcept;
    size_type max_bucket_count() const noexcept;

    size_type bucket_size(size_type n) const;
    size_type bucket(const key_type& k) const;

    local_iterator       begin(size_type n);
    local_iterator       end(size_type n);
    const_local_iterator begin(size_type n) const;
    const_local_iterator end(size_type n) const;
    const_local_iterator cbegin(size_type n) const;
    const_local_iterator cend(size_type n) const;

    float load_factor() const noexcept;
    float max_load_factor() const noexcept;
    void max_load_factor(float z);
    void rehash(size_type n);
    void reserve(size_type n);
};

*/

template <class Key, class Value, class KeyOfValue, unsigned int Options = 0, class Hash = hash<Key>, class Pred = equal_to<Key>,
          class Allocator = allocator<Value> >
class hash_table
{
public:
    // types
    typedef Value                                                      key_type;
    typedef key_type                                                   value_type;
    typedef Hash                                                       hasher;
    typedef Pred                                                       key_equal;
    typedef Allocator                                                      allocator_type;
    typedef value_type&                                                reference;
    typedef const value_type&                                          const_reference;
    typedef typename allocator_traits<allocator_type>::pointer         pointer;
    typedef typename allocator_traits<allocator_type>::const_pointer   const_pointer;
    typedef typename allocator_traits<allocator_type>::size_type       size_type;
    typedef typename allocator_traits<allocator_type>::difference_type difference_type;

    typedef /unspecified/ iterator;
    typedef /unspecified/ const_iterator;
    typedef /unspecified/ local_iterator;
    typedef /unspecified/ const_local_iterator;

    hash_set()
        noexcept(
            is_nothrow_default_constructible<hasher>::value &&
            is_nothrow_default_constructible<key_equal>::value &&
            is_nothrow_default_constructible<allocator_type>::value);
    explicit hash_set(size_type n, const hasher& hf = hasher(),
                           const key_equal& eql = key_equal(),
                           const allocator_type& a = allocator_type());
    template <class InputIterator>
        hash_set(InputIterator f, InputIterator l,
                      size_type n = 0, const hasher& hf = hasher(),
                      const key_equal& eql = key_equal(),
                      const allocator_type& a = allocator_type());
    explicit hash_set(const allocator_type&);
    hash_set(const hash_set&);
    hash_set(const hash_set&, const Allocator&);
    hash_set(hash_set&&)
        noexcept(
            is_nothrow_move_constructible<hasher>::value &&
            is_nothrow_move_constructible<key_equal>::value &&
            is_nothrow_move_constructible<allocator_type>::value);
    hash_set(hash_set&&, const Allocator&);
    hash_set(initializer_list<value_type>, size_type n = 0,
                  const hasher& hf = hasher(), const key_equal& eql = key_equal(),
                  const allocator_type& a = allocator_type());
    ~hash_set();
    hash_set& operator=(const hash_set&);
    hash_set& operator=(hash_set&&)
        noexcept(
            allocator_type::propagate_on_container_move_assignment::value &&
            is_nothrow_move_assignable<allocator_type>::value &&
            is_nothrow_move_assignable<hasher>::value &&
            is_nothrow_move_assignable<key_equal>::value);
    hash_set& operator=(initializer_list<value_type>);

    allocator_type get_allocator() const noexcept;

    bool      empty() const noexcept;
    size_type size() const noexcept;
    size_type max_size() const noexcept;

    iterator       begin() noexcept;
    iterator       end() noexcept;
    const_iterator begin()  const noexcept;
    const_iterator end()    const noexcept;
    const_iterator cbegin() const noexcept;
    const_iterator cend()   const noexcept;

    template <class... Args>
        pair<iterator, bool> emplace(BOOST_FWD_REF(Args)... args);
    template <class... Args>
        iterator emplace_hint(const_iterator position, BOOST_FWD_REF(Args)... args);
    pair<iterator, bool> insert(const value_type& obj);
    pair<iterator, bool> insert(value_type&& obj);
    iterator insert(const_iterator hint, const value_type& obj);
    iterator insert(const_iterator hint, value_type&& obj);
    template <class InputIterator>
        void insert(InputIterator first, InputIterator last);
    void insert(initializer_list<value_type>);

    iterator erase(const_iterator position);
    size_type erase(const key_type& k);
    iterator erase(const_iterator first, const_iterator last);
    void clear() noexcept;

    void swap(hash_set&)
        noexcept(
            (!allocator_type::propagate_on_container_swap::value ||
             __is_nothrow_swappable<allocator_type>::value) &&
            __is_nothrow_swappable<hasher>::value &&
            __is_nothrow_swappable<key_equal>::value);

    hasher hash_function() const;
    key_equal key_eq() const;

    iterator       find(const key_type& k);
    const_iterator find(const key_type& k) const;
    size_type count(const key_type& k) const;
    pair<iterator, iterator>             equal_range(const key_type& k);
    pair<const_iterator, const_iterator> equal_range(const key_type& k) const;

    size_type bucket_count() const noexcept;
    size_type max_bucket_count() const noexcept;

    size_type bucket_size(size_type n) const;
    size_type bucket(const key_type& k) const;

    local_iterator       begin(size_type n);
    local_iterator       end(size_type n);
    const_local_iterator begin(size_type n) const;
    const_local_iterator end(size_type n) const;
    const_local_iterator cbegin(size_type n) const;
    const_local_iterator cend(size_type n) const;

    float load_factor() const noexcept;
    float max_load_factor() const noexcept;
    void max_load_factor(float z);
    void rehash(size_type n);
    void reserve(size_type n);
};

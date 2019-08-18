//=======================================================================
// Copyright 2002 Indiana University.
// Authors: Andrew Lumsdaine, Lie-Quan Lee, Jeremy G. Siek
//
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//=======================================================================

#ifndef BOOST_GRAPH_TEST_HPP
#define BOOST_GRAPH_TEST_HPP

#include <vector>
#include <boost/test/minimal.hpp>
#include <boost/graph/filtered_graph.hpp>
#include <boost/graph/iteration_macros.hpp>
#include <boost/graph/isomorphism.hpp>
#include <boost/graph/copy.hpp>
#include <boost/graph/graph_utility.hpp> // for connects
#include <boost/range.hpp>
#include <boost/range/algorithm/find_if.hpp>


// UNDER CONSTRUCTION 

namespace boost {

  template <typename Graph>
  struct graph_test
  {
  
    typedef typename graph_traits<Graph>::vertex_descriptor vertex_t;
    typedef typename graph_traits<Graph>::edge_descriptor edge_t;
    typedef typename graph_traits<Graph>::vertices_size_type v_size_t;
    typedef typename graph_traits<Graph>::degree_size_type deg_size_t;
    typedef typename graph_traits<Graph>::edges_size_type e_size_t;
    typedef typename graph_traits<Graph>::out_edge_iterator out_edge_iter;
    typedef typename property_map<Graph, vertex_index_t>::type index_map_t;
    typedef iterator_property_map<typename std::vector<vertex_t>::iterator,
      index_map_t,vertex_t,vertex_t&> IsoMap;

    struct ignore_vertex {
      ignore_vertex() { }
      ignore_vertex(vertex_t v) : v(v) { }
      bool operator()(vertex_t x) const { return x != v; }
      vertex_t v;
    };
    struct ignore_edge {
      ignore_edge() { }
      ignore_edge(edge_t e) : e(e) { }
      bool operator()(edge_t x) const { return x != e; }
      edge_t e;
    };
    struct ignore_edges {
      ignore_edges(vertex_t s, vertex_t t, const Graph& g) 
        : s(s), t(t), g(g) { }
      bool operator()(edge_t x) const { 
        return !(source(x, g) == s && target(x, g) == t);
      }
      vertex_t s; vertex_t t; const Graph& g;
    };

    //=========================================================================
    // Traversal Operations

    void test_incidence_graph
       (const std::vector<vertex_t>& vertex_set,
        const std::vector< std::pair<vertex_t, vertex_t> >& edge_set,
        const Graph& g)
    {
      typedef typename std::vector<vertex_t>::const_iterator vertex_iter;
      typedef typename std::vector< std::pair<vertex_t, vertex_t> >
        ::const_iterator edge_iter;
      typedef typename graph_traits<Graph>::out_edge_iterator out_edge_iter;

      for (vertex_iter ui = vertex_set.begin(); ui != vertex_set.end(); ++ui) {
        vertex_t u = *ui;
        std::vector<vertex_t> adj;
        for (edge_iter e = edge_set.begin(); e != edge_set.end(); ++e)
          if (e->first == u)
            adj.push_back(e->second);
        
        std::pair<out_edge_iter, out_edge_iter> p = out_edges(u, g);
        BOOST_CHECK(out_degree(u, g) == adj.size());
        BOOST_CHECK(deg_size_t(std::distance(p.first, p.second))
                   == out_degree(u, g));
        for (; p.first != p.second; ++p.first) {
          edge_t e = *p.first;
          BOOST_CHECK(source(e, g) == u);
          BOOST_CHECK(container_contains(adj, target(e, g)) == true);
        }
      }
    }

    void test_bidirectional_graph
      (const std::vector<vertex_t>& vertex_set,
       const std::vector< std::pair<vertex_t, vertex_t> >& edge_set,
       const Graph& g)
    {
      typedef typename std::vector<vertex_t>::const_iterator vertex_iter;
      typedef typename std::vector< std::pair<vertex_t, vertex_t> >
        ::const_iterator edge_iter;
      typedef typename graph_traits<Graph>::in_edge_iterator in_edge_iter;

      for (vertex_iter vi = vertex_set.begin(); vi != vertex_set.end(); ++vi) {
        vertex_t v = *vi;
        std::vector<vertex_t> inv_adj;
        for (edge_iter e = edge_set.begin(); e != edge_set.end(); ++e)
          if (e->second == v)
            inv_adj.push_back(e->first);

        std::pair<in_edge_iter, in_edge_iter> p = in_edges(v, g);
        BOOST_CHECK(in_degree(v, g) == inv_adj.size());
        BOOST_CHECK(deg_size_t(std::distance(p.first, p.second))
                   == in_degree(v, g));
        for (; p.first != p.second; ++p.first) {
          edge_t e = *p.first;
          BOOST_CHECK(target(e, g) == v);
          BOOST_CHECK(container_contains(inv_adj, source(e, g)) == true);
        }
      }
    }

    void test_adjacency_graph
      (const std::vector<vertex_t>& vertex_set,
       const std::vector< std::pair<vertex_t,vertex_t> >& edge_set,
       const Graph& g)
    {
      typedef typename std::vector<vertex_t>::const_iterator vertex_iter;
      typedef typename std::vector<std::pair<vertex_t,vertex_t> >
        ::const_iterator edge_iter;
      typedef typename graph_traits<Graph>::adjacency_iterator adj_iter;

      for (vertex_iter ui = vertex_set.begin(); ui != vertex_set.end(); ++ui) {
        vertex_t u = *ui;
        std::vector<vertex_t> adj;
        for (edge_iter e = edge_set.begin(); e != edge_set.end(); ++e)
          if (e->first == u)
            adj.push_back(e->second);

        std::pair<adj_iter, adj_iter> p = adjacent_vertices(u, g);
        BOOST_CHECK(deg_size_t(std::distance(p.first, p.second)) == adj.size());
        for (; p.first != p.second; ++p.first) {
          vertex_t v = *p.first;
          BOOST_CHECK(container_contains(adj, v) == true);
        }
      }
    }      

    void test_vertex_list_graph
      (const std::vector<vertex_t>& vertex_set, const Graph& g)
    {
      typedef typename graph_traits<Graph>::vertex_iterator v_iter;
      std::pair<v_iter, v_iter> p = vertices(g);
      BOOST_CHECK(num_vertices(g) == vertex_set.size());
      v_size_t n = (size_t)std::distance(p.first, p.second);
      BOOST_CHECK(n == num_vertices(g));
      for (; p.first != p.second; ++p.first) {
        vertex_t v = *p.first;
        BOOST_CHECK(container_contains(vertex_set, v) == true);
      }
    }

    void test_edge_list_graph
      (const std::vector<vertex_t>& vertex_set, 
       const std::vector< std::pair<vertex_t, vertex_t> >& edge_set, 
       const Graph& g)
    {
      typedef typename graph_traits<Graph>::edge_iterator e_iter;
      std::pair<e_iter, e_iter> p = edges(g);
      BOOST_CHECK(num_edges(g) == edge_set.size());
      e_size_t m = std::distance(p.first, p.second);
      BOOST_CHECK(m == num_edges(g));
      for (; p.first != p.second; ++p.first) {
        edge_t e = *p.first;
        BOOST_CHECK(find_if(edge_set, connects(source(e, g), target(e, g), g)) != boost::end(edge_set));
        BOOST_CHECK(container_contains(vertex_set, source(e, g)) == true);
        BOOST_CHECK(container_contains(vertex_set, target(e, g)) == true);
      }
    }

    void test_adjacency_matrix
      (const std::vector<vertex_t>& vertex_set, 
       const std::vector< std::pair<vertex_t, vertex_t> >& edge_set, 
       const Graph& g)
    {
      std::pair<edge_t, bool> p;
      for (typename std::vector<std::pair<vertex_t, vertex_t> >
             ::const_iterator i = edge_set.begin();
           i != edge_set.end(); ++i) {
        p = edge(i->first, i->second, g);
        BOOST_CHECK(p.second == true);
        BOOST_CHECK(source(p.first, g) == i->first);
        BOOST_CHECK(target(p.first, g) == i->second);
      }
      typename std::vector<vertex_t>::const_iterator j, k;
      for (j = vertex_set.begin(); j != vertex_set.end(); ++j)
        for (k = vertex_set.begin(); k != vertex_set.end(); ++k) {
          p = edge(*j, *k, g);
          if (p.second == true)
            BOOST_CHECK(find_if(edge_set, 
              connects(source(p.first, g), target(p.first, g), g)) != boost::end(edge_set));
        }
    }

    //=========================================================================
    // Mutating Operations

    void test_add_vertex(Graph& g)
    {
      Graph cpy;
      std::vector<vertex_t> iso_vec(num_vertices(g));
      IsoMap iso_map(iso_vec.begin(), get(vertex_index, g));
      copy_graph(g, cpy, orig_to_copy(iso_map));

      BOOST_CHECK((verify_isomorphism(g, cpy, iso_map)));

      vertex_t v = add_vertex(g);
      
      BOOST_CHECK(num_vertices(g) == num_vertices(cpy) + 1);

      BOOST_CHECK(out_degree(v, g) == 0);

      // Make sure the rest of the graph stayed the same
      BOOST_CHECK((verify_isomorphism
                  (make_filtered_graph(g, keep_all(), ignore_vertex(v)), cpy,
                   iso_map)));
    }
    
    void test_add_edge(vertex_t u, vertex_t v, Graph& g)
    {
      Graph cpy;
      std::vector<vertex_t> iso_vec(num_vertices(g));
      IsoMap iso_map(iso_vec.begin(), get(vertex_index, g));
      copy_graph(g, cpy, orig_to_copy(iso_map));

      bool parallel_edge_exists = container_contains(adjacent_vertices(u, g), v);
      
      std::pair<edge_t, bool> p = add_edge(u, v, g);
      edge_t e = p.first;
      bool added = p.second;

      if (is_undirected(g) && u == v) // self edge
        BOOST_CHECK(added == false);
      else if (parallel_edge_exists)
        BOOST_CHECK(allows_parallel_edges(g) && added == true
                   || !allows_parallel_edges(g) && added == false);
      else
        BOOST_CHECK(added == true);

      if (p.second == true) { // edge added
        BOOST_CHECK(num_edges(g) == num_edges(cpy) + 1);
        
        BOOST_CHECK(container_contains(out_edges(u, g), e) == true);
        
        BOOST_CHECK((verify_isomorphism
                    (make_filtered_graph(g, ignore_edge(e)), cpy, iso_map)));
      }
      else { // edge not added
        if (! (is_undirected(g) && u == v)) {
          // e should be a parallel edge
          BOOST_CHECK(source(e, g) == u);
          BOOST_CHECK(target(e, g) == v);
        }
        // The graph should not be changed.
        BOOST_CHECK((verify_isomorphism(g, cpy, iso_map)));
      }
    } // test_add_edge()


    void test_remove_edge(vertex_t u, vertex_t v, Graph& g)
    {
      Graph cpy;
      std::vector<vertex_t> iso_vec(num_vertices(g));
      IsoMap iso_map(iso_vec.begin(), get(vertex_index, g));
      copy_graph(g, cpy, orig_to_copy(iso_map));

      deg_size_t occurances = count(adjacent_vertices(u, g), v);

      remove_edge(u, v, g);
      
      BOOST_CHECK(num_edges(g) + occurances == num_edges(cpy));
      BOOST_CHECK((verify_isomorphism
                  (g, make_filtered_graph(cpy, ignore_edges(u,v,cpy)),
                   iso_map)));
    }

    void test_remove_edge(edge_t e, Graph& g)
    {
      Graph cpy;
      std::vector<vertex_t> iso_vec(num_vertices(g));
      IsoMap iso_map(iso_vec.begin(), get(vertex_index, g));
      copy_graph(g, cpy, orig_to_copy(iso_map));

      vertex_t u = source(e, g), v = target(e, g);
      deg_size_t occurances = count(adjacent_vertices(u, g), v);
      
      remove_edge(e, g);

      BOOST_CHECK(num_edges(g) + 1 == num_edges(cpy));
      BOOST_CHECK(count(adjacent_vertices(u, g), v) + 1 == occurances);
      BOOST_CHECK((verify_isomorphism
                  (g, make_filtered_graph(cpy, ignore_edge(e)),
                   iso_map)));
    }

    void test_clear_vertex(vertex_t v, Graph& g)
    {
      Graph cpy;
      std::vector<vertex_t> iso_vec(num_vertices(g));
      IsoMap iso_map(iso_vec.begin(), get(vertex_index, g));
      copy_graph(g, cpy, orig_to_copy(iso_map));

      clear_vertex(v, g);

      BOOST_CHECK(out_degree(v, g) == 0);
      BOOST_CHECK(num_vertices(g) == num_vertices(cpy));
      BOOST_CHECK((verify_isomorphism
                  (g, make_filtered_graph(cpy, keep_all(), ignore_vertex(v)),
                   iso_map)));
    }

    //=========================================================================
    // Property Map

    template <typename PropVal, typename PropertyTag>
    void test_readable_vertex_property_graph
      (const std::vector<PropVal>& vertex_prop, PropertyTag tag, const Graph& g)
    {
      typedef typename property_map<Graph, PropertyTag>::const_type const_Map;
      const_Map pmap = get(tag, g);
      typename std::vector<PropVal>::const_iterator i = vertex_prop.begin();

  for (typename boost::graph_traits<Graph>::vertex_iterator 
           bgl_first_9 = vertices(g).first, bgl_last_9 = vertices(g).second;
       bgl_first_9 != bgl_last_9; bgl_first_9 = bgl_last_9)
    for (typename boost::graph_traits<Graph>::vertex_descriptor v;
         bgl_first_9 != bgl_last_9 ? (v = *bgl_first_9, true) : false;
         ++bgl_first_9) {
      //BGL_FORALL_VERTICES_T(v, g, Graph) {
        typename property_traits<const_Map>::value_type 
          pval1 = get(pmap, v), pval2 = get(tag, g, v);
        BOOST_CHECK(pval1 == pval2);
        BOOST_CHECK(pval1 == *i++);
      }
    }

    template <typename PropVal, typename PropertyTag>
    void test_vertex_property_graph
      (const std::vector<PropVal>& vertex_prop, PropertyTag tag, Graph& g)
    {
      typedef typename property_map<Graph, PropertyTag>::type PMap;
      PMap pmap = get(tag, g);
      typename std::vector<PropVal>::const_iterator i = vertex_prop.begin();
  for (typename boost::graph_traits<Graph>::vertex_iterator 
           bgl_first_9 = vertices(g).first, bgl_last_9 = vertices(g).second;
       bgl_first_9 != bgl_last_9; bgl_first_9 = bgl_last_9)
    for (typename boost::graph_traits<Graph>::vertex_descriptor v;
         bgl_first_9 != bgl_last_9 ? (v = *bgl_first_9, true) : false;
         ++bgl_first_9)
      //      BGL_FORALL_VERTICES_T(v, g, Graph)
        put(pmap, v, *i++);

      test_readable_vertex_property_graph(vertex_prop, tag, g);

      BGL_FORALL_VERTICES_T(v, g, Graph)
        put(pmap, v, vertex_prop[0]);
      
      typename std::vector<PropVal>::const_iterator j = vertex_prop.begin();
      BGL_FORALL_VERTICES_T(v, g, Graph)
        put(tag, g, v, *j++);
      
      test_readable_vertex_property_graph(vertex_prop, tag, g);      
    }
    
    
  };


} // namespace boost

#include <boost/graph/iteration_macros_undef.hpp>

#endif // BOOST_GRAPH_TEST_HPP

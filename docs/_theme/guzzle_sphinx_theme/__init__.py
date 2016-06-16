"""Sphinx Guzzle theme."""

import os
import xml.etree.ElementTree as ET

from docutils import nodes
from sphinx.locale import admonitionlabels
from sphinx.writers.html import HTMLTranslator as SphinxHTMLTranslator

from pygments.style import Style
from pygments.token import Keyword, Name, Comment, String, Error, \
     Number, Operator, Generic, Whitespace, Punctuation, Other, Literal


def setup(app):
    """Setup conntects events to the sitemap builder"""
    app.connect('html-page-context', add_html_link)
    app.connect('build-finished', create_sitemap)
    app.sitemap_links = []


def add_html_link(app, pagename, templatename, context, doctree):
    """As each page is built, collect page names for the sitemap"""
    base_url = app.config['html_theme_options'].get('base_url', '')
    if base_url:
        app.sitemap_links.append(base_url + pagename + ".html")


def create_sitemap(app, exception):
    """Generates the sitemap.xml from the collected HTML page links"""
    if (not app.config['html_theme_options'].get('base_url', '') or
           exception is not None or
           not app.sitemap_links):
        return

    filename = app.outdir + "/sitemap.xml"
    print("Generating sitemap.xml in %s" % filename)

    root = ET.Element("urlset")
    root.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")

    for link in app.sitemap_links:
        url = ET.SubElement(root, "url")
        ET.SubElement(url, "loc").text = link

    ET.ElementTree(root).write(filename)


def html_theme_path():
    return [os.path.dirname(os.path.abspath(__file__))]


class HTMLTranslator(SphinxHTMLTranslator):
    """
    Handle translating to bootstrap structure.
    """
    def visit_table(self, node, name=''):
        """
        Override docutils default table formatter to not include a border
        and to use Bootstrap CSS
        See: http://sourceforge.net/p/docutils/code/HEAD/tree/trunk/docutils/docutils/writers/html4css1/__init__.py#l1550
        """
        self.context.append(self.compact_p)
        self.compact_p = True
        classes = 'table table-bordered ' + self.settings.table_style
        classes = classes.strip()
        self.body.append(
            self.starttag(node, 'table', CLASS=classes))

    def depart_table(self, node):
        """
        This needs overridin' too
        """
        self.compact_p = self.context.pop()
        self.body.append('</table>\n')

    def visit_field(self, node):
        pass

    def depart_field(self, node):
        pass

    def visit_field_name(self, node):
        atts = {}
        if self.in_docinfo:
            atts['class'] = 'docinfo-name'
        else:
            atts['class'] = 'field-name'
        self.context.append('')
        self.body.append(self.starttag(node, 'dt', '', **atts))

    def depart_field_name(self, node):
        self.body.append('</dt>')
        self.body.append(self.context.pop())

    def visit_field_body(self, node):
        self.body.append(self.starttag(node, 'dd', '', CLASS='field-body'))
        self.set_class_on_child(node, 'first', 0)
        field = node.parent
        if (self.compact_field_list or
            isinstance(field.parent, nodes.docinfo) or
            field.parent.index(field) == len(field.parent) - 1):
            # If we are in a compact list, the docinfo, or if this is
            # the last field of the field list, do not add vertical
            # space after last element.
            self.set_class_on_child(node, 'last', -1)

    def depart_field_body(self, node):
        self.body.append('</dd>\n')

    def visit_field_list(self, node):
        self.context.append((self.compact_field_list, self.compact_p))
        self.compact_p = None
        if 'compact' in node['classes']:
            self.compact_field_list = True
        elif (self.settings.compact_field_lists
              and 'open' not in node['classes']):
            self.compact_field_list = True
        if self.compact_field_list:
            for field in node:
                field_body = field[-1]
                assert isinstance(field_body, nodes.field_body)
                children = [n for n in field_body
                            if not isinstance(n, nodes.Invisible)]
                if not (len(children) == 0 or
                        len(children) == 1 and
                        isinstance(children[0],
                                   (nodes.paragraph, nodes.line_block))):
                    self.compact_field_list = False
                    break
        self.body.append(self.starttag(node, 'dl', frame='void',
                                       rules='none',
                                       CLASS='docutils field-list'))

    def depart_field_list(self, node):
        self.body.append('</dl>\n')
        self.compact_field_list, self.compact_p = self.context.pop()

# encoding: utf-8

# = plist
#
# Copyright 2006-2010 Ben Bleything and Patrick May
# Distributed under the MIT License
#

module Plist
  # === Create a plist
  # You can dump an object to a plist in one of two ways:
  #
  # * <tt>Plist::Emit.dump(obj)</tt>
  # * <tt>obj.to_plist</tt>
  #   * This requires that you mixin the <tt>Plist::Emit</tt> module, which is already done for +Array+ and +Hash+.
  #
  # The following Ruby classes are converted into native plist types:
  #   Array, Bignum, Date, DateTime, Fixnum, Float, Hash, Integer, String, Symbol, Time, true, false
  # * +Array+ and +Hash+ are both recursive; their elements will be converted into plist nodes inside the <array> and <dict> containers (respectively).
  # * +IO+ (and its descendants) and +StringIO+ objects are read from and their contents placed in a <data> element.
  # * User classes may implement +to_plist_node+ to dictate how they should be serialized; otherwise the object will be passed to <tt>Marshal.dump</tt> and the result placed in a <data> element.
  #
  # For detailed usage instructions, refer to USAGE[link:files/docs/USAGE.html] and the methods documented below.
  module Emit
    DEFAULT_INDENT = "\t"

    # Helper method for injecting into classes.  Calls <tt>Plist::Emit.dump</tt> with +self+.
    def to_plist(envelope = true, options = {})
      Plist::Emit.dump(self, envelope, options)
    end

    # Helper method for injecting into classes.  Calls <tt>Plist::Emit.save_plist</tt> with +self+.
    def save_plist(filename, options = {})
      Plist::Emit.save_plist(self, filename, options)
    end

    # The following Ruby classes are converted into native plist types:
    #   Array, Bignum, Date, DateTime, Fixnum, Float, Hash, Integer, String, Symbol, Time
    #
    # Write us (via RubyForge) if you think another class can be coerced safely into one of the expected plist classes.
    #
    # +IO+ and +StringIO+ objects are encoded and placed in <data> elements; other objects are <tt>Marshal.dump</tt>'ed unless they implement +to_plist_node+.
    #
    # The +envelope+ parameters dictates whether or not the resultant plist fragment is wrapped in the normal XML/plist header and footer.  Set it to false if you only want the fragment.
    def self.dump(obj, envelope = true, options = {})
      options = { :indent => DEFAULT_INDENT }.merge(options)

      output = PlistBuilder.new(options[:indent]).build(obj)
      output = wrap(output) if envelope

      output
    end

    # Writes the serialized object's plist to the specified filename.
    def self.save_plist(obj, filename, options = {})
      File.open(filename, 'wb') do |f|
        f.write(obj.to_plist(true, options))
      end
    end

    private

    class PlistBuilder
      def initialize(indent_str)
        @indent_str = indent_str.to_s
      end

      def build(element, level=0)
        if element.respond_to? :to_plist_node
          element.to_plist_node
        else
          case element
          when Array
            if element.empty?
              tag('array', nil, level)
            else
              tag('array', nil, level) {
                element.collect {|e| build(e, level + 1) }.join
              }
            end
          when Hash
            if element.empty?
              tag('dict', nil, level)
            else
              tag('dict', '', level) do
                element.sort_by{|k,v| k.to_s }.collect do |k,v| 
                  tag('key', CGI.escapeHTML(k.to_s), level + 1) +
                  build(v, level + 1)
                end.join
              end
            end
          when true, false
            tag(element, nil, level)
          when Time
            tag('date', element.utc.strftime('%Y-%m-%dT%H:%M:%SZ'), level)
          when Date # also catches DateTime
            tag('date', element.strftime('%Y-%m-%dT%H:%M:%SZ'), level)
          when String, Symbol, Integer, Float
            tag(element_type(element), CGI.escapeHTML(element.to_s), level)
          when IO, StringIO
            data = element.tap(&:rewind).read 
            data_tag(data, level)
          else
            data = Marshal.dump(element)
            comment_tag('The <data> element below contains a Ruby object which has been serialized with Marshal.dump.') +
            data_tag(data, level)
          end
        end
      end

      private

      def tag(type, contents, level, &block)
        if block_given?
          indent("<#{type}>\n", level) +
          block.call +
          indent("</#{type}>\n", level)
        elsif contents.to_s.empty?
          indent("<#{type}/>\n", level)
        else
          indent("<#{type}>#{contents.to_s}</#{type}>\n", level)
        end
      end

      def data_tag(data, level)
        # note that apple plists are wrapped at a different length then
        # what ruby's pack wraps by default.
        tag('data', nil, level) do
          [data].pack("m") # equivalent to Base64.encode64(data)
                .gsub(/\s+/, '')
                .scan(/.{1,68}/o)
                .collect { |line| indent(line, level) }
                .join("\n")
                .concat("\n")
        end
      end

      def indent(str, level)
        @indent_str.to_s * level + str
      end

      def element_type(item)
        case item
        when String, Symbol
          'string'
        when Integer
          'integer'
        when Float
          'real'
        else
          raise "Don't know about this data type... something must be wrong!"
        end
      end

      def comment_tag(content)
        return "<!-- #{content} -->\n"
      end
    end

    def self.wrap(contents)
      output =  '<?xml version="1.0" encoding="UTF-8"?>' + "\n"
      output << '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' + "\n"
      output << '<plist version="1.0">' + "\n"
      output << contents
      output << '</plist>' + "\n"

      output
    end
  end
end

class Array #:nodoc:
  include Plist::Emit
end

class Hash #:nodoc:
  include Plist::Emit
end

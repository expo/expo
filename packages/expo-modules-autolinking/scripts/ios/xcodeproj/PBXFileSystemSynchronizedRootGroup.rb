# The xcodeproj gem doesn't expose a `name` attribute on PBXFileSystemSynchronizedRootGroup,
# but the pbxproj format supports it. Without it, Xcode uses the raw path as the display name.
unless Xcodeproj::Project::Object::PBXFileSystemSynchronizedRootGroup.method_defined?(:name)
  Xcodeproj::Project::Object::PBXFileSystemSynchronizedRootGroup.class_eval do
    attribute :name, String

    def display_name
      return name if name
      return path if path
      super
    end
  end
end

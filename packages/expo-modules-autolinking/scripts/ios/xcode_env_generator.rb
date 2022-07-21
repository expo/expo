require 'pathname'


def maybe_generate_xcode_env_file!()
  project_directory = Pod::Config.instance.project_root
  xcode_env_file = File.join(project_directory, '.xcode.env.local')
  if File.exists?(xcode_env_file)
    return
  end
  node_path = `command -v node`.strip!
  File.write(xcode_env_file, "export NODE_BINARY=\"#{node_path}\"\n")
  Pod::UI.info "Auto-generating `.xcode.env.local` with $NODE_BINARY=#{node_path}"
end

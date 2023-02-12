require 'open3'
require 'pathname'


def maybe_generate_xcode_env_file!()
  project_directory = Pod::Config.instance.project_root
  xcode_env_file = File.join(project_directory, '.xcode.env.local')
  if File.exist?(xcode_env_file)
    return
  end

  # Adding the meta character `;` at the end of command for Ruby `Kernel.exec` to execute the command in shell.
  stdout, stderr, status = Open3.capture3('node --print "process.argv[0]";')
  node_path = stdout.strip
  if !stderr.empty? || status.exitstatus != 0 || node_path.empty?
    Pod::UI.warn "Unable to generate `.xcode.env.local` for Node.js binary path: #{stderr}"
  else
    Pod::UI.info "Auto-generating `.xcode.env.local` with $NODE_BINARY=#{node_path}"
    File.write(xcode_env_file, "export NODE_BINARY=\"#{node_path}\"\n")
  end
end

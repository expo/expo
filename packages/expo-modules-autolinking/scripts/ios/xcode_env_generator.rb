require 'open3'
require 'pathname'

def generate_or_remove_xcode_env_updates_file!()
  project_directory = Pod::Config.instance.project_root
  xcode_env_file = File.join(project_directory, '.xcode.env.updates')

  ex_updates_native_debug = ENV['EX_UPDATES_NATIVE_DEBUG'] == '1' ||
                              ENV['EX_UPDATES_NATIVE_DEBUG'] == 'true'
  if ex_updates_native_debug
    Pod::UI.info "EX_UPDATES_NATIVE_DEBUG is set; auto-generating `.xcode.env.updates` to disable packager and generate debug bundle"
    if File.exist?(xcode_env_file)
      File.delete(xcode_env_file)
    end
    File.write(xcode_env_file, <<~EOS
      export FORCE_BUNDLING=1
      unset SKIP_BUNDLING
      export RCT_NO_LAUNCH_PACKAGER=1
EOS
    )
  else
    if File.exist?(xcode_env_file)
      Pod::UI.info "EX_UPDATES_NATIVE_DEBUG has been unset; removing `.xcode.env.updates`"
      File.delete(xcode_env_file)
    end
  end
end

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

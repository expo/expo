require 'pathname'

def brown(message)
  return "\e[33m#{message}\e[0m"
end

def blue(message)
  return "\e[34m#{message}\e[0m"
end

def eval_versioned_scripts!(file_name, message: '', context: nil)
  project_directory = Pod::Config.instance.project_root
  project_root_directory = Pathname.new(File.dirname(project_directory))

  glob_pattern = File.join(project_directory, "versioned-react-native/ABI*/#{file_name}")

  Dir.glob(glob_pattern) { |file_path|
    relative_file_path = Pathname.new(file_path).relative_path_from(project_root_directory)

    unless message.empty?
      puts brown "#{message} #{blue relative_file_path}"
    end

    eval File.read(file_path), context
  }
end

def use_versioned_abis!
  eval_versioned_scripts! 'dependencies.rb',
    message: 'Using versioned dependencies from'
end

def run_versioned_postinstalls!(pod_name, target_installation_result)
  eval_versioned_scripts! 'postinstalls.rb',
    context: binding
end

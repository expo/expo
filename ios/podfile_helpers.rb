require 'pathname'

def brown(message)
  return "\e[33m#{message}\e[0m"
end

def blue(message)
  return "\e[34m#{message}\e[0m"
end

def use_pods!(pattern, project_name = nil, pods_to_exclude = [])
  base_directory = Pod::Config.instance.project_root

  Dir.glob(pattern, base: base_directory) { |file_path|
    podName = File.basename(file_path).split('.')[0]
    unless pods_to_exclude.include? podName
      podPath = File.dirname(file_path)
      pod podName, path: "./#{podPath}", project_name: project_name
    end
  }
end

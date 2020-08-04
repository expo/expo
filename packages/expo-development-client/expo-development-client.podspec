require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "expo-development-client"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  expo-development-client
                   DESC
  s.homepage     = "https://github.com/github_account/expo-development-client"
  # brief license entry:
  s.license      = "MIT"
  # optional - use expanded license entry instead:
  # s.license    = { :type => "MIT", :file => "LICENSE" }
  s.authors      = { "Your Name" => "yourname@email.com" }
  s.platforms    = { :ios => "9.0" }
  s.source       = { :git => "https://github.com/github_account/expo-development-client.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,swift,cpp}"
  s.requires_arc = true

  s.dependency "React"
  s.dependency "EXDevMenu" # NOTE: This is temporary till we decide on a way to have this be optional
  # ...
  # s.dependency "..."
end


require 'rake'
require 'rake/testtask'

desc 'Run plugin tests'
task :test do
  Rake::Task["test:units"].invoke
  Rake::Task["test:functionals"].invoke
  Rake::Task["test:integration"].invoke
end

namespace :test do
  desc 'Run unit tests'
  Rake::TestTask.new(:units) do |t|
    t.libs << 'test'
    t.pattern = 'test/unit/**/*_test.rb'
    t.verbose = true
  end

  desc 'Run functional tests'
  Rake::TestTask.new(:functionals) do |t|
    t.libs << 'test'
    t.pattern = 'test/functional/**/*_test.rb'
    t.verbose = true
  end

  desc 'Run integration tests'
  Rake::TestTask.new(:integration) do |t|
    t.libs << 'test'
    t.pattern = 'test/integration/**/*_test.rb'
    t.verbose = true
  end
end

desc 'Run plugin tests with coverage'
task :test_with_coverage do
  require 'simplecov'
  SimpleCov.start 'rails' do
    add_filter '/test/'
    add_group 'Controllers', 'app/controllers'
    add_group 'Models', 'app/models'
    add_group 'Helpers', 'app/helpers'
    add_group 'Libraries', 'lib'
  end
  
  Rake::Task[:test].invoke
end
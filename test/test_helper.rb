# Load the Redmine helper
require File.expand_path(File.dirname(__FILE__) + '/../../../test/test_helper')
ActiveSupport::TestCase.fixture_paths << File.dirname(__FILE__) + '/fixtures'

class ActiveSupport::TestCase
  # This is not necessary because `fixtures :all` is already used in Redmine trunk,
  # but it is set here because RedMica has not yet followed that change.
  # If RedMica follows Redmine trunk in the future, this setting will not be necessary.
  fixtures :all
end

class RedmineCustomDashboardsTestCase
  def self.prepare
    # Prepare test data if needed
    Role.where(:id => [1, 2]).each do |r|
      r.permissions << :manage_dashboards
      r.save!
    end
  end
end
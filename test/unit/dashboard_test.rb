require_relative '../test_helper'

class DashboardTest < ActiveSupport::TestCase

  def setup
    @user = User.find(2)
    @admin = User.find(1)
  end

  def test_should_create_dashboard_with_valid_attributes
    dashboard = Dashboard.new(
      name: 'Test Dashboard',
      description: 'Test description',
      user: @user
    )
    assert dashboard.save
    assert_equal 'Test Dashboard', dashboard.name
    assert_equal @user, dashboard.user
    assert_equal false, dashboard.is_default
  end

  def test_should_require_name
    dashboard = Dashboard.new(user: @user)
    assert_not dashboard.save
    assert dashboard.errors[:name].any?
  end

  def test_should_require_user
    dashboard = Dashboard.new(name: 'Test Dashboard')
    assert_not dashboard.save
    assert dashboard.errors[:user_id].any?
  end

  def test_should_limit_name_length
    long_name = 'a' * 101
    dashboard = Dashboard.new(name: long_name, user: @user)
    assert_not dashboard.save
    assert dashboard.errors[:name].any?
  end

  def test_should_allow_valid_name_length
    dashboard = Dashboard.new(name: 'a' * 100, user: @user)
    assert dashboard.save
  end

  def test_for_user_scope_should_return_user_dashboards
    # Create test dashboards (in addition to fixture dashboards)
    Dashboard.create!(name: 'User Dashboard 1', user: @user)
    Dashboard.create!(name: 'User Dashboard 2', user: @user)
    Dashboard.create!(name: 'Admin Dashboard', user: @admin)
    
    user_dashboards = Dashboard.for_user(@user)
    assert_equal 4, user_dashboards.count  # 2 from fixtures + 2 created here
    assert user_dashboards.all? { |d| d.user_id == @user.id }
  end

  def test_default_for_user_scope_should_return_default_dashboard
    default_dashboard = Dashboard.default_for_user(@user)
    assert_equal 1, default_dashboard.count
    assert default_dashboard.first.is_default?
    assert_equal @user.id, default_dashboard.first.user_id
  end

  def test_set_as_default_should_unset_other_defaults
    dashboard1 = Dashboard.find(1) # default for user 2
    dashboard2 = Dashboard.find(2) # non-default for user 2
    
    assert dashboard1.is_default?
    assert_not dashboard2.is_default?
    
    dashboard2.set_as_default!
    
    dashboard1.reload
    dashboard2.reload
    
    assert_not dashboard1.is_default?
    assert dashboard2.is_default?
  end

  def test_should_allow_only_one_default_per_user
    # Create a new default dashboard
    dashboard = Dashboard.new(
      name: 'Another Default',
      user: @user,
      is_default: true
    )
    assert dashboard.save
    
    # Original default should no longer be default
    original_default = Dashboard.create!(
      name: 'Original Default',
      user: @user,
      is_default: true
    )
    
    # Create another default - this should unset the original
    dashboard.save
    
    original_default.reload
    assert_not original_default.is_default?
    
    # New dashboard should be default
    assert dashboard.is_default?
  end

  def test_should_allow_multiple_non_defaults_per_user
    dashboard1 = Dashboard.new(
      name: 'Dashboard 1',
      user: @user,
      is_default: false
    )
    dashboard2 = Dashboard.new(
      name: 'Dashboard 2',
      user: @user,
      is_default: false
    )
    
    assert dashboard1.save
    assert dashboard2.save
  end

  def test_should_allow_default_dashboards_for_different_users
    dashboard = Dashboard.new(
      name: 'User 3 Default',
      user: User.find(3),
      is_default: true
    )
    assert dashboard.save
  end

  def test_user_association_should_have_dashboards
    assert_respond_to @user, :dashboards
    assert_equal 2, @user.dashboards.count
  end

  def test_user_should_have_default_dashboard_method
    assert_respond_to @user, :default_dashboard
    default = @user.default_dashboard
    assert_not_nil default
    assert default.is_default?
    assert_equal @user, default.user
  end

  def test_user_should_have_has_dashboards_method
    assert_respond_to @user, :has_dashboards?
    assert @user.has_dashboards?
    
    user_without_dashboards = User.find(3)
    assert_not user_without_dashboards.has_dashboards?
  end

  def test_destroying_user_should_destroy_dashboards
    user = User.find(2)
    dashboard_ids = user.dashboards.pluck(:id)
    
    user.destroy
    
    dashboard_ids.each do |id|
      assert_nil Dashboard.find_by(id: id)
    end
  end
end
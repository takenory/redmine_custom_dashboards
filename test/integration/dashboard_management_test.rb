require_relative '../test_helper'

class DashboardManagementTest < Redmine::IntegrationTest

  def setup
    @user = User.find(2) # jsmith
    @dashboard = Dashboard.find(1) # fixture dashboard
    log_user('jsmith', 'jsmith')
  end

  def test_complete_dashboard_management_workflow
    # Visit my account page
    get '/my/account'
    assert_response :success

    # Should see dashboard management link
    assert_select 'a[href=?]', my_dashboards_path, text: I18n.t(:label_my_dashboards)

    # Click on dashboard management
    get my_dashboards_path
    assert_response :success
    assert_select 'h2', text: I18n.t(:label_my_dashboards)

    # Should see existing dashboards
    assert_select 'table.dashboards'
    assert_select 'tr.default-dashboard', count: 1 # one default dashboard

    # Create new dashboard
    get new_dashboard_path
    assert_response :success

    post dashboards_path, params: {
      dashboard: {
        name: 'Integration Test Dashboard',
        description: 'Created during integration test',
        is_default: false
      }
    }

    follow_redirect!
    assert_response :success
    assert_select '.flash.notice', text: /#{I18n.t(:notice_dashboard_created)}/

    # Should now see the new dashboard in the list
    assert_select 'td.name', text: 'Integration Test Dashboard'

    # Edit the dashboard
    dashboard = Dashboard.find_by(name: 'Integration Test Dashboard')
    get edit_dashboard_path(dashboard)
    assert_response :success

    patch dashboard_path(dashboard), params: {
      dashboard: {
        name: 'Updated Integration Dashboard',
        description: 'Updated description'
      }
    }

    follow_redirect!
    assert_response :success
    assert_select '.flash.notice', text: /#{I18n.t(:notice_dashboard_updated)}/
    assert_select 'td.name', text: 'Updated Integration Dashboard'

    # Set as default
    patch set_default_dashboard_path(dashboard)
    follow_redirect!
    assert_response :success
    assert_select '.flash.notice', text: /#{I18n.t(:notice_dashboard_set_default)}/

    # The updated dashboard should now be marked as default
    assert_select 'tr.default-dashboard td.name', text: /Updated Integration Dashboard/

    # Delete the dashboard
    delete dashboard_path(dashboard)
    follow_redirect!
    assert_response :success
    assert_select '.flash.notice', text: /#{I18n.t(:notice_dashboard_deleted)}/

    # Dashboard should no longer appear in the list
    assert_select 'td.name', text: 'Updated Integration Dashboard', count: 0
  end

  def test_dashboard_creation_with_validation_errors
    get new_dashboard_path
    assert_response :success

    # Submit with empty name
    post dashboards_path, params: {
      dashboard: {
        name: '',
        description: 'Test description'
      }
    }

    assert_response :success
    assert_select '#errorExplanation'
    assert_select '#errorExplanation li', text: /Name cannot be blank/
  end

  def test_dashboard_access_control
    # Create dashboard as jsmith
    post dashboards_path, params: {
      dashboard: {
        name: 'Private Dashboard',
        description: 'Should not be accessible to others'
      }
    }

    assert_response :redirect
    dashboard = Dashboard.find_by(name: 'Private Dashboard')
    assert_not_nil dashboard
    assert_equal @user, dashboard.user

    # Logout and login as different user
    post '/logout'
    log_user('admin', 'admin')

    # Try to access jsmith's dashboard
    get edit_dashboard_path(dashboard)
    assert_response 403

    # Try to update jsmith's dashboard
    patch dashboard_path(dashboard), params: {
      dashboard: { name: 'Hacked Dashboard' }
    }
    assert_response 403

    # Try to delete jsmith's dashboard
    delete dashboard_path(dashboard)
    assert_response 403

    # Try to set jsmith's dashboard as default
    patch set_default_dashboard_path(dashboard)
    assert_response 403
  end

  def test_default_dashboard_behavior
    # User should have one default dashboard initially
    get my_dashboards_path
    assert_response :success
    assert_select 'tr.default-dashboard', count: 1

    # Create a new dashboard and set as default
    post dashboards_path, params: {
      dashboard: {
        name: 'New Default Dashboard',
        description: 'Will be set as default',
        is_default: true
      }
    }

    assert_response :redirect
    follow_redirect!
    assert_response :success

    # Should still have only one default dashboard
    assert_select 'tr.default-dashboard', count: 1
    assert_select 'tr.default-dashboard td.name', text: /New Default Dashboard/

    # Original default should no longer be default
    @dashboard.reload
    assert_not @dashboard.is_default?
  end

  def test_sidebar_integration_on_dashboard_pages
    get my_dashboards_path
    assert_response :success

    # Check that sidebar contains dashboard list
    # Note: This test would need the actual dashboard display functionality
    # For now, we test that the page renders correctly
    assert_select 'h2', text: I18n.t(:label_my_dashboards)
  end

  def test_unauthorized_access_redirects_to_login
    logout

    get my_dashboards_path
    assert_response :redirect
    assert_match %r{/login}, response.location

    get new_dashboard_path
    assert_response :redirect
    assert_match %r{/login}, response.location
  end

  def test_dashboard_list_empty_state
    # Delete all dashboards for the user
    @user.dashboards.destroy_all

    get my_dashboards_path
    assert_response :success
    assert_select 'p.nodata', text: I18n.t(:label_no_data)
    assert_select 'a[href=?]', new_dashboard_path, text: I18n.t(:label_dashboard_new)
  end

  private

  def logout
    post '/logout'
    follow_redirect!
  end
end
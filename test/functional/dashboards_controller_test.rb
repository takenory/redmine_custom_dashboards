require_relative '../test_helper'

class DashboardsControllerTest < Redmine::ControllerTest

  def setup
    @request.session[:user_id] = 2 # jsmith
    @user = User.find(2)
    @dashboard = Dashboard.find(1) # fixture dashboard
  end

  def test_index_should_show_user_dashboards
    get :index
    assert_response :success
    assert_select 'h2', text: I18n.t(:label_my_dashboards)
    assert_select 'table.dashboards'
    assert_select 'tr', count: @user.dashboards.count + 1 # +1 for header
  end

  def test_index_should_show_default_dashboard_indicator
    get :index
    assert_response :success
    assert_select '.default-indicator', text: /#{I18n.t(:label_dashboard_default)}/
  end

  def test_index_should_show_contextual_new_link
    get :index
    assert_response :success
    assert_select '.contextual a[href=?]', new_dashboard_path
  end

  def test_new_should_render_form
    get :new
    assert_response :success
    assert_select 'h2', text: I18n.t(:label_dashboard_new)
    assert_select 'form[action=?]', dashboards_path
    assert_select 'input[name=?]', 'dashboard[name]'
    assert_select 'textarea[name=?]', 'dashboard[description]'
    assert_select 'input[name=?][type=checkbox]', 'dashboard[is_default]'
  end

  def test_create_with_valid_data_should_create_dashboard
    assert_difference 'Dashboard.count' do
      post :create, params: {
        dashboard: {
          name: 'New Dashboard',
          description: 'Test description',
          is_default: false
        }
      }
    end

    assert_redirected_to my_dashboards_path
    assert flash[:notice].include?(I18n.t(:notice_dashboard_created))

    dashboard = Dashboard.last
    assert_equal 'New Dashboard', dashboard.name
    assert_equal @user, dashboard.user
  end

  def test_create_with_invalid_data_should_render_new
    assert_no_difference 'Dashboard.count' do
      post :create, params: {
        dashboard: {
          name: '', # invalid - empty name
          description: 'Test description'
        }
      }
    end

    assert_response :success
    assert_select '#errorExplanation'
  end

  def test_create_with_default_should_unset_other_defaults
    # Ensure @dashboard is default initially (from fixture)
    assert @dashboard.is_default?, "Fixture dashboard should be default"

    post :create, params: {
      dashboard: {
        name: 'New Default Dashboard',
        description: 'Test description',
        is_default: true
      }
    }

    # Original default should no longer be default
    @dashboard.reload
    assert_not @dashboard.is_default?, "Original dashboard should no longer be default"

    # New dashboard should be default
    new_dashboard = Dashboard.last
    assert new_dashboard.is_default?, "New dashboard should be default"
  end

  def test_edit_should_render_form_for_own_dashboard
    get :edit, params: { id: @dashboard.id }
    assert_response :success
    assert_select 'h2', text: I18n.t(:label_dashboard_edit)
    assert_select 'form[action=?]', dashboard_path(@dashboard)
    assert_select 'input[name=?][value=?]', 'dashboard[name]', @dashboard.name
  end

  def test_edit_should_deny_access_to_other_users_dashboard
    other_dashboard = Dashboard.find(3) # belongs to admin
    get :edit, params: { id: other_dashboard.id }
    assert_response 403
  end

  def test_update_with_valid_data_should_update_dashboard
    patch :update, params: {
      id: @dashboard.id,
      dashboard: {
        name: 'Updated Dashboard',
        description: 'Updated description'
      }
    }

    assert_redirected_to my_dashboards_path
    assert flash[:notice].include?(I18n.t(:notice_dashboard_updated))

    @dashboard.reload
    assert_equal 'Updated Dashboard', @dashboard.name
    assert_equal 'Updated description', @dashboard.description
  end

  def test_update_with_invalid_data_should_render_edit
    patch :update, params: {
      id: @dashboard.id,
      dashboard: {
        name: '' # invalid - empty name
      }
    }

    assert_response :success
    assert_select '#errorExplanation'
  end

  def test_update_should_deny_access_to_other_users_dashboard
    other_dashboard = Dashboard.find(3) # belongs to admin
    patch :update, params: {
      id: other_dashboard.id,
      dashboard: { name: 'Hacked' }
    }
    assert_response 403
  end

  def test_destroy_should_delete_dashboard
    assert_difference 'Dashboard.count', -1 do
      delete :destroy, params: { id: Dashboard.find(2).id } # non-default dashboard
    end

    assert_redirected_to my_dashboards_path
    assert flash[:notice].include?(I18n.t(:notice_dashboard_deleted))
  end

  def test_destroy_should_deny_access_to_other_users_dashboard
    other_dashboard = Dashboard.find(3) # belongs to admin
    assert_no_difference 'Dashboard.count' do
      delete :destroy, params: { id: other_dashboard.id }
    end
    assert_response 403
  end

  def test_set_default_should_make_dashboard_default
    non_default_dashboard = Dashboard.find(2) # belongs to user 2, not default
    assert_not non_default_dashboard.is_default?

    patch :set_default, params: { id: non_default_dashboard.id }

    assert_redirected_to my_dashboards_path
    assert flash[:notice].include?(I18n.t(:notice_dashboard_set_default))

    non_default_dashboard.reload
    assert non_default_dashboard.is_default?

    # Check that previous default is no longer default
    @dashboard.reload
    assert_not @dashboard.is_default?
  end

  def test_set_default_should_deny_access_to_other_users_dashboard
    other_dashboard = Dashboard.find(3) # belongs to admin
    patch :set_default, params: { id: other_dashboard.id }
    assert_response 403
  end

  def test_should_require_login
    @request.session[:user_id] = nil

    get :index
    assert_response :redirect
    assert_match %r{/login}, response.location
  end

  def test_should_handle_missing_dashboard
    get :edit, params: { id: 999999 }
    assert_response 404
  end

  def test_my_dashboards_route_should_work
    get :index
    assert_response :success
    assert_select 'h2', text: I18n.t(:label_my_dashboards)
  end

  def test_show_default_with_default_dashboard_should_show_dashboard
    get :show_default
    assert_response :success
    assert_select 'h2', text: /#{@dashboard.name}/
  end

  def test_show_default_without_default_dashboard_should_redirect_to_index
    # Remove default dashboard
    @dashboard.update!(is_default: false)

    get :show_default
    assert_redirected_to action: :index
  end

  def test_show_should_display_dashboard
    get :show, params: { id: @dashboard.id }
    assert_response :success
    assert_select 'h2', text: /#{@dashboard.name}/
  end

  private

  def setup_permissions
    # Ensure user has manage_dashboards permission
    role = Role.find(1)
    role.permissions << :manage_dashboards
    role.save!
  end
end
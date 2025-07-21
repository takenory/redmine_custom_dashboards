require 'redmine'

Redmine::Plugin.register :redmine_custom_dashboards do
  name 'Redmine Custom Dashboards'
  author 'takenory'
  description 'Add customizable dashboards to Redmine for better user experience'
  version '1.0.0'
  url 'https://github.com/takenory/redmine_custom_dashboards'

  requires_redmine version_or_higher: '6.0.0'

  settings default: {
    'default_dashboard_enabled' => true,
    'max_dashboards_per_user' => 10
  }, partial: 'settings/custom_dashboards'

  permission :manage_dashboards, {
    dashboards: [:index, :show, :show_default, :new, :create, :edit, :update, :destroy, :set_default]
  }, require: :loggedin

  menu :top_menu, :dashboards, { controller: 'dashboards', action: 'show_default' }, 
       caption: :label_dashboards, 
       if: Proc.new { User.current.logged? }
end

require File.dirname(__FILE__) + '/lib/redmine_custom_dashboards/hooks'
require File.dirname(__FILE__) + '/lib/redmine_custom_dashboards/user_patch'
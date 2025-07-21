module RedmineCustomDashboards
  class Hooks < Redmine::Hook::ViewListener
    def view_layouts_base_sidebar(context = {})
      if context[:controller] && context[:controller].controller_name == 'dashboards'
        context[:controller].send(:render_to_string, {
          partial: 'dashboards/sidebar',
          locals: context
        })
      end
    end

    def view_my_account_contextual(context = {})
      context[:controller].send(:render_to_string, {
        partial: 'dashboards/my_account_link',
        locals: context
      })
    end
  end
end
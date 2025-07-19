module RedmineCustomDashboards
  module UserPatch
    def self.included(base)
      base.extend(ClassMethods)
      base.send(:include, InstanceMethods)
      
      base.class_eval do
        has_many :dashboards, dependent: :destroy
      end
    end
    
    module ClassMethods
    end
    
    module InstanceMethods
      def default_dashboard
        dashboards.find_by(is_default: true)
      end
      
      def has_dashboards?
        dashboards.any?
      end
    end
  end
end

unless User.included_modules.include?(RedmineCustomDashboards::UserPatch)
  User.send(:include, RedmineCustomDashboards::UserPatch)
end
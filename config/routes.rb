Rails.application.routes.draw do
  resources :dashboards do
    member do
      patch :set_default
      post :add_panel
      patch :update_panel
      delete :delete_panel
      patch :update_panels_positions
    end
    collection do
      get :show_default
    end
  end
  
  get 'my/dashboards', to: 'dashboards#index', as: 'my_dashboards'
end
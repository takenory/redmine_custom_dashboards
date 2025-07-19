Rails.application.routes.draw do
  resources :dashboards do
    member do
      patch :set_default
    end
    collection do
      get :show_default
    end
  end
  
  get 'my/dashboards', to: 'dashboards#index', as: 'my_dashboards'
end
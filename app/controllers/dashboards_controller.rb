class DashboardsController < ApplicationController
  before_action :require_login
  before_action :find_dashboard, only: [:show, :edit, :update, :destroy, :set_default]
  before_action :authorize_dashboard_access, only: [:show, :edit, :update, :destroy, :set_default]
  
  def show_default
    @default_dashboard = User.current.default_dashboard
    if @default_dashboard
      @dashboard = @default_dashboard
      render :show
    else
      redirect_to action: :index
    end
  end
  
  def show
    # ダッシュボードの詳細表示
  end
  
  def index
    @dashboards = User.current.dashboards.order(:name)
    @default_dashboard = User.current.default_dashboard
  end
  
  def new
    @dashboard = User.current.dashboards.build
  end
  
  def create
    @dashboard = User.current.dashboards.build(dashboard_params)
    
    if @dashboard.save
      flash[:notice] = l(:notice_dashboard_created)
      redirect_to my_dashboards_path
    else
      render :new
    end
  end
  
  def edit
  end
  
  def update
    if @dashboard.update(dashboard_params)
      flash[:notice] = l(:notice_dashboard_updated)
      redirect_to my_dashboards_path
    else
      render :edit
    end
  end
  
  def destroy
    @dashboard.destroy
    flash[:notice] = l(:notice_dashboard_deleted)
    redirect_to my_dashboards_path
  end
  
  def set_default
    @dashboard.set_as_default!
    flash[:notice] = l(:notice_dashboard_set_default)
    redirect_to my_dashboards_path
  end
  
  private
  
  def find_dashboard
    @dashboard = Dashboard.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_404
  end
  
  def authorize_dashboard_access
    render_403 unless @dashboard.user == User.current
  end
  
  def dashboard_params
    params.require(:dashboard).permit(:name, :description, :is_default)
  end
end
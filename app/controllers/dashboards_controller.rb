class DashboardsController < ApplicationController
  before_action :require_login
  before_action :find_dashboard, only: [:show, :edit, :update, :destroy, :set_default, :add_panel, :update_panel, :delete_panel, :update_panels_positions]
  before_action :authorize_dashboard_access, only: [:show, :edit, :update, :destroy, :set_default, :add_panel, :update_panel, :delete_panel, :update_panels_positions]

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

  def add_panel
    @panel = @dashboard.dashboard_panels.build(panel_params)

    if @panel.save
      render json: { 
        status: 'success', 
        panel: panel_json(@panel),
        message: l(:notice_panel_added)
      }
    else
      render json: { 
        status: 'error', 
        errors: @panel.errors.full_messages 
      }, status: :unprocessable_entity
    end
  end

  def update_panel
    @panel = @dashboard.dashboard_panels.find(params[:panel_id])

    if @panel.update(panel_params)
      render json: { 
        status: 'success', 
        panel: panel_json(@panel),
        message: l(:notice_panel_updated)
      }
    else
      render json: { 
        status: 'error', 
        errors: @panel.errors.full_messages 
      }, status: :unprocessable_entity
    end
  end

  def delete_panel
    @panel = @dashboard.dashboard_panels.find(params[:panel_id])

    if @panel.destroy
      render json: { 
        status: 'success', 
        message: l(:notice_panel_deleted)
      }
    else
      render json: { 
        status: 'error', 
        message: l(:error_panel_delete_failed)
      }, status: :unprocessable_entity
    end
  end

  def update_panels_positions
    ActiveRecord::Base.transaction do
      params[:panels].each do |panel_data|
        panel = @dashboard.dashboard_panels.find(panel_data[:id])
        panel.update!(
          grid_x: panel_data[:grid_x],
          grid_y: panel_data[:grid_y],
          grid_width: panel_data[:grid_width],
          grid_height: panel_data[:grid_height]
        )
      end
    end

    render json: { 
      status: 'success', 
      message: l(:notice_panels_updated)
    }
  rescue => e
    render json: { 
      status: 'error', 
      message: e.message 
    }, status: :unprocessable_entity
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

  def panel_params
    params.require(:panel).permit(
      :title, :panel_type, :grid_x, :grid_y, :grid_width, :grid_height, 
      :visible, :z_index, :panel_config
    )
  end

  def panel_json(panel)
    {
      id: panel.id,
      title: panel.title,
      panel_type: panel.panel_type,
      grid_x: panel.grid_x,
      grid_y: panel.grid_y,
      grid_width: panel.grid_width,
      grid_height: panel.grid_height,
      pixel_x: panel.pixel_x,
      pixel_y: panel.pixel_y,
      pixel_width: panel.pixel_width,
      pixel_height: panel.pixel_height,
      visible: panel.visible,
      z_index: panel.z_index,
      config: panel.config
    }
  end
end
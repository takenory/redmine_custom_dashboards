class DashboardPanel < ActiveRecord::Base
  GRID_SIZE = 20
  MIN_WIDTH = 4  # 4グリッド = 80px
  MIN_HEIGHT = 4 # 4グリッド = 80px
  MAX_WIDTH = 50 # 50グリッド = 1000px
  MAX_HEIGHT = 50 # 50グリッド = 1000px

  PANEL_TYPES = %w[
    text
    chart
    list
    calendar
    issues
    activity
    custom
  ].freeze

  belongs_to :dashboard

  validates :title, presence: true, length: { maximum: 100 }
  validates :panel_type, presence: true, inclusion: { in: PANEL_TYPES }
  validates :position_x, :position_y, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :width, :height, presence: true, numericality: { greater_than_or_equal_to: 80 }
  validates :grid_x, :grid_y, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :grid_width, numericality: { in: MIN_WIDTH..MAX_WIDTH }
  validates :grid_height, numericality: { in: MIN_HEIGHT..MAX_HEIGHT }
  validates :z_index, presence: true, numericality: { greater_than_or_equal_to: 1 }

  validate :no_panel_overlap
  validate :within_dashboard_bounds

  scope :visible, -> { where(visible: true) }
  scope :ordered, -> { order(:z_index, :id) }

  before_validation :calculate_pixel_position
  before_validation :snap_to_grid

  def pixel_width
    grid_width * GRID_SIZE
  end

  def pixel_height
    grid_height * GRID_SIZE
  end

  def pixel_x
    grid_x * GRID_SIZE
  end

  def pixel_y
    grid_y * GRID_SIZE
  end

  def overlaps_with?(other_panel)
    return false if other_panel.nil? || other_panel.id == id

    # Check if rectangles overlap
    !(grid_x >= other_panel.grid_x + other_panel.grid_width ||
      other_panel.grid_x >= grid_x + grid_width ||
      grid_y >= other_panel.grid_y + other_panel.grid_height ||
      other_panel.grid_y >= grid_y + grid_height)
  end

  def config
    return {} if panel_config.blank?
    
    JSON.parse(panel_config)
  rescue JSON::ParserError
    {}
  end

  def config=(value)
    self.panel_config = value.to_json
  end

  private

  def calculate_pixel_position
    self.position_x = pixel_x
    self.position_y = pixel_y
    self.width = pixel_width
    self.height = pixel_height
  end

  def snap_to_grid
    # Ensure grid positions are integers and within bounds
    self.grid_x = [grid_x.to_i, 0].max
    self.grid_y = [grid_y.to_i, 0].max
    self.grid_width = [[grid_width.to_i, MIN_WIDTH].max, MAX_WIDTH].min
    self.grid_height = [[grid_height.to_i, MIN_HEIGHT].max, MAX_HEIGHT].min
  end

  def no_panel_overlap
    return unless dashboard

    overlapping_panels = dashboard.dashboard_panels
                                 .where.not(id: id)
                                 .visible
                                 .select { |panel| overlaps_with?(panel) }

    if overlapping_panels.any?
      errors.add(:position, 'Panel overlaps with existing panel')
    end
  end

  def within_dashboard_bounds
    # Assuming dashboard has a maximum grid size (can be configurable)
    max_grid_x = 60 # 1200px
    max_grid_y = 40 # 800px

    if grid_x + grid_width > max_grid_x
      errors.add(:position, 'Panel extends beyond dashboard width')
    end

    if grid_y + grid_height > max_grid_y
      errors.add(:position, 'Panel extends beyond dashboard height')
    end
  end
end
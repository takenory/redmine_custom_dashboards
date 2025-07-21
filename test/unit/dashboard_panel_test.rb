require_relative '../test_helper'

class DashboardPanelTest < ActiveSupport::TestCase
  def setup
    @dashboard = dashboards(:dashboards_001)
    @user = users(:users_001)
  end

  def test_should_create_valid_panel
    panel = DashboardPanel.new(
      dashboard: @dashboard,
      title: "Test Panel",
      panel_type: "text",
      grid_x: 0,
      grid_y: 0,
      grid_width: 10,
      grid_height: 10
    )

    assert panel.valid?
    assert panel.save
  end

  def test_should_validate_grid_position_boundaries
    # Test out of bounds positions
    panel = DashboardPanel.new(
      dashboard: @dashboard,
      title: "Test Panel",
      panel_type: "text",
      grid_x: 70,  # Out of bounds (max 60)
      grid_y: 0,
      grid_width: 10,
      grid_height: 10
    )

    assert_not panel.valid?
    assert panel.errors[:position].present?
  end

  def test_should_calculate_pixel_positions
    panel = DashboardPanel.new(
      dashboard: @dashboard,
      title: "Test Panel",
      panel_type: "text",
      grid_x: 5,
      grid_y: 3,
      grid_width: 10,
      grid_height: 8
    )

    # Grid size is 20px
    assert_equal 100, panel.pixel_x  # 5 * 20
    assert_equal 60, panel.pixel_y   # 3 * 20
    assert_equal 200, panel.pixel_width  # 10 * 20
    assert_equal 160, panel.pixel_height # 8 * 20
  end

  def test_should_detect_overlap
    # Create first panel
    panel1 = DashboardPanel.create!(
      dashboard: @dashboard,
      title: "Panel 1",
      panel_type: "text",
      grid_x: 0,
      grid_y: 0,
      grid_width: 10,
      grid_height: 10
    )

    # Try to create overlapping panel
    panel2 = DashboardPanel.new(
      dashboard: @dashboard,
      title: "Panel 2", 
      panel_type: "text",
      grid_x: 5,  # Overlaps with panel1
      grid_y: 5,  # Overlaps with panel1
      grid_width: 10,
      grid_height: 10
    )

    assert_not panel2.valid?
    assert panel2.errors[:position].present?
  end

  def test_should_allow_adjacent_panels
    # Create first panel
    panel1 = DashboardPanel.create!(
      dashboard: @dashboard,
      title: "Panel 1",
      panel_type: "text",
      grid_x: 0,
      grid_y: 0,
      grid_width: 10,
      grid_height: 10
    )

    # Create adjacent panel (should be valid)
    panel2 = DashboardPanel.new(
      dashboard: @dashboard,
      title: "Panel 2",
      panel_type: "text",
      grid_x: 10,  # Adjacent to panel1
      grid_y: 0,
      grid_width: 10,
      grid_height: 10
    )

    assert panel2.valid?
    assert panel2.save
  end

  def test_overlaps_with_method
    panel1 = DashboardPanel.new(
      id: 1,
      grid_x: 0, grid_y: 0, grid_width: 10, grid_height: 10
    )

    panel2 = DashboardPanel.new(
      id: 2,
      grid_x: 5, grid_y: 5, grid_width: 10, grid_height: 10
    )

    panel3 = DashboardPanel.new(
      id: 3,
      grid_x: 20, grid_y: 20, grid_width: 10, grid_height: 10
    )

    assert panel1.overlaps_with?(panel2)
    assert panel2.overlaps_with?(panel1)
    assert_not panel1.overlaps_with?(panel3)
    assert_not panel3.overlaps_with?(panel1)
  end

  def test_should_snap_to_grid
    panel = DashboardPanel.new(
      dashboard: @dashboard,
      title: "Test Panel",
      panel_type: "text",
      grid_x: 5.7,    # Should snap to 5
      grid_y: 3.2,    # Should snap to 3
      grid_width: 9.8,  # Should snap to 9, then min constraint to 4
      grid_height: 2.1  # Should snap to 2, then min constraint to 4
    )

    panel.valid?  # Triggers validation and snapping

    assert_equal 5, panel.grid_x
    assert_equal 3, panel.grid_y
    assert_equal 9, panel.grid_width  # 9.8 truncated to 9
    assert_equal 4, panel.grid_height # 2.1 truncated to 2, then min constraint to 4
  end

  def test_should_validate_panel_type
    panel = DashboardPanel.new(
      dashboard: @dashboard,
      title: "Test Panel",
      panel_type: "invalid_type",
      grid_x: 0,
      grid_y: 0,
      grid_width: 10,
      grid_height: 10
    )

    assert_not panel.valid?
    assert panel.errors[:panel_type].present?
  end

  def test_should_parse_panel_config_json
    panel = DashboardPanel.new(
      dashboard: @dashboard,
      title: "Test Panel",
      panel_type: "text",
      grid_x: 0,
      grid_y: 0,
      grid_width: 10,
      grid_height: 10
    )

    # Test setting config as hash
    config_hash = { "text_content" => "Hello World", "color" => "blue" }
    panel.config = config_hash

    assert_equal config_hash, panel.config
    assert_equal '{"text_content":"Hello World","color":"blue"}', panel.panel_config
  end
end
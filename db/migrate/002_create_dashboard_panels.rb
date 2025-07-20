class CreateDashboardPanels < ActiveRecord::Migration[7.0]
  def change
    create_table :dashboard_panels do |t|
      t.references :dashboard, null: false, foreign_key: true
      t.string :title, null: false, limit: 100
      t.string :panel_type, null: false, limit: 50
      t.integer :position_x, null: false, default: 0
      t.integer :position_y, null: false, default: 0
      t.integer :width, null: false, default: 200
      t.integer :height, null: false, default: 200
      t.integer :grid_x, null: false, default: 0
      t.integer :grid_y, null: false, default: 0
      t.integer :grid_width, null: false, default: 10
      t.integer :grid_height, null: false, default: 10
      t.text :panel_config
      t.boolean :visible, null: false, default: true
      t.integer :z_index, null: false, default: 1

      t.timestamps
    end

    add_index :dashboard_panels, [:dashboard_id, :panel_type]
    add_index :dashboard_panels, [:dashboard_id, :grid_x, :grid_y], name: 'index_dashboard_panels_on_position'
  end
end
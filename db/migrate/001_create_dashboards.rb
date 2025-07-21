class CreateDashboards < ActiveRecord::Migration[6.1]
  def change
    create_table :dashboards do |t|
      t.string :name, null: false, limit: 100
      t.text :description
      t.references :user, null: false, foreign_key: true
      t.boolean :is_default, default: false
      t.text :layout_config
      t.timestamps
    end

    add_index :dashboards, [:user_id, :is_default]
  end
end
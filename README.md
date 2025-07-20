# Redmine Custom Dashboards Plugin

A Redmine plugin that allows users to create and manage custom dashboards with interactive panel layouts and personalized widgets.

## Features

### Dashboard Management
- **Personal Dashboard Creation**: Users can create multiple custom dashboards with unique names and descriptions
- **Default Dashboard**: Set one dashboard as default that appears when clicking "Dashboard" in the global menu
- **User-specific Access**: Each user manages their own dashboards with proper access control
- **Multi-language Support**: Available in English and Japanese

### Interactive Panel Customization
- **Drag & Drop Interface**: Move panels freely within the dashboard using intuitive drag and drop
- **Real-time Resizing**: Dynamically adjust panel sizes by dragging resize handles
- **Grid-based Layout**: Panels snap to a 20px grid system for precise positioning and alignment
- **Collision Detection**: Automatic prevention of panel overlaps with visual feedback
- **Live Preview**: See panel placement before finalizing position

### Panel Management
- **Multiple Panel Types**: Support for 7 different panel types:
  - **Text Panel**: Custom text content and notes
  - **Chart Panel**: Data visualization and charts
  - **List Panel**: Custom lists and bullet points
  - **Calendar Panel**: Calendar views and events
  - **Issues Panel**: Issue tracking and management
  - **Activity Panel**: Recent activity feeds
  - **Custom Panel**: Flexible custom content

- **Panel Operations**:
  - Add new panels with click-to-place positioning
  - Edit panel content and configuration
  - Delete unwanted panels
  - Move and resize existing panels
  - Z-index management for layering

### Technical Features
- **Ajax API**: Real-time panel updates without page refresh
- **Grid Constraints**: Minimum 4x4 grid (80x80px), maximum 50x50 grid (1000x1000px)
- **Dashboard Boundaries**: Maximum dashboard size of 60x40 grid (1200x800px)
- **Responsive Design**: Clean interface that adapts to different screen sizes

## Installation

1. Clone this plugin into your Redmine plugins directory:
   ```bash
   cd /path/to/redmine/plugins
   git clone https://github.com/takenory/redmine_custom_dashboards.git
   ```

2. Install plugin dependencies and run migration:
   ```bash
   cd /path/to/redmine
   bundle install
   bundle exec rake redmine:plugins:migrate RAILS_ENV=production
   ```

3. Restart your Redmine application.

4. The plugin should now appear in Administration > Plugins.

## Usage

### Accessing Dashboards

- Click "Dashboard" in the global menu to view your default dashboard
- If no default dashboard is set, you'll be redirected to the dashboard list
- Access "My Dashboards" through the account page sidebar or main menu

### Creating Dashboards

1. Go to "My Dashboards" from your account page
2. Click "New Dashboard"
3. Fill in the dashboard name and description
4. Optionally set it as your default dashboard
5. Save the dashboard

### Customizing Dashboard Layout

1. **Enter Customize Mode**: Click the "Customize" button on your dashboard
2. **Add Panels**: 
   - Select panel type from dropdown
   - Click "Add Panel" 
   - Click anywhere on the grid to place the panel
3. **Move Panels**: Drag panels to new positions
4. **Resize Panels**: Drag the resize handle in the bottom-right corner
5. **Remove Panels**: Click the delete button (×) on any panel
6. **Save Changes**: Click "Save Layout" or "Cancel" to discard changes

### Managing Dashboards

- **View**: Click on a dashboard name to see its content
- **Edit**: Modify dashboard settings and layout using the customize mode
- **Set as Default**: Make a dashboard your default through the dashboard list
- **Delete**: Remove dashboards you no longer need

## Development

### Running Tests

```bash
cd /path/to/redmine
bundle exec rake redmine:plugins:test NAME=redmine_custom_dashboards RAILS_ENV=test
```

## Compatibility

- **Redmine**: 6.0+
- **Rails**: 7.2+
- **Ruby**: 3.0+

## License

This plugin is available under the MIT License.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and feature requests, please use the GitHub issue tracker.
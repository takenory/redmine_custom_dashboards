# Redmine Custom Dashboards Plugin

A Redmine plugin that allows users to create and manage custom dashboards with personalized widgets and layouts.

## Features

- **Personal Dashboard Management**: Users can create multiple custom dashboards
- **Default Dashboard**: Set one dashboard as default that appears when clicking "Dashboard" in the global menu
- **Widget-based Layout**: Configure dashboard layouts with various widgets
- **User-specific Access**: Each user manages their own dashboards with proper access control
- **Multi-language Support**: Available in English and Japanese

## Installation

1. Clone this plugin into your Redmine plugins directory:
   ```bash
   cd /path/to/redmine/plugins
   git clone https://github.com/yourusername/redmine_custom_dashboards.git
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
- Access "My Dashboards" through the account page sidebar

### Creating Dashboards

1. Go to "My Dashboards" from your account page
2. Click "New Dashboard"
3. Fill in the dashboard name and description
4. Optionally set it as your default dashboard
5. Save the dashboard

### Managing Dashboards

- **View**: Click on a dashboard name to see its content
- **Edit**: Modify dashboard settings and layout
- **Set as Default**: Make a dashboard your default through the dashboard list
- **Delete**: Remove dashboards you no longer need

## Development

### Running Tests

```bash
cd /path/to/redmine
bundle exec rake redmine:plugins:test NAME=redmine_custom_dashboards RAILS_ENV=test
```

### Project Structure

```
redmine_custom_dashboards/
├── app/
│   ├── controllers/dashboards_controller.rb
│   ├── models/dashboard.rb
│   └── views/dashboards/
├── config/
│   ├── locales/
│   └── routes.rb
├── db/migrate/
├── lib/redmine_custom_dashboards/
├── test/
└── docs/
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
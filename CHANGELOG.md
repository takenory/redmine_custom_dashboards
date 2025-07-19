# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions CI/CD workflow for automated testing
- RuboCop configuration for code style enforcement
- Brakeman security scanning
- Contributing guidelines and issue templates
- Pull request template

## [1.0.0] - 2024-07-19

### Added
- Initial release of Redmine Custom Dashboards plugin
- User-specific dashboard management functionality
- Default dashboard functionality with global menu integration
- Widget-based layout system (foundation)
- Multi-language support (English/Japanese)
- Complete MVC architecture following Redmine conventions
- Database migration for dashboard storage
- User access control and authorization
- Comprehensive test suite (44 tests covering unit, functional, and integration)
- Dashboard CRUD operations (Create, Read, Update, Delete)
- Set dashboard as default functionality
- Account settings integration with sidebar navigation
- CSS styling for dashboard interface
- Documentation with implementation flow diagrams

### Features
- **Dashboard Management**: Create, edit, delete, and list personal dashboards
- **Default Dashboard**: Set one dashboard as default, accessible via global menu
- **Access Control**: User-specific dashboards with proper authorization
- **Redmine Integration**: Seamless integration with Redmine's menu and account systems
- **Internationalization**: Full support for English and Japanese languages
- **Responsive Design**: Clean, user-friendly interface

### Technical Details
- Compatible with Redmine 6.0+ and Rails 7.2+
- Uses ActiveRecord for database operations
- Follows Redmine plugin development conventions
- Comprehensive error handling and validation
- Test coverage includes unit, functional, and integration tests
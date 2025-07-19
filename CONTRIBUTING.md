# Contributing to Redmine Custom Dashboards

Thank you for your interest in contributing to Redmine Custom Dashboards! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct. Please be respectful and professional in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/takenory/redmine_custom_dashboards/issues)
2. Use the bug report template when creating a new issue
3. Include as much detail as possible: environment, steps to reproduce, expected vs actual behavior

### Suggesting Features

1. Check if the feature has already been requested
2. Use the feature request template when creating a new issue
3. Clearly describe the use case and expected behavior

### Contributing Code

1. **Fork the repository**
2. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation if needed
4. **Run tests**
   ```bash
   bundle exec rake redmine:plugins:test NAME=redmine_custom_dashboards RAILS_ENV=test
   ```
5. **Run linting**
   ```bash
   rubocop
   ```
6. **Commit your changes** with descriptive commit messages
7. **Push to your fork**
8. **Create a Pull Request** using the PR template

## Development Setup

### Prerequisites

- Ruby 3.1 or higher
- Redmine 5.1 or higher
- PostgreSQL or MySQL database

### Local Development

1. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/redmine_custom_dashboards.git
   ```

2. Set up Redmine development environment:
   ```bash
   # Download and set up Redmine
   wget https://www.redmine.org/releases/redmine-6.0.1.tar.gz
   tar -xzf redmine-6.0.1.tar.gz
   mv redmine-6.0.1 redmine
   
   # Copy plugin to Redmine
   cp -r redmine_custom_dashboards redmine/plugins/
   
   # Install dependencies
   cd redmine
   bundle install
   
   # Set up database
   bundle exec rake db:create RAILS_ENV=development
   bundle exec rake db:migrate RAILS_ENV=development
   bundle exec rake redmine:plugins:migrate RAILS_ENV=development
   ```

3. Run tests:
   ```bash
   bundle exec rake redmine:plugins:test NAME=redmine_custom_dashboards RAILS_ENV=test
   ```

## Code Style

- Follow Ruby style guidelines
- Use RuboCop for linting (configuration in `.rubocop.yml`)
- Write descriptive commit messages
- Add documentation for new features
- Include tests for all new functionality

## Testing

- All tests must pass before submitting a PR
- Add tests for new features and bug fixes
- Tests are located in the `test/` directory
- Use the existing test patterns and fixtures

## CI/CD

GitHub Actions automatically runs tests on:
- Ruby versions: 3.1, 3.2
- Redmine versions: 5.1.4, 6.0.1
- Databases: PostgreSQL, MySQL

All checks must pass before a PR can be merged.

## Release Process

1. Update version in `init.rb`
2. Update `CHANGELOG.md`
3. Create a new tag: `git tag v1.x.x`
4. Push tags: `git push --tags`
5. Create a GitHub release

## Questions?

If you have questions about contributing, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue with the question label

Thank you for contributing!
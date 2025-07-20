# CI Workflow Test

This file is created to test the GitHub Actions CI workflow.

## Test Coverage

The CI workflow will test:
- Ruby versions: 3.1, 3.2
- Redmine versions: 5.1.4, 6.0.1
- Databases: MySQL, PostgreSQL
- Linting with RuboCop
- Security scanning with Brakeman

## Expected Results

All tests should pass:
- 44 test cases
- 0 failures
- 0 errors
- RuboCop should pass with minor warnings (acceptable)
- Brakeman should find no security issues
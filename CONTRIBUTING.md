# Contributing to RunScheduler

Thank you for your interest in contributing to RunScheduler! This guide will help you get started.

## Development Setup

### Prerequisites
- Node.js 18+ and npm 8+
- Git
- A code editor (VS Code recommended)

### Getting Started

1. **Fork and clone the repository**
```bash
git clone https://github.com/njrun1804/RunScheduler.git
cd RunScheduler
```

2. **Install dependencies**
```bash
# Core dependencies
npm install

# UI dependencies
cd web
npm install
```

3. **Run tests**
```bash
# From root directory
npm test
```

4. **Start development server**
```bash
cd web
npm run dev
```

## Project Structure

- `src/` - Core scheduling algorithm (TypeScript)
- `web/` - Next.js UI application
- `src/planner.test.ts` - Test suite

## Development Workflow

### Making Changes

1. Create a feature branch
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following the coding standards

3. Write/update tests for your changes

4. Ensure all tests pass
```bash
npm test
```

5. Test the UI if applicable
```bash
cd web && npm run dev
```

### Code Style

#### TypeScript
- Use strict typing (`strict: true` in tsconfig)
- Prefer `const` over `let`
- Use descriptive variable names
- Document complex logic with comments

#### React/Next.js
- Use functional components with hooks
- Keep components focused and single-purpose
- Use TypeScript for all component props

#### Testing
- Write tests for new functionality
- Follow existing test patterns
- Aim for descriptive test names

### Commit Guidelines

We follow conventional commits:

```
type(scope): description

[optional body]
[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

Examples:
```bash
feat(planner): add support for recovery weeks
fix(ui): correct spacing calculation for back-to-back qualities
docs: update README with new examples
```

## Testing Guidelines

### Unit Tests
- Test individual functions in isolation
- Cover edge cases and error conditions
- Use descriptive test names

### Integration Tests
- Test complete scheduling scenarios
- Verify constraint satisfaction
- Test UI interactions

### Test Structure
```typescript
describe('Feature', () => {
  it('should do expected behavior', () => {
    // Arrange
    const input = {...};

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toEqual(expected);
  });
});
```

## Adding New Features

### Adding a New Quality Type

1. Add to `QUALITY_CATALOG` in `src/planner.ts`
```typescript
"Your Quality": {
  key: "Your Quality",
  before: 1,
  after: 1,
  weight: 2,
  desc: "Description"
}
```

2. Add tests in `src/planner.test.ts`

3. The UI will automatically include it

### Adding a New Long Run Type

1. Add to `LONG_RULES` in `src/planner.ts`
```typescript
yourtype: {
  key: "yourtype",
  label: "Your Type",
  before: 2,
  after: 2
}
```

2. Update `LongKey` type
3. Add tests for the new blocking pattern

## Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: How to trigger the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser, OS, Node version
6. **Screenshots**: If applicable

## Feature Requests

For feature requests, please include:

1. **Use Case**: Why is this feature needed?
2. **Proposed Solution**: How might it work?
3. **Alternatives**: Other approaches considered
4. **Additional Context**: Examples, mockups, etc.

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new functionality
4. Keep PR focused on a single concern
5. Write a clear PR description

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] Added new tests
- [ ] Tested UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Updated documentation
- [ ] No console errors
```

## Questions?

Feel free to open an issue for:
- Questions about the codebase
- Clarification on requirements
- Discussion of potential features

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions

Thank you for helping make RunScheduler better for runners everywhere! 🏃‍♂️🏃‍♀️
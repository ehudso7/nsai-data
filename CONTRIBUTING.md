# Contributing to NSAI Data

Thank you for your interest in contributing to NSAI Data! We welcome contributions to our SDKs and documentation.

## 📋 What Can You Contribute?

### ✅ We Accept:
- **SDK Improvements**: Bug fixes, performance enhancements, new features
- **Documentation**: Corrections, clarifications, new examples
- **Examples**: New usage examples in different languages/frameworks
- **Bug Reports**: Detailed reports of SDK issues
- **Feature Requests**: Suggestions for SDK functionality

### ❌ We Don't Accept:
- Changes to the core platform (backend, infrastructure)
- Self-hosting guides or deployment instructions
- Modifications that enable running NSAI Data independently
- Changes to licensing or terms of service

## 🚀 Getting Started

1. **Fork the Repository**: Click the "Fork" button on GitHub
2. **Clone Your Fork**: 
   ```bash
   git clone https://github.com/your-username/nsai-data.git
   cd nsai-data
   ```
3. **Create a Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Guidelines

### Python SDK

1. **Setup Development Environment**:
   ```bash
   cd sdk/python
   pip install -e ".[dev]"
   ```

2. **Run Tests**:
   ```bash
   pytest
   ```

3. **Code Style**:
   ```bash
   black nsai/
   mypy nsai/
   ```

### JavaScript/TypeScript SDK

1. **Setup Development Environment**:
   ```bash
   cd sdk/javascript
   npm install
   ```

2. **Build**:
   ```bash
   npm run build
   ```

3. **Run Tests**:
   ```bash
   npm test
   ```

4. **Lint**:
   ```bash
   npm run lint
   ```

## 🐛 Reporting Bugs

Please create an issue with:
- SDK version
- Python/Node.js version
- Minimal code to reproduce
- Expected vs actual behavior
- Error messages/stack traces

## 💡 Feature Requests

When requesting features:
- Explain the use case
- Provide examples of how it would work
- Consider backward compatibility

## 📥 Pull Request Process

1. **Update Documentation**: Include relevant documentation updates
2. **Add Tests**: Cover new functionality with tests
3. **Follow Style Guides**: Use the project's coding standards
4. **Update CHANGELOG**: Note your changes
5. **Small PRs**: Keep pull requests focused and small
6. **Clear Description**: Explain what and why

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Updated documentation

## Related Issues
Fixes #123
```

## 📄 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Publishing private information
- Inappropriate conduct

## 📞 Questions?

- **Discord**: [Join our community](https://discord.gg/nsai-data)
- **Email**: developers@nsaidata.com
- **Documentation**: [https://docs.nsaidata.com](https://docs.nsaidata.com)

## ⚖️ Legal

By contributing, you agree that your contributions will be licensed under the same license as the project and that NSAI Data may use your contributions in the commercial service.

Thank you for helping make NSAI Data better! 🎉
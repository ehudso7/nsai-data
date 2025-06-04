# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The NSAI Data team takes security seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### Where to Report

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@nsaidata.com**

### What to Include

Please include the following information:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Resolution Timeline**: Depends on severity
  - Critical: 7 days
  - High: 14 days
  - Medium: 30 days
  - Low: 90 days

## Security Measures

### API Security
- All API communications use TLS 1.3
- API keys are hashed using bcrypt with salt
- Rate limiting prevents abuse
- Request signing available for enterprise customers

### Data Protection
- End-to-end encryption for sensitive data
- No storage of research content after processing (unless explicitly requested)
- GDPR compliant data handling
- Right to deletion honored within 30 days

### Infrastructure Security
- WAF protection on all endpoints
- DDoS mitigation
- Regular penetration testing
- 24/7 security monitoring
- Automated vulnerability scanning

## Bug Bounty Program

We run a private bug bounty program for security researchers. If you're interested in participating:

1. Email security@nsaidata.com with your background
2. We'll provide program details and scope
3. Rewards range from $100 to $10,000 based on severity

## Security Best Practices for SDK Users

### API Key Management
```python
# DON'T hardcode API keys
client = NSAIClient(api_key="sk_live_...")  # Bad!

# DO use environment variables
client = NSAIClient(api_key=os.getenv("NSAI_API_KEY"))  # Good!
```

### Secure Storage
- Never commit API keys to version control
- Use secret management services (AWS Secrets Manager, HashiCorp Vault)
- Rotate API keys regularly
- Use separate keys for development and production

### Network Security
- Always verify SSL certificates
- Use webhook signatures to verify payloads
- Implement request timeouts
- Log security events

## Compliance

NSAI Data maintains the following compliance certifications:

- **SOC 2 Type II** - Annual audit
- **GDPR** - EU data protection
- **CCPA** - California privacy rights
- **HIPAA** - Healthcare data (Enterprise only)
- **ISO 27001** - Information security (In progress)

## Contact

- Security Issues: security@nsaidata.com
- General Support: support@nsaidata.com
- Enterprise Security: enterprise-security@nsaidata.com

---

Thank you for helping keep NSAI Data and our users safe!
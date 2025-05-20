# Authentication Documentation

## Overview
The authentication system provides two authentication methods:
1. Traditional email/password authentication
2. Passwordless authentication via magic links

## Features

### 1. User Registration
- Email-based registration with optional password
- Automatic email verification process
- Prevents duplicate email registrations
- Optional name field

```typescript
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepassword123", // optional
  "name": "John Doe" // optional
}
```

### 2. Email Verification
- Required for password-based authentication
- Verification link sent via email
- Token-based verification system
- Expiration handling

```typescript
GET /api/auth/verify-email?token=verification_token
```

### 3. Password-based Authentication
- Secure password hashing using bcrypt
- JWT-based session management
- Token expiration (24 hours)
- Protection against common attacks

```typescript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### 4. Password Management
#### Reset Password Flow
1. Request password reset:
```typescript
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}
```

2. Reset using token:
```typescript
POST /api/auth/reset-password
{
  "token": "reset_token",
  "newPassword": "newSecurePassword123"
}
```

#### Change Password (Authenticated)
```typescript
POST /api/auth/change-password
{
  "oldPassword": "currentPassword123",
  "newPassword": "newSecurePassword123"
}
```

### 5. Magic Link Authentication
- Passwordless authentication option
- Time-limited magic links (30 minutes)
- Automatic user creation for new emails
- Secure token generation

1. Request magic link:
```typescript
POST /api/auth/magic-link
{
  "email": "user@example.com"
}
```

2. Verify magic link:
```typescript
GET /api/auth/verify-magic-link?token=magic_link_token
```

## Security Features

### Token Security
- JWT tokens with 24-hour expiration
- Secure token generation using crypto
- Environment-based JWT secret key

### Password Security
- Bcrypt hashing with salt rounds of 12
- Password strength validation
- Protection against timing attacks

### Email Security
- Verification required for sensitive operations
- Time-limited tokens for all email-based actions
- Secure email templates with HTML/text alternatives

### API Security
- Rate limiting (to be implemented)
- CORS protection (to be implemented)
- Protection against email enumeration
- Secure headers (to be implemented)

## Response Formats

### Success Response
```typescript
{
  "user": {
    "id": number,
    "email": string,
    "name": string | null,
    "verified": boolean
  },
  "token": string // JWT token
}
```

### Error Response
```typescript
{
  "error": string
}
```

## Environment Configuration
Required environment variables:
```bash
# JWT Configuration
JWT_SECRET=your-secret-key

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=noreply@example.com

# Application
APP_URL=http://localhost:3000
```

## Best Practices Implementation
1. **Security**
   - No password storage in plain text
   - Secure token generation
   - Protection against timing attacks
   - Email verification requirement

2. **Error Handling**
   - Consistent error responses
   - No sensitive information in errors
   - Proper HTTP status codes

3. **Email Communications**
   - HTML and text email versions
   - Clear call-to-action in emails
   - Proper email templates

4. **Token Management**
   - Proper expiration handling
   - Secure token generation
   - One-time use tokens 
# User Registration Service Demo

A demonstration project showcasing shift-left testing with Testcontainers, focusing on email case-sensitivity bug detection.

## Project Structure

Express.js backend with TypeORM for database access
Jest for testing
Testcontainers for integration tests
Three levels of tests: Unit, Integration, and E2E


The Bug:
Email uniqueness check is case-sensitive
Could allow duplicate registrations with different cases (e.g., user@example.com and USER@example.com)
Real-world issue that could cause authentication problems

## The Bug: Email Case-Sensitivity Issue

### Problem Description
The application has a critical bug in email uniqueness validation:
- System allows registration of the same email with different cases (e.g., user@example.com and USER@example.com)
- PostgreSQL's UNIQUE constraint is case-sensitive by default
- Could lead to authentication issues and security vulnerabilities
- Affects user identity management and login functionality

### Test Coverage Analysis

#### Unit Tests (`src/tests/unit/UserService.test.ts`)
typescript
it("should reject registration when exact email match exists")
it("should reject registration with null email")
it("should reject registration with undefined email")

#### Integration Tests (`src/tests/integration/UserService.integration.test.ts`)
✅ Catches the bug because:
- Uses real PostgreSQL database via Testcontainers
- Tests case-insensitive email uniqueness
- Verifies email storage format

#### E2E Tests (`src/tests/e2e/UserRegistration.docker.e2e.test.ts`)
```typescript
test('should prevent registration with same email in different case')
```
✅ Verifies the fix through:
- Complete user registration flow
- UI interaction testing
- Error message display verification
- Database state validation

### The Fix

1. Service Layer Fix (`src/service/UserService.ts`):
```typescript
const existingUser = await this.userRepository
    .createQueryBuilder("user")
    .where("LOWER(user.email) = LOWER(:email)", { email })
    .getOne();
```

2. Database Level Fix (Optional):
```sql
CREATE UNIQUE INDEX user_email_lower_idx ON "user" (LOWER(email));
```

## Development Setup

### Prerequisites
- Node.js 16+
- Docker and Docker Compose
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install
```

### Running the Application
```bash
# Start all services
npm run docker:up

# Start development server
npm run dev

# Access the application
Frontend: http://localhost:5173
Backend API: http://localhost:3000
```

### Running Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Run all tests
npm test
```

## Docker Services
```yaml
services:
  postgres:      # Database service
  backend:       # Node.js API service
  frontend:      # React frontend service
  pgadmin:       # Database management UI
```

## Value of Shift-Left Testing

This bug demonstrates the importance of testing with real dependencies early:

1. Test Execution Time:
   - Unit Tests: ~100ms (miss the bug)
   - Integration Tests: ~1s (catch the bug)
   - E2E Tests: ~5s (verify the fix)

2. Bug Detection Timeline:
   - Unit Tests ❌: Miss due to mocked dependencies
   - Integration Tests ✅: Catch early with real database
   - E2E Tests ✅: Would catch late in testing cycle
   - Production ❌: Would cause user issues

3. Benefits of Testcontainers:
   - Reliable test environment
   - Real database behavior
   - Fast feedback loop
   - Consistent test results
   - No external dependencies

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
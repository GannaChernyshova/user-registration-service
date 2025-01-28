import { DataSource } from "typeorm";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { User } from "../../entity/User";
import { UserRegistrationService } from "../../service/UserService";
import { EmailService } from "../../service/EmailService";

describe("UserRegistrationService - Integration Tests", () => {
    let container: StartedPostgreSqlContainer;
    let dataSource: DataSource;
    let userService: UserRegistrationService;
    
    beforeAll(async () => {
        container = await new PostgreSqlContainer("postgres:16")
            .withDatabase("testdb")
            .withUsername("test")
            .withPassword("test")
            .withStartupTimeout(120000) 
            .start();

        await new Promise(resolve => setTimeout(resolve, 1000));

        dataSource = new DataSource({
            type: "postgres",
            host: container.getHost(),
            port: container.getMappedPort(5432),
            username: container.getUsername(),
            password: container.getPassword(),
            database: container.getDatabase(),
            entities: [User],
            synchronize: true,
            logging: true,
            connectTimeoutMS: 5000
        });

        await dataSource.initialize();
        await dataSource.query('SELECT 1');

        const userRepository = dataSource.getRepository(User);
        const emailService = new EmailService();
        userService = new UserRegistrationService(userRepository, emailService);
    }, 30000);

    beforeEach(async () => {
        await dataSource.query('TRUNCATE TABLE "user" CASCADE');
    });

    afterAll(async () => {
        if (dataSource?.isInitialized) {
            await dataSource.destroy();
        }
        if (container) {
            await container.stop();
        }
    });

    it("should not allow duplicate emails regardless of case", async () => {
        // First registration succeeds
        await userService.registerUser("test@example.com", "user1");

        // Second registration with different case should fail
        await expect(
            userService.registerUser("TEST@example.com", "user2")
        ).rejects.toThrow("Email already registered");
    });

    it("should reject registration with same email in different case", async () => {
        // First registration with lowercase
        const user1 = await userService.registerUser("user@example.com", "user1");
        expect(user1.email).toBe("user@example.com");
        
        // Second registration should fail
        await expect(
            userService.registerUser("USER@EXAMPLE.COM", "user2")
        ).rejects.toThrow("Email already registered");
        
        // Verify only one user exists
        const users = await dataSource.getRepository(User).find();
        expect(users.length).toBe(1);
    });

    // New test cases
    it("should handle multiple valid registrations", async () => {
        const users = [
            { email: "user1@example.com", username: "user1" },
            { email: "user2@example.com", username: "user2" },
            { email: "user3@example.com", username: "user3" }
        ];

        for (const user of users) {
            const result = await userService.registerUser(user.email, user.username);
            expect(result.email).toBe(user.email);
            expect(result.username).toBe(user.username);
        }
    });

    it("should reject registration with invalid email formats", async () => {
        const invalidEmails = [
            "notanemail",
            "missing@domain",
            "@nodomain.com",
            "spaces in@email.com"
        ];

        for (const email of invalidEmails) {
            await expect(
                userService.registerUser(email, "username")
            ).rejects.toThrow("Invalid email format");
        }
    });
}); 
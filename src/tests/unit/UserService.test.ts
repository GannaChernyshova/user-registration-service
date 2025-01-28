import { User } from "../../entity/User";
import { UserRegistrationService } from "../../service/UserService";
import { EmailService } from "../../service/EmailService";
import { Repository } from "typeorm";

describe("UserRegistrationService - Unit Tests", () => {
    let userService: UserRegistrationService;
    let mockUserRepository: jest.Mocked<Repository<User>>;
    let mockEmailService: jest.Mocked<EmailService>;

    beforeEach(() => {
        mockUserRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
        } as any;

        mockEmailService = {
            sendVerificationEmail: jest.fn(),
        } as any;

        userService = new UserRegistrationService(
            mockUserRepository,
            mockEmailService
        );
    });

    it("should validate email format", async () => {
        await expect(
            userService.registerUser("invalid-email", "username")
        ).rejects.toThrow("Invalid email format");
    });

    it("should register valid user", async () => {
        const email = "test@example.com";
        const username = "testuser";

        mockUserRepository.findOne.mockResolvedValue(null);
        mockUserRepository.save.mockImplementation(user => Promise.resolve({
            ...user,
            id: 1,
            status: "PENDING"
        } as User));

        const result = await userService.registerUser(email, username);

        expect(result.email).toBe(email);
        expect(result.username).toBe(username);
        expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(email);
    });

    it("should reject registration when exact email match exists", async () => {
        const email = "test@example.com";
        mockUserRepository.findOne.mockResolvedValue({ 
            id: 1, 
            email, 
            username: "existing",
            status: "PENDING"
        } as User);
        
        await expect(
            userService.registerUser(email, "username")
        ).rejects.toThrow("Email already registered");
    });

    it("should reject registration with null email", async () => {
        await expect(
            userService.registerUser(null as any, "username")
        ).rejects.toThrow("Invalid email format");
    });

    it("should reject registration with undefined email", async () => {
        await expect(
            userService.registerUser(undefined as any, "username")
        ).rejects.toThrow("Invalid email format");
    });
}); 
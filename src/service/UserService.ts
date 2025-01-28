import { Repository, QueryFailedError, ILike } from "typeorm";
import { User } from "../entity/User";
import { EmailService } from "./EmailService";

export class UserRegistrationService {
    constructor(
        private userRepository: Repository<User>,
        private emailService: EmailService
    ) {}

    async registerUser(email: string, username: string): Promise<User> {
        try {
            // Validate email format
            if (!this.isValidEmail(email)) {
                throw new Error("Invalid email format");
            }

            if (!username || username.trim() === '') {
                throw new Error("Username is required");
            }

            // Use case-sensitive comparison instead
            const existingUser = await this.userRepository.findOne({
                where: { 
                    email: email  // This will do case-sensitive comparison
                }
            });

            if (existingUser) {
                throw new Error("Email already registered");
            }

            // Create new user with original email case
            const user = new User();
            user.email = email;  // Store email with original case
            user.username = username;
            user.status = "PENDING";

            const savedUser = await this.userRepository.save(user);
            await this.emailService.sendVerificationEmail(email);

            return savedUser;
        } catch (error) {
            // Convert database errors to domain errors
            if (error instanceof QueryFailedError) {
                if (error.message.includes('unique constraint') && 
                    error.message.includes('email')) {
                    throw new Error("Email already registered");
                }
                // Log unexpected database errors but return a generic message
                console.error('Database error:', error);
                throw new Error("Registration failed");
            }
            throw error;
        }
    }

    private isValidEmail(email: string): boolean {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
} 
export class EmailService {
    async sendVerificationEmail(email: string): Promise<void> {
        // Simulate email sending with network delay
        await new Promise(resolve => setTimeout(resolve, 100));
    }
} 
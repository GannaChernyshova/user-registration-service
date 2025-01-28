import express from "express";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { UserRegistrationService } from "./service/UserService";
import { EmailService } from "./service/EmailService";
import cors from "cors";

export function createApp(dataSource: DataSource) {
    const app = express();
    app.use(cors());
    app.use(express.json());

    const userRepository = dataSource.getRepository(User);
    const emailService = new EmailService();
    const userService = new UserRegistrationService(userRepository, emailService);

    app.post("/api/users/register", async (req, res) => {
        try {
            const { email, username } = req.body;
            
            if (!email || !username) {
                return res.status(400).json({ error: "Email and username are required" });
            }

            const user = await userService.registerUser(email, username);
            res.json(user);
        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: "An unexpected error occurred" });
        }
    });

    return app;
} 
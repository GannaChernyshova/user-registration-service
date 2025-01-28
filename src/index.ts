import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { createApp } from "./app";

async function main() {
    const dataSource = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        username: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "userdb",
        entities: [User],
        synchronize: true
    });

    await dataSource.initialize();
    
    const app = createApp(dataSource);
    const port = process.env.PORT || 3000;
    
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

main().catch(console.error); 
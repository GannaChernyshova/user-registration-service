FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Create separate tsconfig for backend
RUN echo '{\
  "compilerOptions": {\
    "target": "ES2020",\
    "module": "commonjs",\
    "outDir": "./dist",\
    "rootDir": "./src",\
    "strict": true,\
    "esModuleInterop": true,\
    "experimentalDecorators": true,\
    "emitDecoratorMetadata": true\
  },\
  "include": ["src/**/*"],\
  "exclude": ["node_modules", "dist", "src/frontend/**/*"]\
}' > tsconfig.backend.json

# Build backend only using tsc directly
RUN ./node_modules/.bin/tsc -p tsconfig.backend.json

EXPOSE 3000

CMD ["node", "dist/index.js"] 
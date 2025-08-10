# Use the official Node.js 22 image
FROM node:22

# Install required dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    libnss3 libxss1 libasound2 libxcomposite1 libxcursor1 \
    libxdamage1 libxext6 libxi6 libxrandr2 libxtst6 \
    fonts-liberation libappindicator3-1 libgbm-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json .npmrc ./

# Install dependencies
RUN npm install

# Remove .npmrc after installation for security
RUN rm -f .npmrc

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Set the default command
CMD ["npm", "run", "dev"]
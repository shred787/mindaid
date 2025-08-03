FROM node:18-bullseye

# (Optional) Install docker client if you plan to use docker-compose
RUN apt-get update \
 && apt-get install -y docker.io \
 && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

WORKDIR /workspace

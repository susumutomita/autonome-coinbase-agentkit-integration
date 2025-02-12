FROM node:23

WORKDIR /app

RUN npm install -g pnpm

# Copy package files (if needed for runtime scripts)
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install

COPY . .

RUN pnpm run build
# Copy entrypoint script and set execution permissions
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set production environment variables
ENV NODE_ENV=production
ENV DAEMON_PROCESS=true
ENV SERVER_PORT=3000

# Set entrypoint and command:
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "build/index.js"]

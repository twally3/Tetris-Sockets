###############################################################################
# Step 4 : Run image
#
FROM node:10-alpine
WORKDIR /src

# Set the node ENV to production
ENV NODE_ENV=production

# Copy distribution source files to container from builder
COPY package*.json ./
COPY ./client ./client
COPY ./server ./server

RUN npm ci

EXPOSE 8080

# Run the container
CMD ["npm", "start"]
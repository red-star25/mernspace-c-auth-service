# Use the official Nodejs image as our base
FROM node:18
# Set the working dir inside the container (must match bind mount path, e.g. -v $(pwd):/usr/src/app)
WORKDIR /usr/src/app
# Bind mounts on Docker Desktop (esp. macOS) often miss fs events; polling makes nodemon reliable
ENV CHOKIDAR_USEPOLLING=true
# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./
# Install app dependencies
RUN npm install
# Copy the rest of the app's source code into the container
COPY . .
# Expose the port the app will run on
EXPOSE 5501
# The command to run our app
CMD ["npm", "run", "dev"]
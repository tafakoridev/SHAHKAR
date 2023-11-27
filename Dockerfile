FROM registry.morsa.local:5000/node:18-alpine
# Set the timezone to UTC+3:30
ENV TZ=Asia/Tehran
# Update the system's timezone
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
WORKDIR /app
COPY package.json ./
COPY .npmrc ./
RUN npm install --force
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]

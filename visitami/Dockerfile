FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npx update-browserslist-db@latest
COPY . .
ENV GENERATE_SOURCEMAP=false
EXPOSE 3000
CMD ["npm", "start"]
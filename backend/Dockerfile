FROM node:20-alpine 

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install 

# copy toàn bộ code backend vào 
COPY . .

# chạy lệnh tạo Prisma Client 
RUN npx prisma generate

# mở cổng 3000 để giao tiếp 
EXPOSE 3000

# khởi động server 
CMD ["node", "server.js"]
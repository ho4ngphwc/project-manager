require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    const adminEmail = process.env.ADMIN_INITIAL_EMAIL;
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD; 

    if (!adminEmail || !adminPassword) {
        console.error("❌ VUI LÒNG THIẾT LẬP BIẾN MÔI TRƯỜNG ADMIN_INITIAL_EMAIL VÀ ADMIN_INTIAL_PASSWORD TRONG FILE .env");
        process.exit(1);
    }

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail }}); 

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await prisma.user.create({
            data: {
                fullName: "Admin",
                email: adminEmail,
                password: hashedPassword, 
                role: "admin",
                isFirstLogin: true
            }
        }); 

        console.log("✅ Tài khoản admin đã được tạo thành công!");
    }
    else {
        console.log("⚠️ Tài khoản admin đã tồn tại, bỏ qua bước tạo admin.");
    }
}

main()
    .catch((e) => {
        console.error("❌ Lỗi khi seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    })
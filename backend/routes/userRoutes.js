const express = require('express'); 
const bcrypt = require('bcrypt'); 
const { PrismaClient } = require('@prisma/client'); 

const router = express.Router();
const prisma = new PrismaClient(); 

// API: Manager tạo user mới 
router.post('/create', async (req, res) => {
    const { fullName, email, role } = req.body;
    try {
        const existing = await prisma.user.findUnique({ where: { email }}); 
        if (existing) return res.status(400).json({ error: 'Email đã tồn tại!'}); // Đã sửa exisinting

        const defaultPassword = await bcrypt.hash('123456', 10); // Đã sửa Passwrod
        await prisma.user.create({
            data: {
                fullName, 
                email,
                password: defaultPassword, 
                role: role || 'user', 
                isFirstLogin: true
            }
        });
        res.json({ message: 'Đã tạo tài khoản thành công!'});
    }
    catch (error) {
        console.error("Lỗi tạo user:", error);
        res.status(500).json({ error: 'Lỗi tạo tài khoản!' });
    }
});

// API nhân viên đổi mật khẩu lần đầu 
router.post('/change-password', async (req, res) => {
    const { userId, newPassword } = req.body; 
    try {
        // Kiểm tra dữ liệu đầu vào
        if (!userId || !newPassword) {
            return res.status(400).json({ error: 'Thiếu thông tin người dùng hoặc mật khẩu mới!' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10); 
        await prisma.user.update({ 
            where: { id: parseInt(userId) }, 
            data: { 
                password: hashedPassword, 
                isFirstLogin: false 
            } 
        });
        res.json({ message: 'Đổi mật khẩu thành công!'});
    } 
    catch (error) {
        // console.error("Lỗi đổi pass chi tiết:", error); // Log ra terminal soi lỗi thực tế
        res.status(500).json({ error: 'Lỗi đổi mật khẩu!'}); 
    }
});

// API lấy danh sách nhân viên
router.get('/employee', async (req, res) => {
    try {
        const employees = await prisma.user.findMany({
            where : { role: 'user' },
            select : { id: true, fullName: true, email: true }
        });
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi lấy nhân viên'});
    }
});

// API xoá user (chỉ cho admin)
router.delete('/delete/:id', async (req, res) => {
    const targetUserId = parseInt(req.params.id);

    try {
        const targetUser = await prisma.user.findMany({
            where: { id: targetUserId }
        });

        if (!targetUser) {
            return res.status(404).json({ error: "Không tìm thấy nhân viên này!"});
        }

        if (String(targetUser.role).toLowerCase() === 'admin') {
            return res.status(403).json({ error: 'Lỗi: Không được phép xoá tài khoản admin!'})
        }

        await prisma.user.delete({
            where: { id: targetUserId }
        });
    } catch (error) {
        console.error("Lỗi khi xoá user: ", error);
        res.status(500).json({ error: "Lỗi hệ thống khi xoá người dùng!"});
    }
});

module.exports = router;
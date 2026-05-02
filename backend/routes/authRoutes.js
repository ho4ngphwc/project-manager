const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client'); 

const router = express.Router(); 
const prisma = new PrismaClient(); 

// API login 
router.post('/login', async (req, res) => { 
    const { email, password } = req.body; 
    try {
        const user = await prisma.user.findUnique({ where: { email }}); 
        if (!user) return res.status(400).json({ error : 'Email không tồn tại'}); 

        const isMatch = await bcrypt.compare(password, user.password); 
        if (!isMatch) return res.status(400).json({ error: 'Sai mật khẩu!'}); 

        if (user.isFirstLogin) {
            return res.json({ requirePasswordChange: true, userId: user.id, message: 'Vui lòng đổi mật khẩu!'});
        }

        res.json({ user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role}});
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi đăng nhập' });
    }
});

module.exports = router; 
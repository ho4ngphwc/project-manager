const express = require('express'); 
const { PrismaClient } = require('@prisma/client'); 

const router = express.Router();
const prisma = new PrismaClient(); 

// 1. Lấy danh sách project (Bổ sung include members để hiện thợ ở ngoài)
router.get('/', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' },
            include: { 
                rooms: true,
                members: true // ✅ Thêm cái này để frontend hiện avatar thợ
            }
        });
        res.json(projects);
    }
    catch (error) {
        console.error("Lỗi GET projects:", error);
        res.status(500).json({ error: 'Lỗi lấy danh sách dự án!'});
    }
});

// 2. Tạo dự án mới
router.post('/', async (req, res) => {
    // ✅ SỬA: Phải lấy cả memberIds từ body gửi lên
    const { name, memberIds } = req.body; 
    
    if (!name) return res.status(400).json({ error: "Vui lòng nhập tên dự án!"});
    
    try {
        const newProject = await prisma.project.create({
            data: {
                name: name,
                status: "Đang làm",
                // ✅ SỬA: Check memberIds an toàn
                members: {
                    connect: (memberIds && Array.isArray(memberIds)) 
                             ? memberIds.map(id => ({ id: parseInt(id) })) 
                             : []
                }
            }, 
            include: {
                members: true
            }
        });
        res.json(newProject);
    }
    catch (error) {
        console.error("Lỗi POST project:", error); // Log ra để debug
        res.status(500).json({ error : "Lỗi tạo dự án!" });
    }
});

// 3. Thêm phòng vào dự án
router.post('/:id/rooms', async (req, res) => {
    const projectId = parseInt(req.params.id);
    const { name } = req.body;
    try {
        const newRoom = await prisma.room.create({
            data: { name, projectId }
        });
        res.json(newRoom);
    } catch(error) { 
        res.status(500).json({ error: "Lỗi tạo phòng!" }); 
    }
});

// Trạng thái project
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body; 

    try {
        const updatedProject = await prisma.project.update({
            where: { id: parseInt(id) },
            data: {
                name: name, 
                status: status
            }
        });
        res.json(updatedProject);
    } catch (error) {
        console.error("Lỗi cập nhật dự án: ", error);
        res.status(500).json({ error: "Không thể cập nhật dự án!"});
    }
});

// gán nhân viên vào trong project 
router.post('/:projectId/assign', async (req, res) => {
    const { projectId } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ error: "Dữ liệu không hợp lệ"});
    }

    try {
        const connectData = userIds.map(id => ({ id: parseInt(id) }))
        ; 
        const updated = await prisma.project.update({
            where: { id: parseInt(projectId) },
            data: {
                members: {
                    connect: connectData
                }
            },
            include: { members: true }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi gán nhân viên!" });
    }
});

// gỡ nhân viên khỏi dự án 
router.delete('/:projectId/members/:userId', async (req, res) => {
    const { projectId, userId } = req.params; 

    try {
        const updatedProject = await prisma.project.update({
            where: { id: parseInt(projectId) },
            data: {
                members: {
                    disconnect: { id: parseInt(userId) }
                }
            },
            include: { members: true }
        });
        res.json({ message: "Đã gỡ nhân viên thành công!", project: updatedProject });
    } 
    catch (error) {
        console.error("Lỗi khi gỡ nhân viên: ", error);
        res.status(500).json({ error: "Không thể gỡ nhân viên khỏi dự án!"});
    }
});

// Xóa dự án
router.delete('/:id', async (req, res) => {
    const { id } = req.params; 
    try {
        await prisma.project.delete({
            where : { id: parseInt(id) }
        });
        res.json({ message: "Đã xoá dự án thành công!"});
    } catch (error) {
        console.error("Lỗi xoá dự án:", error);
        res.status(500).json({ error: "Thất bại khi xoá dự án!" });
    }
});

// Api xoá phòng
router.delete('/:projectId/rooms/:roomId', async (req, res) => {
    const { roomId } = req.params; 

    try { 
        await prisma.room.delete({
            where: { id: parseInt(roomId) }
        });
        res.json({ message: "Đã xoá phòng thành công!"});
    }
    catch (error) {
        console.error("Lỗi xoá phòng ở Backend:", error);
        res.status(500).json({ error: "Lỗi hệ thống khi xoá phòng!"});
    }
});

module.exports = router;
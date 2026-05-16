const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// --- HÀM HỖ TRỢ: CHUYỂN TIẾNG VIỆT CÓ DẤU THÀNH KHÔNG DẤU ---
function removeVietnameseTones(str) {
    if (!str) return 'KhongTen';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

// --- 1. CẤU HÌNH MULTER: TỰ ĐỘNG TẠO THƯ MỤC ĐỘNG THEO DỰ ÁN/PHÒNG ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const { projectName, roomName } = req.body;
        const safeProjectName = removeVietnameseTones(projectName);
        const safeRoomName = removeVietnameseTones(roomName);
        const dir = path.join(process.cwd(), 'uploads', safeProjectName, safeRoomName);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const originalName = file.originalname || "";
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);

        const safeFileName = removeVietnameseTones(baseName);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        cb(null, uniqueSuffix + '-' + safeFileName + extension);
    }
});

const upload = multer({ storage: storage });

// ==========================================
// CÁC API QUẢN LÝ DANH MỤC CẮT (TASK)
// ==========================================

// --- API 1: LẤY DANH SÁCH TASK ---
router.get('/', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                user: true,
                room: true,
                notes: { include: { user: true }, orderBy: { createdAt: 'asc' } }
            }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống khi tải dữ liệu!" });
    }
});

// --- API 2: TẠO MỚI TASK ---
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { roomId, material, title, projectId, userId, note } = req.body;

        if (!roomId || !projectId) {
            return res.status(400).json({ error: "Thiếu thông tin bắt buộc!" });
        }

        const filePath = req.file ? req.file.path.replace(/\\/g, '/') : "";

        const taskData = {
            material: material || "",
            title: title || "",
            filePath: filePath,
            status: "TODO",
            roomId: parseInt(roomId),
            projectId: parseInt(projectId),
        };

        if (userId && userId !== "null" && userId !== "") {
            taskData.userId = parseInt(userId);
        }

        const newTask = await prisma.task.create({ data: taskData });

        if (note && note.trim() !== "") {
            await prisma.note.create({
                data: { content: note, task: { connect: { id: newTask.id } } }
            });
        }

        res.json(newTask);
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
    }
});

// --- API 3: CẬP NHẬT TRẠNG THÁI (ĐÃ NÂNG CẤP ĐỂ HỨNG FILE, CHUYỂN USER & GHI GIỜ XONG) ---
router.put('/:id', upload.single('file'), async (req, res) => {
    const { id } = req.params;
    try {
        const updateData = { ...req.body };

        delete updateData.projectName;
        delete updateData.roomName;

        if ('userId' in updateData) {
            if (updateData.userId === "" || updateData.userId === "null" || updateData.userId === null) {
                updateData.userId = null;
            } else {
                updateData.userId = parseInt(updateData.userId);
            }
        }

        // --- TỰ ĐỘNG GHI NHẬN THỜI GIAN HOÀN THÀNH ---
        if (updateData.status === 'DONE') {
            updateData.completedAt = new Date(); // Đóng dấu thời gian xong
        } else if (updateData.status && updateData.status !== 'DONE') {
            updateData.completedAt = null; // Xóa dấu nếu hoàn tác
        }

        if (req.file) {
            updateData.filePath = req.file.path.replace(/\\/g, '/');
        }

        const updatedTask = await prisma.task.update({
            where: { id: parseInt(id) },
            data: updateData
        });
        res.json(updatedTask);
    } catch (error) {
        console.error("Lỗi cập nhật:", error);
        res.status(500).json({ error: "Không thể cập nhật task!" });
    }
});

// --- API 4: XÓA TASK ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.task.delete({ where: { id: parseInt(id) } });
        res.json({ message: "Đã xóa task thành công" });
    } catch (error) {
        res.status(500).json({ error: "Không thể xóa task!" });
    }
});

// --- API 5: THÊM BÌNH LUẬN ---
router.post('/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, userId } = req.body;
        const noteData = {
            content: content,
            task: { connect: { id: parseInt(id) } }
        };
        if (userId && userId !== "null" && userId !== "") {
            noteData.user = { connect: { id: parseInt(userId) } };
        }
        const newNote = await prisma.note.create({ data: noteData });
        res.json(newNote);
    } catch (error) {
        res.status(500).json({ error: "Không thể gửi phản hồi!" });
    }
});

// --- API 6: THẢ TIM / XÁC NHẬN BÌNH LUẬN ---
router.put('/:taskId/notes/:noteId/like', async (req, res) => {
    try {
        const { noteId } = req.params;
        const { isLiked } = req.body;

        const updatedNote = await prisma.note.update({
            where: { id: parseInt(noteId) },
            data: { isLiked: isLiked }
        });

        res.json(updatedNote);
    } catch (error) {
        console.error("Lỗi thả tim:", error);
        res.status(500).json({ error: "Không thể thả tim!" });
    }
});

module.exports = router;
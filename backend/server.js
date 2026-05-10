require('dotenv').config();
const express = require('express'); 
const cors = require('cors'); 
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes'); 

const app = express();

// Middleware 
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, 'uploads');
if(!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'paste-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/api/uploads', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Không nhận được file nào!' });

    res.json({ fileUrl: `/uploads/${req.file.filename}` });
});

//. app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', authRoutes); // tạo ra /api/login
app.use('/api/users', userRoutes); // tạo ra /api/users/create, /api/user/employees,...
app.use('/api/projects', projectRoutes); // tạo ra /api/projects
app.use('/api/tasks', taskRoutes); // tạo ra /api/tasks

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
    console.log(`Các API đã được nạp thành công!`);
});
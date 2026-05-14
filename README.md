# 🚀 Workspace Management

Hệ thống quản lý quy trình sản xuất nội bộ chuyên dụng dành cho các xưởng cắt CNC và gia công. Dự án giúp số hóa quy trình giao việc, nhận việc và báo cáo tiến độ giữa Sếp (Admin) và Nhân viên (Thợ) một cách trực quan, nhanh chóng, ngay trong mạng nội bộ (LAN).

## ✨ Tính năng nổi bật

### 👔 Dành cho Sếp (Quản lý / Admin)
* **Quản lý không gian làm việc:** Tạo dự án và chia nhỏ theo từng phòng/khu vực.
* **Giao việc nhanh chóng:** Lên danh sách các tấm/vách cần cắt, chỉ định vật liệu, ghi chú chi tiết.
* **Đính kèm bản vẽ:** Upload file bản vẽ trực tiếp hoặc **dán ảnh nhanh bằng phím tắt (Ctrl + V)** như Zalo.
* **Theo dõi tiến độ Real-time:** Bảng điều khiển (Dashboard) với các bộ lọc trạng thái màu sắc trực quan: *Tất cả, Chưa nhận, Đang làm, Đã xong*.
* **Tương tác trực tiếp:** Gửi tin nhắn, hình ảnh cho nhân viên ngay trong từng đầu việc.

### 🛠️ Dành cho Nhân viên
* **Chủ động nhận việc:** Xem danh sách việc trống và bấm nhận việc chỉ với 1 thao tác.
* **Báo cáo tiến độ:** Check hoàn thành hoặc hoàn tác nếu có lỗi phát sinh.
* **Giao tiếp hình ảnh:** Báo cáo lỗi vật liệu, bản vẽ trực tiếp bằng cách **chụp và dán ảnh (Ctrl + V)** gửi cho Sếp.
* **Hệ thống cảnh báo:** Hiển thị thông báo (badge đỏ) ngay khi Sếp có chỉ thị mới trong note.

## 💻 Công nghệ sử dụng (Tech Stack)

* **Frontend:** React.js, Tailwind CSS, Lucide Icons.
* **Backend:** Node.js (Express), Multer.
* **Database:** PostgreSQL / MySQL (Giao tiếp qua Prisma ORM).
* **DevOps / Triển khai:** Docker, Docker Compose, Nginx.

## 📦 Hướng dẫn cài đặt & Triển khai (Local/LAN)

Hệ thống được đóng gói hoàn toàn bằng Docker, tối ưu cho việc chạy server nội bộ 24/7.

### 1. Yêu cầu hệ thống
* Đã cài đặt [Docker](https://www.docker.com/) và Docker Compose trên máy chủ.

### 2. Cấu hình môi trường
* Truy cập container chạy file `seed.js` tại folder `prisma`

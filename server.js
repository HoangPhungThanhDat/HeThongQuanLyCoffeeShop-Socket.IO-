// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// const axios = require("axios");

// // ================== KHỞI TẠO APP ==================
// const app = express();
// const server = http.createServer(app);

// // ================== SOCKET.IO ==================
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//   },
//   pingInterval: 10000,
//   pingTimeout: 5000,
// });

// // Middleware
// app.use(cors());
// app.use(express.json());

// // ================== CẤU HÌNH BACKEND API ==================
// const BACKEND_API_URL = "http://localhost:8080/api";

// // ================== LƯU TRỮ THÔNG TIN ORDERS VÀ CLIENTS ==================
// const activeOrders = new Map();
// const clientOrders = new Map();

// // ================== API NHẬN CẢNH BÁO ==================
// app.post("/order-warning", (req, res) => {
//   const { orderId, message } = req.body;
//   console.log("⚠️ Nhận cảnh báo từ backend:", message);
//   io.emit("order-warning", { orderId, message });
//   return res.status(200).json({ success: true });
// });

// // ================== SOCKET EVENTS ==================
// io.on("connection", (socket) => {
//   const oldId = socket.handshake.auth?.oldId;

//   if (oldId) {
//     console.log(
//       `♻️ Người dùng cũ (${oldId}) đã kết nối lại với ID mới: ${socket.id}`
//     );
//   } else {
//     console.log("🟢 Một người dùng mới đã kết nối:", socket.id);
//   }

//   // === 1️⃣ NGƯỜI DÙNG ĐĂNG KÝ THEO DÕI ĐƠN HÀNG ===
//   socket.on("join-order-tracking", (data) => {
//     const { orderId, userType } = data;

//     clientOrders.set(socket.id, { orderId, userType });
//     socket.join(`order-${orderId}`);

//     if (!activeOrders.has(orderId)) {
//       activeOrders.set(orderId, {
//         clients: new Set(),
//         status: "PENDING",
//         items: [],
//         total: 0,
//       });
//     }
//     activeOrders.get(orderId).clients.add(socket.id);

//     console.log(
//       `📍 ${userType === "customer" ? "Khách hàng" : "Nhân viên"} ${
//         socket.id
//       } đã tham gia theo dõi đơn #${orderId}`
//     );
//     console.log(
//       `   → Số người đang theo dõi: ${activeOrders.get(orderId).clients.size}`
//     );

//     // ✅ GỬI TRẠNG THÁI HIỆN TẠI CHO CLIENT VỪA JOIN (QUAN TRỌNG!)
//     const currentStatus = activeOrders.get(orderId).status;
//     if (currentStatus && currentStatus !== "PENDING") {
//       console.log(`   📤 Gửi trạng thái hiện tại (${currentStatus}) cho client ${socket.id}`);
//       socket.emit("order-status-updated", {
//         orderId: orderId,
//         status: currentStatus,
//         updatedAt: new Date().toISOString(),
//         updatedBy: "system-sync",
//         isInitialSync: true // Đánh dấu đây là sync ban đầu
//       });
//     }
//   });

//   // === 2️⃣ NHÂN VIÊN CẬP NHẬT TRẠNG THÁI ===
//   socket.on("staff-update-status", (data) => {
//     const { orderId, newStatus, source } = data;

//     console.log(`\n🔄 ==========================================`);
//     console.log(`🔄 CẬP NHẬT TRẠNG THÁI ĐƠN #${orderId}`);
//     console.log(`🔄 ==========================================`);
//     console.log(`   - Socket ID: ${socket.id}`);
//     console.log(`   - Trạng thái mới: ${newStatus}`);
//     console.log(`   - Nguồn: ${source || "staff-click"}`);

//     if (activeOrders.has(orderId)) {
//       activeOrders.get(orderId).status = newStatus;
//     }

//     // ✅ KIỂM TRA SỐ LƯỢNG CLIENTS TRONG ROOM
//     const roomClients = io.sockets.adapter.rooms.get(`order-${orderId}`);
//     const clientCount = roomClients ? roomClients.size : 0;
    
//     console.log(`   - Clients trong room order-${orderId}: ${clientCount}`);
//     if (roomClients) {
//       console.log(`   - Socket IDs:`, Array.from(roomClients));
//     }

//     // GỬI ĐẾN ROOM
//     io.to(`order-${orderId}`).emit("order-status-updated", {
//       orderId,
//       status: newStatus,
//       updatedAt: new Date().toISOString(),
//       updatedBy: source || "staff",
//     });

//     console.log(`   ✅ Đã broadcast đến room order-${orderId}`);
//     console.log(`==========================================\n`);
//   });

//   // === ✅ 3️⃣ XỬ LÝ THAY ĐỔI TRẠNG THÁI BÀN ===
//   socket.on("table-status-changed", (data) => {
//     const { tableId, tableNumber, newStatus, orderId } = data;

//     console.log("\n🪑 ==========================================");
//     console.log("🪑 NHẬN YÊU CẦU CẬP NHẬT TRẠNG THÁI BÀN");
//     console.log("🪑 ==========================================");
//     console.log(`   - Table ID: ${tableId}`);
//     console.log(`   - Table Number: ${tableNumber}`);
//     console.log(`   - New Status: ${newStatus}`);
//     console.log(`   - Order ID: ${orderId}`);
//     console.log(`   - From Socket: ${socket.id}`);
//     console.log("==========================================\n");

//     // ✅ BROADCAST ĐẾN TẤT CẢ CLIENTS (bao gồm cả người gửi)
//     io.emit("table-status-changed", {
//       tableId: tableId,
//       tableNumber: tableNumber,
//       newStatus: newStatus,
//       orderId: orderId,
//       timestamp: new Date().toISOString(),
//       updatedBy: socket.id,
//     });

//     console.log(
//       `✅ Đã broadcast cập nhật trạng thái bàn #${tableNumber} → ${newStatus}`
//     );
//   });

//   // === 4️⃣ NGƯỜI DÙNG RỜI KHỎI THEO DÕI ===
//   socket.on("leave-order-tracking", (data) => {
//     const { orderId } = data;

//     socket.leave(`order-${orderId}`);

//     if (activeOrders.has(orderId)) {
//       activeOrders.get(orderId).clients.delete(socket.id);

//       if (activeOrders.get(orderId).clients.size === 0) {
//         activeOrders.delete(orderId);
//         console.log(
//           `🗑️ Đơn #${orderId} không còn ai theo dõi → đã xóa khỏi hệ thống`
//         );
//       }
//     }

//     clientOrders.delete(socket.id);
//     console.log(`👋 Client ${socket.id} đã rời khỏi theo dõi đơn #${orderId}`);
//   });

//   // === 5️⃣ THÊM MÓN VÀO ĐƠN HÀNG ===
//   socket.on("add-items-to-order", async (data) => {
//     const { orderId, items, additionalAmount } = data;

//     console.log("\n🔌 ================================================");
//     console.log("🔌 SOCKET: add-items-to-order");
//     console.log("🔌 ================================================");
//     console.log(`📦 Order ID: ${orderId}`);
//     console.log(`📦 Số món thêm: ${items.length}`);
//     console.log(
//       `📦 Giá trị thêm: ${additionalAmount?.toLocaleString() || "N/A"}₫`
//     );

//     items.forEach((item, i) => {
//       console.log(`\n   📦 Món ${i + 1}:`);
//       console.log(`      - id: ${item.id}`);
//       console.log(`      - productId: ${item.productId || "THIẾU"}`);
//       console.log(`      - name: ${item.name}`);
//       console.log(`      - quantity: ${item.quantity}`);
//       console.log(
//         `      - price (đã giảm): ${item.price?.toLocaleString() || "THIẾU"}₫`
//       );
//       console.log(
//         `      - originalPrice: ${
//           item.originalPrice?.toLocaleString() || "N/A"
//         }₫`
//       );
//       console.log(`      - discount: ${item.discountPercentage || 0}%`);
//     });

//     try {
//       const formattedItems = items.map((item, index) => {
//         const productId = item.productId || item.id;
//         const price = item.price;

//         if (!productId) {
//           throw new Error(
//             `Món "${item.name || "N/A"}" (index ${index}) thiếu productId`
//           );
//         }
//         if (!price || price <= 0) {
//           throw new Error(
//             `Món "${item.name || "N/A"}" có giá không hợp lệ: ${price}`
//           );
//         }
//         if (!item.quantity || item.quantity <= 0) {
//           throw new Error(
//             `Món "${item.name || "N/A"}" có số lượng không hợp lệ: ${
//               item.quantity
//             }`
//           );
//         }

//         return {
//           productId: productId,
//           quantity: item.quantity,
//           price: price,
//         };
//       });

//       console.log("\n📡 Payload gửi đến backend:");
//       console.log(JSON.stringify(formattedItems, null, 2));
//       console.log(`\n📡 URL: ${BACKEND_API_URL}/orders/${orderId}/add-items`);

//       const response = await axios.post(
//         `${BACKEND_API_URL}/orders/${orderId}/add-items`,
//         formattedItems,
//         {
//           headers: {
//             "Content-Type": "application/json",
//           },
//           timeout: 10000,
//         }
//       );

//       console.log("\n✅ ==========================================");
//       console.log("✅ API RESPONSE THÀNH CÔNG");
//       console.log("✅ ==========================================");
//       console.log(`   - Status: ${response.status}`);
//       console.log(`   - Success: ${response.data.success}`);
//       console.log(`   - Message: ${response.data.message}`);
//       console.log(
//         `   - New Total: ${response.data.totalAmount?.toLocaleString()}₫`
//       );
//       console.log(`   - Total Items: ${response.data.totalItems}`);

//       if (activeOrders.has(orderId)) {
//         const order = activeOrders.get(orderId);
//         order.total = response.data.totalAmount;
//         if (response.data.order && response.data.order.orderItems) {
//           order.items = response.data.order.orderItems;
//         }
//       }

//       io.to(`order-${orderId}`).emit("items-added-to-order", {
//         orderId: orderId,
//         addedItems: items,
//         newTotal: response.data.totalAmount,
//         totalItems: response.data.totalItems,
//         order: response.data.order,
//         updatedItems: response.data.order?.orderItems || [],
//         timestamp: new Date().toISOString(),
//       });

//       io.emit("staff-notification", {
//         type: "items-added",
//         orderId: orderId,
//         items: items,
//         newTotal: response.data.totalAmount,
//         additionalAmount: additionalAmount,
//         message: `Đơn #${orderId} vừa thêm ${items.length} món mới`,
//         timestamp: new Date().toISOString(),
//       });

//       console.log("\n✅ ĐÃ GỬI THÔNG BÁO SOCKET THÀNH CÔNG!");
//       console.log("================================================\n");
//     } catch (error) {
//       console.error("\n❌ ==========================================");
//       console.error("❌ LỖI KHI XỬ LÝ");
//       console.error("❌ ==========================================");

//       if (error.response) {
//         console.error("📛 Backend Response Error:");
//         console.error(`   - Status: ${error.response.status}`);
//         console.error(
//           `   - Message: ${error.response.data?.message || "Unknown"}`
//         );
//         console.error(
//           `   - Data:`,
//           JSON.stringify(error.response.data, null, 2)
//         );
//       } else if (error.request) {
//         console.error("📛 Request Error (No Response):");
//         console.error(`   - Message: ${error.message}`);
//         console.error(`   - Có thể backend không chạy hoặc URL sai`);
//       } else {
//         console.error("📛 Error:");
//         console.error(`   - Message: ${error.message}`);
//         console.error(`   - Stack:`, error.stack);
//       }

//       console.error("==========================================\n");

//       socket.emit("add-items-error", {
//         orderId: orderId,
//         message:
//           error.message ||
//           error.response?.data?.message ||
//           "Không thể thêm món. Vui lòng thử lại!",
//         error: error.message,
//         details: error.response?.data,
//       });
//     }
//   });

//   // === 6️⃣ Thêm sản phẩm vào giỏ ===
//   socket.on("adding-to-cart", (data) => {
//     console.log(`🛒 Người dùng ${socket.id} đang thêm: ${data.productName}`);
//     socket.emit("self-adding-to-cart", data);
//   });

//   // === 7️⃣ Chọn bàn ===
//   socket.on("table-selecting", (data) => {
//     console.log(
//       `📋 Bàn ${data.tableNumber} đang được chọn bởi ${data.userName}`
//     );
//     socket.broadcast.emit("table-being-selected", data);
//   });

//   // === 8️⃣ Bỏ chọn bàn ===
//   socket.on("table-unselecting", (data) => {
//     console.log(`❌ Bàn ${data.tableNumber} đã bỏ chọn`);
//     socket.broadcast.emit("table-unselected", data);
//   });

//   // === 9️⃣ Gửi đơn hàng ===
//   socket.on("order-submitted", (orderData) => {
//     console.log(`🧾 Người dùng ${socket.id} đã gửi đơn hàng:`);
//     console.log(`   • Bàn số: ${orderData.tableNumber}`);
//     console.log(`   • Thời gian: ${orderData.orderTime}`);
//     console.log(`   • Tổng tiền: ${orderData.totalPrice?.toLocaleString()}đ`);

//     if (orderData.items) {
//       orderData.items.forEach((item, i) => {
//         console.log(
//           `     ${i + 1}. ${item.productName} - SL: ${
//             item.quantity
//           } - Giá: ${item.price?.toLocaleString()}đ`
//         );
//       });
//     }

//     if (orderData.orderNumber) {
//       activeOrders.set(orderData.orderNumber, {
//         clients: new Set(),
//         status: "PENDING",
//         items: orderData.items || [],
//         total: orderData.totalPrice || 0,
//       });
//     }

//     io.emit("new-order", orderData);
//   });

//   // === 🔟 Hủy đơn hàng ===
//   socket.on("cancel-order", (data) => {
//     const { orderId } = data;
//     console.log(`🚫 Khách hàng yêu cầu hủy đơn #${orderId}`);

//     io.emit("order-cancel-request", {
//       orderId,
//       requestedBy: socket.id,
//       requestedAt: new Date().toISOString(),
//     });
//   });

//   // === 1️⃣1️⃣ GỌI NHÂN VIÊN ===
//   socket.on("call-staff", (data) => {
//     const { tableNumber, orderId, message, customerName } = data;

//     console.log("\n🔔 ==========================================");
//     console.log("🔔 KHÁCH HÀNG GỌI NHÂN VIÊN");
//     console.log("🔔 ==========================================");
//     console.log(`   - Bàn số: ${tableNumber}`);
//     console.log(`   - Order ID: ${orderId}`);
//     console.log(`   - Khách hàng: ${customerName || "N/A"}`);
//     console.log(`   - Tin nhắn: ${message}`);
//     console.log(`   - Socket ID: ${socket.id}`);
//     console.log("==========================================\n");

//     io.emit("staff-call-notification", {
//       tableNumber: tableNumber,
//       orderId: orderId,
//       customerName: customerName || `Khách bàn ${tableNumber}`,
//       message: message || "Yêu cầu hỗ trợ",
//       timestamp: new Date().toISOString(),
//       socketId: socket.id,
//       notificationType: "CALL_STAFF",
//     });

//     console.log("✅ Đã gửi thông báo gọi nhân viên đến tất cả staff");

//     socket.emit("call-staff-success", {
//       success: true,
//       message: "Đã gọi nhân viên thành công",
//       tableNumber: tableNumber,
//     });
//   });

//   // === ✅ 1️⃣2️⃣ NHẬN THÔNG BÁO THANH TOÁN THÀNH CÔNG TỪ BACKEND (SOCKET) ===
//   socket.on("payment-success", async (data) => {
//     const { orderId, tableNumber, amount, paymentMethod, transactionNo } = data;

//     console.log("\n💳 ==========================================");
//     console.log("💳 SOCKET: THANH TOÁN THÀNH CÔNG");
//     console.log("💳 ==========================================");
//     console.log(`   - Order ID: ${orderId}`);
//     console.log(`   - Table Number: ${tableNumber}`);
//     console.log(`   - Amount: ${amount?.toLocaleString()}₫`);
//     console.log(`   - Payment Method: ${paymentMethod}`);
//     console.log(`   - Transaction No: ${transactionNo}`);
//     console.log("==========================================\n");

//     // Cập nhật trạng thái trong activeOrders
//     if (activeOrders.has(orderId)) {
//       activeOrders.get(orderId).status = "PAID";
//     }

//     // ✅ 1️⃣ GỬI THÔNG BÁO ĐẾN TẤT CẢ NHÂN VIÊN
//     io.emit("payment-notification", {
//       orderId: orderId,
//       tableNumber: tableNumber,
//       amount: amount,
//       paymentMethod: paymentMethod,
//       transactionNo: transactionNo,
//       timestamp: new Date().toISOString(),
//       notificationType: "PAYMENT_SUCCESS",
//     });

//     // ✅ 2️⃣ GỬI CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG ĐẾN KHÁCH HÀNG
//     const roomClients = io.sockets.adapter.rooms.get(`order-${orderId}`);
//     const clientCount = roomClients ? roomClients.size : 0;
    
//     console.log(`📊 Thống kê room order-${orderId}:`);
//     console.log(`   - Số clients: ${clientCount}`);
//     if (roomClients) {
//       console.log(`   - Socket IDs:`, Array.from(roomClients));
//     }

//     io.to(`order-${orderId}`).emit("order-status-updated", {
//       orderId: orderId.toString(),
//       status: "PAID",
//       updatedAt: new Date().toISOString(),
//       updatedBy: "payment-system",
//     });

//     console.log("✅ Đã gửi thông báo thanh toán đến tất cả nhân viên");
//     console.log(`✅ Đã gửi cập nhật trạng thái PAID đến ${clientCount} clients trong room order-${orderId}`);
//   });

//   // === ✅ 1️⃣3️⃣ NHẬN XÁC NHẬN TỪ NHÂN VIÊN ===
//   socket.on("staff-acknowledge-payment", (data) => {
//     const { orderId, tableNumber, staffName } = data;

//     console.log(
//       `✅ Nhân viên ${
//         staffName || socket.id
//       } đã xác nhận thanh toán bàn ${tableNumber}`
//     );

//     io.to(`order-${orderId}`).emit("payment-acknowledged", {
//       orderId: orderId,
//       tableNumber: tableNumber,
//       staffName: staffName || "Nhân viên",
//       message: "Nhân viên đã xác nhận thanh toán",
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // === 1️⃣4️⃣ NHÂN VIÊN XÁC NHẬN ĐÃ NHẬN ===
//   socket.on("staff-acknowledge-call", (data) => {
//     const { tableNumber, orderId, staffName } = data;

//     console.log(
//       `✅ Nhân viên ${
//         staffName || socket.id
//       } đã nhận thông báo từ bàn ${tableNumber}`
//     );

//     io.to(`order-${orderId}`).emit("staff-acknowledged", {
//       tableNumber: tableNumber,
//       staffName: staffName || "Nhân viên",
//       message: "Nhân viên đang đến hỗ trợ bạn",
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // === 1️⃣5️⃣ Ngắt kết nối ===
//   socket.on("disconnect", (reason) => {
//     console.log(
//       `🔴 Người dùng đã ngắt kết nối: ${socket.id} - lý do: ${reason}`
//     );

//     const clientInfo = clientOrders.get(socket.id);
//     if (clientInfo) {
//       const { orderId } = clientInfo;
//       if (activeOrders.has(orderId)) {
//         activeOrders.get(orderId).clients.delete(socket.id);

//         if (activeOrders.get(orderId).clients.size === 0) {
//           activeOrders.delete(orderId);
//         }
//       }
//       clientOrders.delete(socket.id);
//     }
//   });
// });

// // ================== API ENDPOINTS ==================
// app.get("/active-orders", (req, res) => {
//   const orders = Array.from(activeOrders.entries()).map(([orderId, data]) => ({
//     orderId,
//     status: data.status,
//     trackingClients: data.clients.size,
//     totalItems: data.items?.length || 0,
//     total: data.total || 0,
//   }));
//   res.json({ orders });
// });

// app.post("/sync-order", (req, res) => {
//   const { orderId, items, total, status } = req.body;

//   if (activeOrders.has(orderId)) {
//     const order = activeOrders.get(orderId);
//     order.items = items;
//     order.total = total;
//     order.status = status;

//     io.to(`order-${orderId}`).emit("order-synced", {
//       orderId,
//       items,
//       total,
//       status,
//     });

//     res.json({ success: true, message: "Order synced" });
//   } else {
//     res.status(404).json({ success: false, message: "Order not found" });
//   }
// });

// // ================== ✅ API NHẬN THÔNG BÁO THANH TOÁN THÀNH CÔNG ==================
// app.post("/payment-success", (req, res) => {
//   const { orderId, tableNumber, amount, paymentMethod, transactionNo } =
//     req.body;

//   console.log("\n💳 ==========================================");
//   console.log("💳 API: NHẬN THÔNG BÁO THANH TOÁN");
//   console.log("💳 ==========================================");
//   console.log(`   - Order ID: ${orderId}`);
//   console.log(`   - Table Number: ${tableNumber}`);
//   console.log(`   - Amount: ${amount?.toLocaleString()}₫`);
//   console.log(`   - Payment Method: ${paymentMethod}`);
//   console.log(`   - Transaction No: ${transactionNo}`);
//   console.log("==========================================\n");

//   // Cập nhật trạng thái trong activeOrders
//   if (activeOrders.has(orderId.toString())) {
//     activeOrders.get(orderId.toString()).status = "PAID";
//   }

//   // ✅ 1️⃣ GỬI THÔNG BÁO ĐẾN TẤT CẢ NHÂN VIÊN
//   io.emit("payment-notification", {
//     orderId: orderId,
//     tableNumber: tableNumber,
//     amount: amount,
//     paymentMethod: paymentMethod,
//     transactionNo: transactionNo,
//     timestamp: new Date().toISOString(),
//     notificationType: "PAYMENT_SUCCESS",
//   });

//   // ✅ 2️⃣ GỬI CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG ĐẾN KHÁCH HÀNG
//   const roomClients = io.sockets.adapter.rooms.get(`order-${orderId}`);
//   const clientCount = roomClients ? roomClients.size : 0;
  
//   console.log(`📊 Thống kê room order-${orderId}:`);
//   console.log(`   - Số clients: ${clientCount}`);
//   if (roomClients) {
//     console.log(`   - Socket IDs:`, Array.from(roomClients));
//   }

//   io.to(`order-${orderId}`).emit("order-status-updated", {
//     orderId: orderId.toString(),
//     status: "PAID",
//     updatedAt: new Date().toISOString(),
//     updatedBy: "payment-system",
//   });

//   console.log("✅ Đã gửi thông báo thanh toán đến tất cả nhân viên");
//   console.log(`✅ Đã gửi cập nhật trạng thái PAID đến ${clientCount} clients trong room order-${orderId}`);

//   return res.status(200).json({
//     success: true,
//     message: "Payment notification sent successfully",
//   });
// });

// // ================== KHỞI CHẠY SERVER ==================
// const PORT = 3001;
// server.listen(PORT, () => {
//   console.log("\n ================================================");
//   console.log(` Socket.IO Server đang chạy tại: http://localhost:${PORT}`);
//   console.log(` API kiểm tra orders: http://localhost:${PORT}/active-orders`);
//   console.log(` Backend API: ${BACKEND_API_URL}`);
//   console.log(" ================================================\n");
// });














//DEPLOY
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");

// ================== KHỞI TẠO APP ==================
const app = express();
const server = http.createServer(app);

// ================== SOCKET.IO ==================
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*", // ✅ SỬA: Cho phép mọi origin hoặc set biến môi trường
    methods: ["GET", "POST"],
    credentials: true
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Middleware
app.use(cors());
app.use(express.json());

// ================== CẤU HÌNH BACKEND API ==================
const BACKEND_API_URL = process.env.BACKEND_URL || "http://localhost:8080/api"; // ✅ SỬA: Dùng biến môi trường

// ================== LƯU TRỮ THÔNG TIN ORDERS VÀ CLIENTS ==================
const activeOrders = new Map();
const clientOrders = new Map();

// ================== API NHẬN CẢNH BÁO ==================
app.post("/order-warning", (req, res) => {
  const { orderId, message } = req.body;
  console.log("⚠️ Nhận cảnh báo từ backend:", message);
  io.emit("order-warning", { orderId, message });
  return res.status(200).json({ success: true });
});

// ================== HEALTH CHECK (Railway cần endpoint này) ==================
app.get("/", (req, res) => {
  res.json({ 
    status: "Socket.IO Server is running",
    activeOrders: activeOrders.size,
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    uptime: process.uptime(),
    activeConnections: io.sockets.sockets.size
  });
});

// ================== SOCKET EVENTS ==================
io.on("connection", (socket) => {
  const oldId = socket.handshake.auth?.oldId;

  if (oldId) {
    console.log(
      `♻️ Người dùng cũ (${oldId}) đã kết nối lại với ID mới: ${socket.id}`
    );
  } else {
    console.log("🟢 Một người dùng mới đã kết nối:", socket.id);
  }

  // === 1️⃣ NGƯỜI DÙNG ĐĂNG KÝ THEO DÕI ĐƠN HÀNG ===
  socket.on("join-order-tracking", (data) => {
    const { orderId, userType } = data;

    clientOrders.set(socket.id, { orderId, userType });
    socket.join(`order-${orderId}`);

    if (!activeOrders.has(orderId)) {
      activeOrders.set(orderId, {
        clients: new Set(),
        status: "PENDING",
        items: [],
        total: 0,
      });
    }
    activeOrders.get(orderId).clients.add(socket.id);

    console.log(
      `📍 ${userType === "customer" ? "Khách hàng" : "Nhân viên"} ${
        socket.id
      } đã tham gia theo dõi đơn #${orderId}`
    );
    console.log(
      `   → Số người đang theo dõi: ${activeOrders.get(orderId).clients.size}`
    );

    // ✅ GỬI TRẠNG THÁI HIỆN TẠI CHO CLIENT VỪA JOIN
    const currentStatus = activeOrders.get(orderId).status;
    if (currentStatus && currentStatus !== "PENDING") {
      console.log(`   📤 Gửi trạng thái hiện tại (${currentStatus}) cho client ${socket.id}`);
      socket.emit("order-status-updated", {
        orderId: orderId,
        status: currentStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: "system-sync",
        isInitialSync: true
      });
    }
  });

  // === 2️⃣ NHÂN VIÊN CẬP NHẬT TRẠNG THÁI ===
  socket.on("staff-update-status", (data) => {
    const { orderId, newStatus, source } = data;

    console.log(`\n🔄 ==========================================`);
    console.log(`🔄 CẬP NHẬT TRẠNG THÁI ĐƠN #${orderId}`);
    console.log(`🔄 ==========================================`);
    console.log(`   - Socket ID: ${socket.id}`);
    console.log(`   - Trạng thái mới: ${newStatus}`);
    console.log(`   - Nguồn: ${source || "staff-click"}`);

    if (activeOrders.has(orderId)) {
      activeOrders.get(orderId).status = newStatus;
    }

    const roomClients = io.sockets.adapter.rooms.get(`order-${orderId}`);
    const clientCount = roomClients ? roomClients.size : 0;
    
    console.log(`   - Clients trong room order-${orderId}: ${clientCount}`);
    if (roomClients) {
      console.log(`   - Socket IDs:`, Array.from(roomClients));
    }

    io.to(`order-${orderId}`).emit("order-status-updated", {
      orderId,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: source || "staff",
    });

    console.log(`   ✅ Đã broadcast đến room order-${orderId}`);
    console.log(`==========================================\n`);
  });

  // === 3️⃣ XỬ LÝ THAY ĐỔI TRẠNG THÁI BÀN ===
  socket.on("table-status-changed", (data) => {
    const { tableId, tableNumber, newStatus, orderId } = data;

    console.log("\n🪑 ==========================================");
    console.log("🪑 NHẬN YÊU CẦU CẬP NHẬT TRẠNG THÁI BÀN");
    console.log("🪑 ==========================================");
    console.log(`   - Table ID: ${tableId}`);
    console.log(`   - Table Number: ${tableNumber}`);
    console.log(`   - New Status: ${newStatus}`);
    console.log(`   - Order ID: ${orderId}`);
    console.log(`   - From Socket: ${socket.id}`);
    console.log("==========================================\n");

    io.emit("table-status-changed", {
      tableId: tableId,
      tableNumber: tableNumber,
      newStatus: newStatus,
      orderId: orderId,
      timestamp: new Date().toISOString(),
      updatedBy: socket.id,
    });

    console.log(
      `✅ Đã broadcast cập nhật trạng thái bàn #${tableNumber} → ${newStatus}`
    );
  });

  // === 4️⃣ NGƯỜI DÙNG RỜI KHỎI THEO DÕI ===
  socket.on("leave-order-tracking", (data) => {
    const { orderId } = data;

    socket.leave(`order-${orderId}`);

    if (activeOrders.has(orderId)) {
      activeOrders.get(orderId).clients.delete(socket.id);

      if (activeOrders.get(orderId).clients.size === 0) {
        activeOrders.delete(orderId);
        console.log(
          `🗑️ Đơn #${orderId} không còn ai theo dõi → đã xóa khỏi hệ thống`
        );
      }
    }

    clientOrders.delete(socket.id);
    console.log(`👋 Client ${socket.id} đã rời khỏi theo dõi đơn #${orderId}`);
  });

  // === 5️⃣ THÊM MÓN VÀO ĐƠN HÀNG ===
  socket.on("add-items-to-order", async (data) => {
    const { orderId, items, additionalAmount } = data;

    console.log("\n🔌 ================================================");
    console.log("🔌 SOCKET: add-items-to-order");
    console.log("🔌 ================================================");
    console.log(`📦 Order ID: ${orderId}`);
    console.log(`📦 Số món thêm: ${items.length}`);
    console.log(
      `📦 Giá trị thêm: ${additionalAmount?.toLocaleString() || "N/A"}₫`
    );

    items.forEach((item, i) => {
      console.log(`\n   📦 Món ${i + 1}:`);
      console.log(`      - id: ${item.id}`);
      console.log(`      - productId: ${item.productId || "THIẾU"}`);
      console.log(`      - name: ${item.name}`);
      console.log(`      - quantity: ${item.quantity}`);
      console.log(
        `      - price (đã giảm): ${item.price?.toLocaleString() || "THIẾU"}₫`
      );
      console.log(
        `      - originalPrice: ${
          item.originalPrice?.toLocaleString() || "N/A"
        }₫`
      );
      console.log(`      - discount: ${item.discountPercentage || 0}%`);
    });

    try {
      const formattedItems = items.map((item, index) => {
        const productId = item.productId || item.id;
        const price = item.price;

        if (!productId) {
          throw new Error(
            `Món "${item.name || "N/A"}" (index ${index}) thiếu productId`
          );
        }
        if (!price || price <= 0) {
          throw new Error(
            `Món "${item.name || "N/A"}" có giá không hợp lệ: ${price}`
          );
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(
            `Món "${item.name || "N/A"}" có số lượng không hợp lệ: ${
              item.quantity
            }`
          );
        }

        return {
          productId: productId,
          quantity: item.quantity,
          price: price,
        };
      });

      console.log("\n📡 Payload gửi đến backend:");
      console.log(JSON.stringify(formattedItems, null, 2));
      console.log(`\n📡 URL: ${BACKEND_API_URL}/orders/${orderId}/add-items`);

      const response = await axios.post(
        `${BACKEND_API_URL}/orders/${orderId}/add-items`,
        formattedItems,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("\n✅ ==========================================");
      console.log("✅ API RESPONSE THÀNH CÔNG");
      console.log("✅ ==========================================");
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Success: ${response.data.success}`);
      console.log(`   - Message: ${response.data.message}`);
      console.log(
        `   - New Total: ${response.data.totalAmount?.toLocaleString()}₫`
      );
      console.log(`   - Total Items: ${response.data.totalItems}`);

      if (activeOrders.has(orderId)) {
        const order = activeOrders.get(orderId);
        order.total = response.data.totalAmount;
        if (response.data.order && response.data.order.orderItems) {
          order.items = response.data.order.orderItems;
        }
      }

      io.to(`order-${orderId}`).emit("items-added-to-order", {
        orderId: orderId,
        addedItems: items,
        newTotal: response.data.totalAmount,
        totalItems: response.data.totalItems,
        order: response.data.order,
        updatedItems: response.data.order?.orderItems || [],
        timestamp: new Date().toISOString(),
      });

      io.emit("staff-notification", {
        type: "items-added",
        orderId: orderId,
        items: items,
        newTotal: response.data.totalAmount,
        additionalAmount: additionalAmount,
        message: `Đơn #${orderId} vừa thêm ${items.length} món mới`,
        timestamp: new Date().toISOString(),
      });

      console.log("\n✅ ĐÃ GỬI THÔNG BÁO SOCKET THÀNH CÔNG!");
      console.log("================================================\n");
    } catch (error) {
      console.error("\n❌ ==========================================");
      console.error("❌ LỖI KHI XỬ LÝ");
      console.error("❌ ==========================================");

      if (error.response) {
        console.error("📛 Backend Response Error:");
        console.error(`   - Status: ${error.response.status}`);
        console.error(
          `   - Message: ${error.response.data?.message || "Unknown"}`
        );
        console.error(
          `   - Data:`,
          JSON.stringify(error.response.data, null, 2)
        );
      } else if (error.request) {
        console.error("📛 Request Error (No Response):");
        console.error(`   - Message: ${error.message}`);
        console.error(`   - Có thể backend không chạy hoặc URL sai`);
      } else {
        console.error("📛 Error:");
        console.error(`   - Message: ${error.message}`);
        console.error(`   - Stack:`, error.stack);
      }

      console.error("==========================================\n");

      socket.emit("add-items-error", {
        orderId: orderId,
        message:
          error.message ||
          error.response?.data?.message ||
          "Không thể thêm món. Vui lòng thử lại!",
        error: error.message,
        details: error.response?.data,
      });
    }
  });

  // === 6️⃣ Thêm sản phẩm vào giỏ ===
  socket.on("adding-to-cart", (data) => {
    console.log(`🛒 Người dùng ${socket.id} đang thêm: ${data.productName}`);
    socket.emit("self-adding-to-cart", data);
  });

  // === 7️⃣ Chọn bàn ===
  socket.on("table-selecting", (data) => {
    console.log(
      `📋 Bàn ${data.tableNumber} đang được chọn bởi ${data.userName}`
    );
    socket.broadcast.emit("table-being-selected", data);
  });

  // === 8️⃣ Bỏ chọn bàn ===
  socket.on("table-unselecting", (data) => {
    console.log(`❌ Bàn ${data.tableNumber} đã bỏ chọn`);
    socket.broadcast.emit("table-unselected", data);
  });

  // === 9️⃣ Gửi đơn hàng ===
  socket.on("order-submitted", (orderData) => {
    console.log(`🧾 Người dùng ${socket.id} đã gửi đơn hàng:`);
    console.log(`   • Bàn số: ${orderData.tableNumber}`);
    console.log(`   • Thời gian: ${orderData.orderTime}`);
    console.log(`   • Tổng tiền: ${orderData.totalPrice?.toLocaleString()}đ`);

    if (orderData.items) {
      orderData.items.forEach((item, i) => {
        console.log(
          `     ${i + 1}. ${item.productName} - SL: ${
            item.quantity
          } - Giá: ${item.price?.toLocaleString()}đ`
        );
      });
    }

    if (orderData.orderNumber) {
      activeOrders.set(orderData.orderNumber, {
        clients: new Set(),
        status: "PENDING",
        items: orderData.items || [],
        total: orderData.totalPrice || 0,
      });
    }

    io.emit("new-order", orderData);
  });

  // === 🔟 Hủy đơn hàng ===
  socket.on("cancel-order", (data) => {
    const { orderId } = data;
    console.log(`🚫 Khách hàng yêu cầu hủy đơn #${orderId}`);

    io.emit("order-cancel-request", {
      orderId,
      requestedBy: socket.id,
      requestedAt: new Date().toISOString(),
    });
  });

  // === 1️⃣1️⃣ GỌI NHÂN VIÊN ===
  socket.on("call-staff", (data) => {
    const { tableNumber, orderId, message, customerName } = data;

    console.log("\n🔔 ==========================================");
    console.log("🔔 KHÁCH HÀNG GỌI NHÂN VIÊN");
    console.log("🔔 ==========================================");
    console.log(`   - Bàn số: ${tableNumber}`);
    console.log(`   - Order ID: ${orderId}`);
    console.log(`   - Khách hàng: ${customerName || "N/A"}`);
    console.log(`   - Tin nhắn: ${message}`);
    console.log(`   - Socket ID: ${socket.id}`);
    console.log("==========================================\n");

    io.emit("staff-call-notification", {
      tableNumber: tableNumber,
      orderId: orderId,
      customerName: customerName || `Khách bàn ${tableNumber}`,
      message: message || "Yêu cầu hỗ trợ",
      timestamp: new Date().toISOString(),
      socketId: socket.id,
      notificationType: "CALL_STAFF",
    });

    console.log("✅ Đã gửi thông báo gọi nhân viên đến tất cả staff");

    socket.emit("call-staff-success", {
      success: true,
      message: "Đã gọi nhân viên thành công",
      tableNumber: tableNumber,
    });
  });

  // === 1️⃣2️⃣ NHẬN THÔNG BÁO THANH TOÁN THÀNH CÔNG TỪ BACKEND (SOCKET) ===
  socket.on("payment-success", async (data) => {
    const { orderId, tableNumber, amount, paymentMethod, transactionNo } = data;

    console.log("\n💳 ==========================================");
    console.log("💳 SOCKET: THANH TOÁN THÀNH CÔNG");
    console.log("💳 ==========================================");
    console.log(`   - Order ID: ${orderId}`);
    console.log(`   - Table Number: ${tableNumber}`);
    console.log(`   - Amount: ${amount?.toLocaleString()}₫`);
    console.log(`   - Payment Method: ${paymentMethod}`);
    console.log(`   - Transaction No: ${transactionNo}`);
    console.log("==========================================\n");

    if (activeOrders.has(orderId)) {
      activeOrders.get(orderId).status = "PAID";
    }

    io.emit("payment-notification", {
      orderId: orderId,
      tableNumber: tableNumber,
      amount: amount,
      paymentMethod: paymentMethod,
      transactionNo: transactionNo,
      timestamp: new Date().toISOString(),
      notificationType: "PAYMENT_SUCCESS",
    });

    const roomClients = io.sockets.adapter.rooms.get(`order-${orderId}`);
    const clientCount = roomClients ? roomClients.size : 0;
    
    console.log(`📊 Thống kê room order-${orderId}:`);
    console.log(`   - Số clients: ${clientCount}`);
    if (roomClients) {
      console.log(`   - Socket IDs:`, Array.from(roomClients));
    }

    io.to(`order-${orderId}`).emit("order-status-updated", {
      orderId: orderId.toString(),
      status: "PAID",
      updatedAt: new Date().toISOString(),
      updatedBy: "payment-system",
    });

    console.log("✅ Đã gửi thông báo thanh toán đến tất cả nhân viên");
    console.log(`✅ Đã gửi cập nhật trạng thái PAID đến ${clientCount} clients trong room order-${orderId}`);
  });

  // === 1️⃣3️⃣ NHẬN XÁC NHẬN TỪ NHÂN VIÊN ===
  socket.on("staff-acknowledge-payment", (data) => {
    const { orderId, tableNumber, staffName } = data;

    console.log(
      `✅ Nhân viên ${
        staffName || socket.id
      } đã xác nhận thanh toán bàn ${tableNumber}`
    );

    io.to(`order-${orderId}`).emit("payment-acknowledged", {
      orderId: orderId,
      tableNumber: tableNumber,
      staffName: staffName || "Nhân viên",
      message: "Nhân viên đã xác nhận thanh toán",
      timestamp: new Date().toISOString(),
    });
  });

  // === 1️⃣4️⃣ NHÂN VIÊN XÁC NHẬN ĐÃ NHẬN ===
  socket.on("staff-acknowledge-call", (data) => {
    const { tableNumber, orderId, staffName } = data;

    console.log(
      `✅ Nhân viên ${
        staffName || socket.id
      } đã nhận thông báo từ bàn ${tableNumber}`
    );

    io.to(`order-${orderId}`).emit("staff-acknowledged", {
      tableNumber: tableNumber,
      staffName: staffName || "Nhân viên",
      message: "Nhân viên đang đến hỗ trợ bạn",
      timestamp: new Date().toISOString(),
    });
  });

  // === 1️⃣5️⃣ Ngắt kết nối ===
  socket.on("disconnect", (reason) => {
    console.log(
      `🔴 Người dùng đã ngắt kết nối: ${socket.id} - lý do: ${reason}`
    );

    const clientInfo = clientOrders.get(socket.id);
    if (clientInfo) {
      const { orderId } = clientInfo;
      if (activeOrders.has(orderId)) {
        activeOrders.get(orderId).clients.delete(socket.id);

        if (activeOrders.get(orderId).clients.size === 0) {
          activeOrders.delete(orderId);
        }
      }
      clientOrders.delete(socket.id);
    }
  });
});

// ================== API ENDPOINTS ==================
app.get("/active-orders", (req, res) => {
  const orders = Array.from(activeOrders.entries()).map(([orderId, data]) => ({
    orderId,
    status: data.status,
    trackingClients: data.clients.size,
    totalItems: data.items?.length || 0,
    total: data.total || 0,
  }));
  res.json({ orders });
});

app.post("/sync-order", (req, res) => {
  const { orderId, items, total, status } = req.body;

  if (activeOrders.has(orderId)) {
    const order = activeOrders.get(orderId);
    order.items = items;
    order.total = total;
    order.status = status;

    io.to(`order-${orderId}`).emit("order-synced", {
      orderId,
      items,
      total,
      status,
    });

    res.json({ success: true, message: "Order synced" });
  } else {
    res.status(404).json({ success: false, message: "Order not found" });
  }
});

// ================== API NHẬN THÔNG BÁO THANH TOÁN THÀNH CÔNG ==================
app.post("/payment-success", (req, res) => {
  const { orderId, tableNumber, amount, paymentMethod, transactionNo } =
    req.body;

  console.log("\n💳 ==========================================");
  console.log("💳 API: NHẬN THÔNG BÁO THANH TOÁN");
  console.log("💳 ==========================================");
  console.log(`   - Order ID: ${orderId}`);
  console.log(`   - Table Number: ${tableNumber}`);
  console.log(`   - Amount: ${amount?.toLocaleString()}₫`);
  console.log(`   - Payment Method: ${paymentMethod}`);
  console.log(`   - Transaction No: ${transactionNo}`);
  console.log("==========================================\n");

  if (activeOrders.has(orderId.toString())) {
    activeOrders.get(orderId.toString()).status = "PAID";
  }

  io.emit("payment-notification", {
    orderId: orderId,
    tableNumber: tableNumber,
    amount: amount,
    paymentMethod: paymentMethod,
    transactionNo: transactionNo,
    timestamp: new Date().toISOString(),
    notificationType: "PAYMENT_SUCCESS",
  });

  const roomClients = io.sockets.adapter.rooms.get(`order-${orderId}`);
  const clientCount = roomClients ? roomClients.size : 0;
  
  console.log(`📊 Thống kê room order-${orderId}:`);
  console.log(`   - Số clients: ${clientCount}`);
  if (roomClients) {
    console.log(`   - Socket IDs:`, Array.from(roomClients));
  }

  io.to(`order-${orderId}`).emit("order-status-updated", {
    orderId: orderId.toString(),
    status: "PAID",
    updatedAt: new Date().toISOString(),
    updatedBy: "payment-system",
  });

  console.log("✅ Đã gửi thông báo thanh toán đến tất cả nhân viên");
  console.log(`✅ Đã gửi cập nhật trạng thái PAID đến ${clientCount} clients trong room order-${orderId}`);

  return res.status(200).json({
    success: true,
    message: "Payment notification sent successfully",
  });
});

// ================== KHỞI CHẠY SERVER ==================
const PORT = process.env.PORT || 3001; // ✅ SỬA: Dùng PORT từ Railway

server.listen(PORT, '0.0.0.0', () => { // ✅ SỬA: Listen trên 0.0.0.0
  console.log("\n ================================================");
  console.log(` Socket.IO Server đang chạy tại: Port ${PORT}`);
  console.log(` API kiểm tra orders: /active-orders`);
  console.log(` Backend API: ${BACKEND_API_URL}`);
  console.log(" ================================================\n");
});
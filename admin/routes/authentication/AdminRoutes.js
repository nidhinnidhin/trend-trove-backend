const express = require("express");
const {adminLogin, userList, blockUser, unblockUser } = require('../../../admin/controllers/authentication/adminController');
const adminAuthMiddleware = require("../../middleware/adminAuthMiddleware");

const router = express.Router();

router.post("/adminlogin", adminLogin);
router.get("/userlist",adminAuthMiddleware, userList)
router.put("/block/:userId",adminAuthMiddleware, blockUser);
router.put("/unblock/:userId",adminAuthMiddleware, unblockUser);

module.exports = router;

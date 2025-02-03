const express = require("express");
const {adminLogin, userList, blockUser, unblockUser } = require('../controllers/adminController')

const router = express.Router();

router.post("/adminlogin", adminLogin);
router.get("/userlist", userList)
router.put("/block/:userId", blockUser);
router.put("/unblock/:userId", unblockUser);

module.exports = router;

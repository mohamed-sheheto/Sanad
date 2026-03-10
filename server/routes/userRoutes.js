const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/login", authController.login);

router.use(authController.protect);

router.get("/me", authController.getMe);
router.patch("/update", authController.updateMe);
router.patch("/change-password", authController.changePassword);

module.exports = router;

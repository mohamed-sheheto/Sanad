const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/login", authController.login);

router.use(protect); // All routes below require authentication

router.get("/me", authController.getMe);
router.patch("/update", authController.updateMe);
router.patch("/change-password", authController.changePassword);

module.exports = router;

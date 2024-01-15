import express from "express";
import verifyToken from "../middlewares/auth-middleware.js";
import { addCar } from "../controllers/userActions.js";

const router = express.Router();

router.post("/api/add-car", verifyToken, addCar);

export default router;

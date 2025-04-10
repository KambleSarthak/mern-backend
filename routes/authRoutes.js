import { Router } from "express";
import { getTravellerDetails, updateUserProfile, userLogin, userRegister } from "../controllers/authContollers.js";
import { auth } from "../middlewares/authMiddleware.js";
const router = Router();


//-------------------Registration-------------------------

router.post("/user-register", userRegister);


//---------------------Login--------------------------

router.post("/user-login", userLogin);

//---------------------Update Profile--------------------------
router.put("/update-profile", auth, updateUserProfile);

router.get("/traveller/:id", auth, getTravellerDetails);


export default router;

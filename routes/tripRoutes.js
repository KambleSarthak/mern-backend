import { Router } from "express";
import { createTrip, deleteTrip, getMyTrips, getTripById, getTrips, manageJoinRequest, sendJoinRequest, updateTrip, updateTripStatus } from "../controllers/tripControllers.js";
const router = Router();


router.post("/create-trip", createTrip);

router.get("/get-trips", getTrips);
router.get("/get-my-trips", getMyTrips);

router.route("/:id").get(getTripById).put(updateTrip).delete(deleteTrip);
router.route("/:id/request").post(sendJoinRequest);
router.route("/:tripId/requests/:requestId").patch(manageJoinRequest);
router.route("/:id/status").patch(updateTripStatus);


export default router;

import Trip from "../models/tripModel.js";
import catchAsyncError from "../utils/catchAsyncError.js";

/**
 * @desc Create a new trip
 * @route POST /api/trips
 * @access Private (Authenticated Users)
 */
export const createTrip = catchAsyncError(async (req, res) => {
    const { title, description, when, where, slots } = req.body;
    const newTrip = new Trip({ 
        title, 
        description, 
        when, 
        where, 
        slots, 
        createdBy: req.user._id 
    });

    await newTrip.save();
    res.status(201).json(newTrip);
});

/**
 * @desc Get all trips
 * @route GET /api/trips
 * @access Public
 */
// export const getTrips = catchAsyncError(async (req, res) => {
//     const trips = await Trip.find().populate("createdBy", "_id name email");
//     res.status(200).json({
//         trips,
//         message:'Trips fetched successfully'
//     });
// });

export const getTrips = catchAsyncError(async (req, res) => {
    // Set the dynamic radius in km (default is 50 km)
    const radiusKm = req.query.radius ? Number(req.query.radius) : 50;
    // Convert km to degrees (approximation: 1 degree ~111 km)
    const maxDegreeDiff = radiusKm / 111;
  
    // Ensure logged-in user's location is available.
    if (!req.user || !req.user.location || req.user.location.lat == null || req.user.location.lng == null) {
      return res.status(400).json({ message: "User location not available" });
    }
  
    const userLat = req.user.location.lat;
    const userLng = req.user.location.lng;
  
    // Aggregation pipeline:
    const trips = await Trip.aggregate([
      // Join with the users collection to get full creator details.
      {
        $lookup: {
          from: "users", // ensure this matches your users collection name
          localField: "createdBy",
          foreignField: "_id",
          as: "creator",
        },
      },
      { $unwind: "$creator" },
      {
        $match: {
          "creator.role": "traveller",
          // Optionally, exclude trips created by the logged-in user:
          "creator._id": { $ne: req.user._id },
        },
      },
      // Add a field "distance" which is the Euclidean distance (in degrees)
      {
        $addFields: {
          distance: {
            $sqrt: {
              $add: [
                { $pow: [{ $subtract: ["$creator.location.lat", userLat] }, 2] },
                { $pow: [{ $subtract: ["$creator.location.lng", userLng] }, 2] }
              ]
            }
          }
        }
      },
      // Only include trips where the computed distance (in degrees) is less than or equal to maxDegreeDiff.
      {
        $match: {
          distance: { $lte: maxDegreeDiff }
        }
      },
      // Project the desired fields.
      {
        $project: {
          title: 1,
          description: 1,
          when: 1,
          where: 1,
          slots: 1,
          status: 1,
          requests: 1,
          participants: 1,
          createdBy: "$creator", // include creator details
          distance: 1,
        }
      }
    ]);
    
    console.log(trips);
    res.status(200).json({
      trips,
      message: "Trips fetched successfully",
    });
  });
  

/**
 * @desc Get my trips
 * @route GET /api/trips
 * @access Private
 */
export const getMyTrips = catchAsyncError(async (req, res) => {
    const user = req.user;
    console.log(user);

    const trips = await Trip.find({ createdBy: user?._id })
        .populate("requests.user", "firstname lastname email") 
        .populate("participants", "firstname lastname email");

    res.status(200).json({
        trips,
        message: "Trips fetched successfully",
    });
});



export const getTripById = catchAsyncError(async (req, res) => {
    const trip = await Trip.findById(req.params.id).populate("createdBy", "name email").populate("participants", "name email");

    if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
    }

    res.status(200).json(trip);
});


export const updateTrip = catchAsyncError(async (req, res) => {
    const { title, description, when, where, slots, status } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
    }

    trip.title = title || trip.title;
    trip.description = description || trip.description;
    trip.when = when || trip.when;
    trip.where = where || trip.where;
    trip.slots = slots || trip.slots;
    trip.status = status || trip.status;

    await trip.save();
    res.status(200).json(trip);
});


export const deleteTrip = catchAsyncError(async (req, res) => {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
    }

    await trip.deleteOne();
    res.status(200).json({ message: "Trip deleted successfully" });
});


export const sendJoinRequest = catchAsyncError(async (req, res) => {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
    }

    const existingRequest = trip.requests.find(req => req.user.toString() === req.user._id.toString());
    if (existingRequest) {
        return res.status(400).json({ message: "You have already requested to join this trip" });
    }

    trip.requests.push({ user: req.user._id });
    await trip.save();

    res.status(200).json({ message: "Join request sent successfully" });
});


export const manageJoinRequest = catchAsyncError(async (req, res) => {
    const { status } = req.body;
    const { tripId, requestId } = req.params;

    if (!status || !["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status provided" });
    }

    const trip = await Trip.findById(tripId).populate("requests.user");

    if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to manage requests" });
    }

    // Find the request
    const requestIndex = trip.requests.findIndex((r) => r._id.toString() === requestId);
    if (requestIndex === -1) {
        return res.status(404).json({ message: "Join request not found" });
    }

    const request = trip.requests[requestIndex];

    // Prevent duplicate acceptances
    if (status === "accepted") {
        if (trip.participants.includes(request.user._id)) {
            return res.status(400).json({ message: "User already a participant" });
        }

        // Check if the trip still has slots available
        if (trip.participants.length >= trip.slots) {
            return res.status(400).json({ message: "Trip is already full" });
        }

        // Add user to participants
        trip.participants.push(request.user._id);
    }

    // Remove the request from the list
    trip.requests.splice(requestIndex, 1);
    
    if(trip.participants.length === trip.slots){
        trip.status = 'closed'
    }

    await trip.save();
    res.status(200).json({ message: `Join request ${status} successfully` });
});


/**
 * @desc Update trip status
 * @route PATCH /api/trips/:id/status
 * @access Private (Trip Creator Only)
 */
export const updateTripStatus = catchAsyncError(async (req, res) => {
    const { status } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
    }

    if (!["active", "on hold", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
    }

    trip.status = status;
    await trip.save();

    res.status(200).json({ message: `Trip status updated to ${status}` });
});

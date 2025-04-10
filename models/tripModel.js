import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  when: { type: Date, required: true },
  where: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
    city : {type:String},
    state : {type:String},
    country : {type:String},
  },
  slots: { type: Number, required: true, min: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["active", "on hold", "closed"],
    default: "active"
  },
  requests: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" }
    }
  ],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

tripSchema.index({ where: "2dsphere" });

const Trip = mongoose.model("Trip", tripSchema);
export default Trip;

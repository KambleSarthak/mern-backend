import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
// const { Chat } = require("../models/chat");
import Chat  from "../models/chat.js";

const chatRouter = express.Router();

chatRouter.get("/:targetUserId",auth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;
  console.log(userId);

  try {
    console.log("inside chat!!");
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstname lastname",
    });
    // console.log(chat);
    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        messages: [],
      });
      await chat.save();
    }
    res.json(chat);
  } catch (err) {
    console.error(err);
  }
});

// module.exports = chatRouter;
export default chatRouter;
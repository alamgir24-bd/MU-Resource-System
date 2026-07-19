const express = require("express");

const Message = require("../models/Message");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { asyncHandler, cleanText, validateId } = require("../utils/helpers");

const router = express.Router();

/* Send a Message */
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const body = cleanText(req.body.body);
    const recipientId = Number(req.body.recipientId);

    if (!body) {
      return res.status(400).json({ message: "Message body is required" });
    }
    if (!Number.isInteger(recipientId)) {
      return res.status(400).json({ message: "Recipient is required" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }
    if (String(req.user.id) === String(recipientId)) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    const message = await Message.create({
      sender: req.user.id,
      recipient: recipientId,
      body
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: message
    });
  })
);

/* Get conversation between logged-in user and one other user */
router.get(
  "/conversation/:userId",
  authMiddleware,
  validateId("userId"),
  asyncHandler(async (req, res) => {
    const otherId = req.params.userId;

    const messages = await Message.findConversation(req.user.id, otherId);

    await Message.markConversationRead(otherId, req.user.id);

    res.json(messages);
  })
);

/* Get inbox — all unique conversations */
router.get(
  "/inbox",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const messages = await Message.findAllForUser(req.user.id);

    const seen = new Map();

    messages.forEach(msg => {
      const senderId = msg.sender && msg.sender.id !== undefined ? msg.sender.id : msg.sender;
      const recipientId = msg.recipient && msg.recipient.id !== undefined ? msg.recipient.id : msg.recipient;

      const other = String(senderId) === String(req.user.id) ? msg.recipient : msg.sender;
      const otherId = other && other.id !== undefined ? other.id : other;

      if (!seen.has(otherId)) {
        seen.set(otherId, {
          user: other,
          lastMessage: msg.body,
          lastDate: msg.createdAt,
          unread: (String(recipientId) === String(req.user.id) && !msg.readAt) ? 1 : 0
        });
      } else if (String(recipientId) === String(req.user.id) && !msg.readAt) {
        seen.get(otherId).unread += 1;
      }
    });

    res.json(Array.from(seen.values()));
  })
);

module.exports = router;
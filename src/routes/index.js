const express = require("express");
const AppError = require("../utils/AppError");
const router = express.Router();

const { getHealth, getVersion } = require("../controllers/healthController");
const validate = require("../middleware/validate");
const { createUserSchema } = require("../validators/userValidator");
const { createIssueSchema, listIssuesQuerySchema, idParamSchema, updateIssueSchema } = require("../validators/issueValidator");
const { createLogSchema } = require("../validators/logValidator");
const logController = require("../controllers/logController");
const userController = require("../controllers/userController");
const issueController = require("../controllers/issueController");
const authController = require("../controllers/authController");
const {
  signupSchema,
  loginSchema,
} = require("../validators/authValidator");
const auth = require("../middleware/auth");


// Routes
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check server health
 *     responses:
 *       200:
 *         description: Server is running
 */
router.get("/health", getHealth);

router.get("/version", getVersion);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created
 */
router.post("/users", validate(createUserSchema), userController.createUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *         400:
 *             description: Bad request
 *         404:
 *             description: User not found
 *         500:
 *             description: Server error
 *
 */
router.get("/users", userController.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: User not found
 */
router.get("/users/:id", userController.getUser);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

router.post("/issues", auth, validate(createIssueSchema), issueController.createIssue);

router.get("/issues", validate(listIssuesQuerySchema, 'query'), issueController.getIssues);

router.get("/issues/:id", validate(idParamSchema, 'params'), issueController.getIssueById);

router.put("/issues/:id", auth, validate(idParamSchema, 'params'), validate(updateIssueSchema), issueController.updateIssue);

router.delete("/issues/:id", auth, validate(idParamSchema, 'params'), issueController.deleteIssue);

router.post("/issues/:id/logs", auth, validate(idParamSchema, 'params'), validate(createLogSchema), logController.createLog);

router.get("/error", (req, res, next) => {
  next(new AppError("Custom error example", 400));
});

router.post(
  "/signup",
  validate(signupSchema),
  authController.signup
);

router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

module.exports = router;

module.exports = router;

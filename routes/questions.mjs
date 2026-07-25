import { Router } from "express";
import connectionPool from "../utils/db.mjs";
import answerRouter from "./answers.mjs";

const questionRouter = Router();

//post : Create a new question
questionRouter.post("/", async (req, res) => {
  const { title, description, category } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: "Invalid request data." });
  }

  try {
    const newQuestion = await connectionPool.query(
      "INSERT INTO questions (title, description, category) VALUES ($1, $2, $3) RETURNING *",
      [title, description, category]
    );
    return res.status(201).json({
      message: "Question created successfully.",
      data: newQuestion.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create question." });
  }
});

//get : Get all questions
questionRouter.get("/", async (req, res) => {
  try {
    const questions = await connectionPool.query("SELECT * FROM questions");
    return res.status(200).json({
      message: "Questions fetched successfully.",
      data: questions.rows,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch questions." });
  }
});

//get : Search for questions by title or category
// ต้องมาก่อน "/:id" ไม่งั้นคำว่า search จะถูกจับเป็นค่า id
questionRouter.get("/search", async (req, res) => {
  const { title, category } = req.query;

  if (!title && !category) {
    return res.status(400).json({ message: "Invalid search parameters." });
  }

  try {
    const conditions = [];
    const values = [];

    if (title) {
      values.push(`%${title}%`);
      conditions.push(`title ILIKE $${values.length}`);
    }
    if (category) {
      values.push(`%${category}%`);
      conditions.push(`category ILIKE $${values.length}`);
    }

    const questions = await connectionPool.query(
      `SELECT * FROM questions WHERE ${conditions.join(" OR ")}`,
      values
    );

    return res.status(200).json({
      message: "Questions fetched successfully.",
      data: questions.rows,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch questions." });
  }
});

//get : Get a question by id
questionRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const question = await connectionPool.query(
      "SELECT * FROM questions WHERE id = $1",
      [id]
    );
    if (question.rows.length === 0) {
      return res.status(404).json({ message: "Question not found." });
    }
    return res.status(200).json({
      message: "Question fetched successfully.",
      data: question.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch question." });
  }
});

//put : Update a question by id
questionRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, category } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: "Invalid request data." });
  }

  try {
    const updatedQuestion = await connectionPool.query(
      "UPDATE questions SET title = $1, description = $2, category = $3 WHERE id = $4 RETURNING *",
      [title, description, category, id]
    );
    if (updatedQuestion.rows.length === 0) {
      return res.status(404).json({ message: "Question not found." });
    }
    return res.status(200).json({
      message: "Question updated successfully.",
      data: updatedQuestion.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update question." });
  }
});

//delete : Delete a question by id
questionRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedQuestion = await connectionPool.query(
      "DELETE FROM questions WHERE id = $1 RETURNING *",
      [id]
    );
    if (deletedQuestion.rows.length === 0) {
      return res.status(404).json({ message: "Question not found." });
    }
    return res.status(200).json({
      message: "Question post has been deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete question." });
  }
});

//post : vote on a question
questionRouter.post("/:questionId/votes", async (req, res) => {
  const { questionId } = req.params;
  const { vote } = req.body;

  if (vote !== 1 && vote !== -1) {
    return res.status(400).json({ message: "Invalid request data." });
  }

  try {
    const question = await connectionPool.query(
      "SELECT * FROM questions WHERE id = $1",
      [questionId]
    );
    if (question.rows.length === 0) {
      return res.status(404).json({ message: "Question not found." });
    }

    const voteRecord = await connectionPool.query(
      "INSERT INTO question_votes (question_id, vote) VALUES ($1, $2) RETURNING *",
      [questionId, vote]
    );
    return res.status(200).json({
      message: "Vote on the question has been recorded successfully.",
      data: voteRecord.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to vote question." });
  }
});

// รวม endpoint ของ answers ทั้งหมดไว้ใน router ย่อย
questionRouter.use("/:questionId/answers", answerRouter);

export default questionRouter;

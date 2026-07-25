import { Router } from "express";
import connectionPool from "../utils/db.mjs";

// mergeParams ทำให้เข้าถึง :questionId ของ router แม่ (questions) ได้
const answerRouter = Router({ mergeParams: true });

//post : Create an answer for a question
answerRouter.post("/", async (req, res) => {
  const { questionId } = req.params;
  const { content } = req.body;

  if (!content) {
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

    const answer = await connectionPool.query(
      "INSERT INTO answers (question_id, content) VALUES ($1, $2) RETURNING *",
      [questionId, content]
    );
    return res.status(201).json({
      message: "Answer created successfully.",
      data: answer.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create answer." });
  }
});

//get : Get answers for a question
answerRouter.get("/", async (req, res) => {
  const { questionId } = req.params;

  try {
    const question = await connectionPool.query(
      "SELECT * FROM questions WHERE id = $1",
      [questionId]
    );
    if (question.rows.length === 0) {
      return res.status(404).json({ message: "Question not found." });
    }

    const answers = await connectionPool.query(
      "SELECT * FROM answers WHERE question_id = $1",
      [questionId]
    );
    return res.status(200).json({
      message: "Answers fetched successfully.",
      data: answers.rows,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch answers." });
  }
});

//delete : Delete an answer of a question
answerRouter.delete("/:answerId", async (req, res) => {
  const { questionId, answerId } = req.params;

  try {
    const deletedAnswer = await connectionPool.query(
      "DELETE FROM answers WHERE question_id = $1 AND id = $2 RETURNING *",
      [questionId, answerId]
    );
    if (deletedAnswer.rows.length === 0) {
      return res.status(404).json({ message: "Answer not found." });
    }
    return res.status(200).json({
      message: "Answer deleted successfully.",
      data: deletedAnswer.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete answer." });
  }
});

//post : vote on an answer
answerRouter.post("/:answerId/votes", async (req, res) => {
  const { questionId, answerId } = req.params;
  const { vote } = req.body;

  if (vote !== 1 && vote !== -1) {
    return res.status(400).json({ message: "Invalid request data." });
  }

  try {
    const answer = await connectionPool.query(
      "SELECT * FROM answers WHERE question_id = $1 AND id = $2",
      [questionId, answerId]
    );
    if (answer.rows.length === 0) {
      return res.status(404).json({ message: "Answer not found." });
    }

    const voteRecord = await connectionPool.query(
      "INSERT INTO answer_votes (answer_id, vote) VALUES ($1, $2) RETURNING *",
      [answerId, vote]
    );
    return res.status(200).json({
      message: "Vote on the answer has been recorded successfully.",
      data: voteRecord.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to vote answer." });
  }
});

export default answerRouter;

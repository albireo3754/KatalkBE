import express from "express";
;
const router = express.Router();

router.get("/", (req: express.Request, res: express.Response) => {
  res.send("Hello Wor3ld!");
});

export default router;

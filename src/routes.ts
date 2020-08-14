import { Router } from "express";

import { index, store } from "./controllers/GameController";

const routes = Router();

routes.get("/", (req, res) => {
  return res.json({ Message: "Hello World" });
});

routes.post("/games", store);
routes.get("/games", index);

export default routes;

import "./config/environment";
import "./config/database";
import app from "./app";

const { SERVER_PORT } = process.env;

app.listen(SERVER_PORT, () => {
  console.log(`Listening: ${SERVER_PORT}`);
});

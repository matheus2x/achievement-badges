import mongoose from "mongoose";

const GameSchema = new mongoose.Schema({
  user_id: String,
  game_id: Number,
  game_name: String,
  game_thumb: String,
  achievs_data: [Object],
  achievs_length: Number,
  play_time_total: Number,
  play_time_recent: Number,
});

export default mongoose.model("Game", GameSchema);

import axios from "axios";
import { GluegunCommand } from "gluegun";

import "../../config/environment";

const { SERVER_HOST, SERVER_PORT } = process.env;
const api = axios.create({ baseURL: `${SERVER_HOST}:${SERVER_PORT}` });

const genBadge: GluegunCommand = {
  name: "gen:badge",
  description: "gen a steam achievement badge for a 100% game",
  run: async (toolbox) => {
    const {
      parameters,
      template,
      print: { success, error },
    } = toolbox;

    if (!parameters.first) {
      error("error: missing user_id");
      return;
    }

    if (!parameters.second) {
      error("error: missing game_id");
      return;
    }

    const response = await api.post("/games", {
      user_id: parameters.first.toString(),
      game_id: parameters.second,
    });

    const {
      game_thumb,
      game_name,
      play_time_total,
      play_time_recent,
      achievs_data,
      achievs_length,
    } = response.data;

    await template.generate({
      template: "badge.ts.ejs",
      target: `dist/${game_name.replace(/\s/g, "")}.html`,
      props: {
        game_thumb,
        game_name,
        play_time_total,
        play_time_recent,
        achievs_length,
        icon1: achievs_data[0].icon,
        icon2: achievs_data[1].icon,
        icon3: achievs_data[2].icon,
        icon4: achievs_data[3].icon,
        icon5: achievs_data[4].icon,
        remaining: achievs_length - 5,
      },
    });

    success(`Successful! badge for game "${game_name}" generated!`);
  },
};

module.exports = genBadge;

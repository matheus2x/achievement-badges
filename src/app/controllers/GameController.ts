import axios from "axios";
import { Request, Response } from "express";

import Game from "../models/Game";

const steamAPI = axios.create({ baseURL: "http://api.steampowered.com" });
const { STEAM_KEY } = process.env;

export async function store(req: Request, res: Response) {
  const { user_id, game_id } = req.body;

  const checkGameExist = await Game.findOne({ game_id });

  if (checkGameExist) {
    return res.json({ error: "Game already registered." }).status(401);
  }

  const getDataURL = `?appid=${game_id}&key=${STEAM_KEY}&steamid=${user_id}`;

  const getSchemaForAchievsURL = "/ISteamUserStats/GetPlayerAchievements/v0001";
  const getSchemaForAchievs = `${getSchemaForAchievsURL}/${getDataURL}`;
  const schemaForAchievs = await steamAPI.get(getSchemaForAchievs);

  interface schemaForAchievsData {
    apiname?: string;
    achieved: number;
    unlocktime: number;
  }

  const schemaForAchievsData = schemaForAchievs.data.playerstats.achievements;

  const allAchievsHaveMade = schemaForAchievsData
    .map((achiev: schemaForAchievsData) => {
      return { achieved: achiev.achieved };
    })
    .every((achiev: schemaForAchievsData) => achiev.achieved === 1);

  if (!allAchievsHaveMade) {
    return res.json({ error: "You dont have 100% achievements" }).status(401);
  }

  const getSchemaForGameURL = "/ISteamUserStats/GetSchemaForGame/v2";
  const getSchemaForGame = `${getSchemaForGameURL}/${getDataURL}`;
  const schemaForGame = await steamAPI.get(getSchemaForGame);

  const schemaForGameData = schemaForGame.data.game;

  interface achiev_icons {
    name: string;
    icon: string;
  }

  const achievs_info: {
    name: string;
    unlock_time: number;
    icon: string;
  }[] = [];
  const achievs_iconsData = schemaForGameData.availableGameStats.achievements;

  Object.keys(schemaForAchievsData).forEach((key) => {
    const getGameIcon = achievs_iconsData.find(
      (game: achiev_icons) => game.name === schemaForAchievsData[key].apiname
    );

    achievs_info.push({
      name: schemaForAchievsData[key].apiname,
      unlock_time: schemaForAchievsData[key].unlocktime,
      icon: getGameIcon.icon,
    });
  });

  const achievs_data = achievs_info
    .sort((a, b) => {
      if (a.unlock_time < b.unlock_time) return 1;
      return -1;
    })
    .slice(0, 5);

  const game_name = schemaForGameData.gameName;
  const game_thumb = `https://steamcdn-a.akamaihd.net/steam/apps/${game_id}/header.jpg`;
  const achievs_length =
    schemaForGameData.availableGameStats.achievements.length;

  const getSchemaRecentlyURL = "/IPlayerService/GetRecentlyPlayedGames/v0001";
  const getSchemaRecently = `${getSchemaRecentlyURL}/?key=${STEAM_KEY}&steamid=${user_id}`;
  const schemaRecently = await steamAPI.get(getSchemaRecently);

  const schemaRecentlyData = schemaRecently.data.response.games;

  interface schemaRecentlyData {
    appid: number;
    name: string;
    playtime_2weeks: number;
    playtime_forever: number;
  }

  const [{ time_recent, time_total }] = schemaRecentlyData
    .map((game: schemaRecentlyData) => {
      if (game.appid === game_id) {
        return {
          time_recent: game.playtime_2weeks,
          time_total: game.playtime_forever,
        };
      }

      return null;
    })
    .filter((item: schemaRecentlyData) => {
      return item !== null;
    });

  const play_time_recent = Math.round(((time_recent / 60) * 100) / 100).toFixed(
    2
  );

  const play_time_total = Math.round(((time_total / 60) * 100) / 100).toFixed(
    2
  );

  const game = await Game.create({
    user_id,
    game_id,
    game_name,
    game_thumb,
    achievs_length,
    play_time_recent,
    play_time_total,
    achievs_data,
  });

  return res.json(game);
}

export async function index(req: Request, res: Response) {
  const games = await Game.find();

  return res.json(games);
}

import { create } from "zustand";
import { ROBOT_COLORS } from "../services/robotColors.js";

export const usePlayerStore = create((set) => ({
  nickname: "",
  color: ROBOT_COLORS[0],

  setNickname: (nickname) => set({ nickname: nickname.slice(0, 16) }),
  setColor: (color) => set({ color }),
}));

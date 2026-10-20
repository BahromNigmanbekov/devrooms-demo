import { persist } from "zustand/middleware";
import { create } from "zustand";
import { ROBOT_COLORS } from "../services/robotColors.js";
import {sanitizeEquipment} from '../../../shared/equipment.mjs';

export const usePlayerStore = create(persist((set) => ({
  equipment: {head:"none",back:"none",weapon:"none"},
  setEquipment: (equipment) => set({equipment:sanitizeEquipment(equipment)}),
  nickname: "",
  color: ROBOT_COLORS[0],

  setNickname: (nickname) => set({ nickname: nickname.slice(0, 16) }),
  setColor: (color) => set({ color }),
}), {name:"devrooms-player-v1",merge:(saved,current)=>({...current,...saved,equipment:sanitizeEquipment(saved?.equipment)})}));

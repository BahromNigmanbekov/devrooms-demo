import {HTML_ACTIVITIES,HTML_TASKS_BY_ID} from "../../../shared/htmlActivities.mjs";
export const TASKS_BY_ID=HTML_TASKS_BY_ID;
export const DEFAULT_TASK=HTML_ACTIVITIES[0];
export function getTaskForId(id){return TASKS_BY_ID[id]||DEFAULT_TASK;}

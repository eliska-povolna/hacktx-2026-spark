import { queryOptions } from "@tanstack/react-query";
import { getSavedTeams } from "./client";

export const savedTeamsQueryOptions = queryOptions({
  queryKey: ["saved-teams"],
  queryFn: getSavedTeams,
  staleTime: 30_000,
});
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { setAuthTokenGetter } from "@workspace/api-client-react/custom-fetch";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

setAuthTokenGetter(() => localStorage.getItem("token"));

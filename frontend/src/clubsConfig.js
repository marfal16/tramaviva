import { BookOpen, Film } from "lucide-react";

// Aggiungi qui i nuovi club: tutti i componenti li leggono da questo file.
export const CLUBS_CONFIG = [
  {
    key: "club-del-libro",
    label: "Club del Libro",
    path: "/club-del-libro",
    icon: BookOpen,
    iconColor: "text-tv-green-deep",
    accent: "tv-green",
  },
  {
    key: "cineforum",
    label: "Cineforum",
    path: "/cineforum",
    icon: Film,
    iconColor: "text-tv-sky",
    accent: "tv-sky",
  },
];

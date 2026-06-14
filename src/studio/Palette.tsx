import {
  ChevronsUp,
  CircleDollarSign,
  Eraser,
  Flag,
  Ghost,
  MapPin,
  Square,
  Triangle,
  type LucideIcon,
} from "lucide-react";
import { Tile, type Brush } from "../engine/types";

interface Item {
  brush: Brush;
  label: string;
  icon: LucideIcon;
  tint: string;
  key: string;
}

export const PALETTE: Item[] = [
  { brush: Tile.Solid, label: "Ground", icon: Square, tint: "#5a63a0", key: "1" },
  { brush: Tile.Spike, label: "Spikes", icon: Triangle, tint: "#e5575d", key: "2" },
  { brush: Tile.Coin, label: "Coin", icon: CircleDollarSign, tint: "#ffd05a", key: "3" },
  { brush: Tile.Enemy, label: "Enemy", icon: Ghost, tint: "#bb7cf2", key: "4" },
  { brush: Tile.Spring, label: "Spring", icon: ChevronsUp, tint: "#a99bff", key: "5" },
  { brush: Tile.Goal, label: "Flag", icon: Flag, tint: "#54e0ad", key: "6" },
  { brush: "spawn", label: "Start", icon: MapPin, tint: "#f4ebd6", key: "7" },
  { brush: "eraser", label: "Eraser", icon: Eraser, tint: "#9aa3c0", key: "8" },
];

export function Palette({ tool, onPick }: { tool: Brush; onPick: (b: Brush) => void }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      {PALETTE.map((it) => {
        const active = it.brush === tool;
        const Icon = it.icon;
        return (
          <button
            key={it.label}
            onClick={() => onPick(it.brush)}
            title={`${it.label} (${it.key})`}
            className={`group flex shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2 transition ${
              active
                ? "border-white/25 bg-white/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.06]"
            }`}
          >
            <Icon size={20} style={{ color: it.tint }} strokeWidth={2} />
            <span className={`text-[11px] ${active ? "text-white" : "text-white/55"}`}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

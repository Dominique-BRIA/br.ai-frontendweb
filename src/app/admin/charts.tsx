"use client";

import { Table2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  AreaChart as RechartsArea,
  BarChart as RechartsBar,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import { number } from "./api";

/*
 * Graphiques du tableau de bord, d'après la méthode dataviz : marques fines (colonnes de 24 px
 * au plus, bout arrondi de 4 px, lignes de 2 px), grille d'un pixel discrète, légende dès deux
 * séries, info-bulle au survol et, pour chaque graphique, les mêmes données en tableau.
 * Les couleurs viennent des variables --series-*, --heat-* et --status-* (globals.css).
 */

export interface Series {
  key: string;
  label: string;
  color: string;
}

const axisTick = { fontSize: 12, fill: "var(--muted)" };

/** « lun. 3 », pour l'axe et l'info-bulle. */
export const shortDay = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
  });

/** Légende : la marque à gauche (rectangle pour colonnes et aires, trait pour lignes). */
export function Legend({
  items,
  shape = "rect",
}: {
  items: { label: string; color: string }[];
  shape?: "rect" | "line";
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={
              shape === "line" ? "h-0.5 w-3 rounded" : "h-2.5 w-2.5 rounded-sm"
            }
            style={{ background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Carte d'un graphique : titre, légende, et le bouton « Tableau » qui montre les mêmes valeurs
 * sans survol (utile au clavier, à l'impression et quand une couleur se lit mal).
 */
export function ChartCard({
  title,
  description,
  legend,
  table,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  legend?: ReactNode;
  table: { head: string[]; rows: (string | number)[][] };
  children: ReactNode;
  className?: string;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section
      className={`flex flex-col rounded-xl bg-card p-5 shadow-sm ring-1 ring-border ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{title}</h3>
          {description && (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setAsTable(!asTable)}
          aria-pressed={asTable}
          title={asTable ? "Revenir au graphique" : "Voir les données"}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors hover:bg-accent-soft ${
            asTable ? "bg-accent-soft text-accent" : "text-muted"
          }`}
        >
          <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
          Tableau
        </button>
      </div>
      {!asTable && legend && <div className="mb-3">{legend}</div>}
      {asTable ? (
        <div className="max-h-72 overflow-auto rounded-lg ring-1 ring-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr>
                {table.head.map((label) => (
                  <th
                    key={label}
                    className="px-3 py-2 text-left text-xs font-semibold text-muted"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {table.rows.map((row) => (
                <tr key={String(row[0])}>
                  {row.map((cell, index) => (
                    <td
                      // biome-ignore lint/suspicious/noArrayIndexKey: les colonnes suivent l'en-tête.
                      key={index}
                      className="px-3 py-1.5"
                    >
                      {typeof cell === "number" ? number(cell) : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

/** Info-bulle : la valeur en gras d'abord, le nom de la série ensuite, avec un trait de sa couleur. */
function ChartTooltip({
  active,
  payload,
  label,
  formatLabel,
}: Partial<TooltipContentProps<number, string>> & {
  formatLabel?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-card px-3 py-2 text-sm shadow-lg ring-1 ring-border">
      <p className="mb-1 text-xs text-muted">
        {formatLabel ? formatLabel(String(label)) : String(label)}
      </p>
      {payload
        .slice()
        .reverse()
        .map((item) => (
          <p key={String(item.dataKey)} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-0.5 w-3 rounded"
              style={{ background: item.color }}
            />
            <span className="font-semibold tabular-nums">
              {number(Number(item.value ?? 0))}
            </span>
            <span className="text-muted">{item.name}</span>
          </p>
        ))}
    </div>
  );
}

/** Colonnes par jour, empilées quand il y a plusieurs séries. */
export function DailyColumns({
  data,
  series,
}: {
  data: Record<string, string | number>[];
  series: Series[];
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar
          data={data}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDay}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={36}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "var(--accent-soft)" }}
            content={<ChartTooltip formatLabel={shortDay} />}
          />
          {series.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              stackId="jour"
              fill={item.color}
              maxBarSize={24}
              // L'écart de 2 px couleur de la carte sépare les segments empilés.
              stroke="var(--card)"
              strokeWidth={series.length > 1 ? 1 : 0}
              radius={index === series.length - 1 ? [4, 4, 0, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}

/** Une seule grandeur par jour, en aire légère. */
export function DailyArea({
  data,
  dataKey,
  label,
  color = "var(--series-1)",
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsArea
          data={data}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDay}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={44}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted)", strokeWidth: 1 }}
            content={<ChartTooltip formatLabel={shortDay} />}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            name={label}
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.1}
            activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </RechartsArea>
      </ResponsiveContainer>
    </div>
  );
}

/** Les heures de la journée, de 0 à 23. */
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const WEEKDAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

/** Heures de pointe : une case par jour de la semaine et par heure, plus foncée quand c'est plus actif. */
export function Heatmap({
  cells,
}: {
  cells: { weekday: number; hour: number; value: number }[];
}) {
  const max = Math.max(1, ...cells.map((cell) => cell.value));
  const valueAt = (weekday: number, hour: number) =>
    cells.find((cell) => cell.weekday === weekday && cell.hour === hour)
      ?.value ?? 0;
  const step = (value: number) =>
    value === 0 ? 0 : Math.min(5, Math.ceil((value / max) * 5));
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[560px] grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[2px] text-[10px] text-muted">
        <span />
        {HOURS.map((hour) => (
          <span key={hour} className="text-center tabular-nums">
            {hour % 3 === 0 ? `${hour}h` : ""}
          </span>
        ))}
        {WEEKDAYS.map((weekday, index) => (
          <div key={weekday} className="contents">
            <span className="flex items-center text-xs">{weekday}</span>
            {HOURS.map((hour) => {
              const value = valueAt(index + 1, hour);
              const label = `${weekday} ${hour}h : ${number(value)} message${value > 1 ? "s" : ""}`;
              return (
                <span
                  key={hour}
                  title={label}
                  role="img"
                  aria-label={label}
                  className="aspect-square rounded-[3px] transition-transform hover:scale-125"
                  style={{ background: `var(--heat-${step(value)})` }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <span>Moins</span>
        {[0, 1, 2, 3, 4, 5].map((level) => (
          <span
            key={level}
            aria-hidden="true"
            className="h-3 w-3 rounded-[3px]"
            style={{ background: `var(--heat-${level})` }}
          />
        ))}
        <span>Plus</span>
      </div>
    </div>
  );
}

/** Une barre découpée en parts (un tout), chaque part avec sa couleur d'état et sa part en %. */
export function SegmentedBar({
  parts,
}: {
  parts: { label: string; value: number; color: string; ink: string }[];
}) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (total === 0)
    return <p className="text-sm text-muted">Rien sur cette période.</p>;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-7 gap-[2px]">
        {parts
          .filter((part) => part.value > 0)
          .map((part) => {
            const share = Math.round((part.value / total) * 100);
            return (
              <div
                key={part.label}
                title={`${part.label} : ${number(part.value)} (${share} %)`}
                className="flex items-center overflow-hidden rounded px-2 text-xs font-semibold"
                style={{
                  width: `${(part.value / total) * 100}%`,
                  background: part.color,
                  color: part.ink,
                }}
              >
                {share >= 12 ? `${share} %` : ""}
              </div>
            );
          })}
      </div>
      <Legend
        items={parts.map((part) => ({
          label: `${part.label} (${number(part.value)})`,
          color: part.color,
        }))}
      />
    </div>
  );
}

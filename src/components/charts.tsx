"use client";

import { useState } from "react";
import { money, moneyShort } from "@/lib/format";

export interface Series {
  key: string;
  label: string;
  color: string;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

/** Grouped columns with one shared axis, a legend, hover tooltip and a table view. */
export function ColumnChart({
  data,
  series,
  height = 260,
  label,
}: {
  data: ({ label: string } & Record<string, number | string>)[];
  series: Series[];
  height?: number;
  label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const max = niceMax(Math.max(...data.flatMap((d) => series.map((s) => Number(d[s.key])))));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const W = 720;
  const H = height;
  const pad = { l: 56, r: 8, t: 12, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const band = iw / data.length;
  const barW = Math.min(18, (band - 10) / series.length - 2);
  const y = (v: number) => pad.t + ih - (v / max) * ih;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-4" aria-label="Legend">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-2 text-[13px] font-semibold text-muted">
              <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setAsTable((v) => !v)} className="text-[13px] font-semibold text-primary hover:underline">
          {asTable ? "Grafik koʻrinishi" : "Jadval koʻrinishi"}
        </button>
      </div>

      {asTable ? (
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4">Oy</th>
                {series.map((s) => (
                  <th key={s.key} className="py-2 pr-4 text-right">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label} className="border-t border-border">
                  <td className="py-2 pr-4 font-semibold">{d.label}</td>
                  {series.map((s) => (
                    <td key={s.key} className="num py-2 pr-4 text-right">
                      {money(Number(d[s.key]))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={label}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth="1" />
                <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--muted)">
                  {moneyShort(t).replace(" mln", "M").replace(" ming", "K")}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const gx = pad.l + i * band + (band - series.length * (barW + 2)) / 2;
              return (
                <g key={d.label}>
                  {hover === i && <rect x={pad.l + i * band} y={pad.t} width={band} height={ih} fill="black" opacity="0.035" />}
                  {series.map((s, si) => {
                    const v = Number(d[s.key]);
                    const top = y(v);
                    const h = Math.max(0, pad.t + ih - top);
                    const x = gx + si * (barW + 2);
                    const r = Math.min(4, h);
                    return (
                      <path
                        key={s.key}
                        d={`M${x},${pad.t + ih} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${pad.t + ih} Z`}
                        fill={s.color}
                      />
                    );
                  })}
                  <text x={pad.l + i * band + band / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">
                    {d.label}
                  </text>
                  <rect
                    x={pad.l + i * band}
                    y={pad.t}
                    width={band}
                    height={ih}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  />
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] shadow-lg"
              style={{
                left: `${((pad.l + hover * band + band / 2) / W) * 100}%`,
                transform: hover > data.length / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
              }}
            >
              <p className="mb-1 font-bold">{data[hover].label}</p>
              {series.map((s) => (
                <p key={s.key} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-muted">
                    <span className="size-2 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
                    {s.label}
                  </span>
                  <span className="num font-semibold">{money(Number(data[hover][s.key]))}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
